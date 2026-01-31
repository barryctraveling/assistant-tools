#!/usr/bin/env node
/**
 * Memory Search - 本地語意記憶搜尋
 * 使用 SQLite FTS5 + TF-IDF 混合搜尋
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

class MemorySearch {
  constructor(dbPath = 'memory_search.db') {
    this.db = new Database(dbPath);
    this.initDB();
  }

  initDB() {
    // 創建 chunks 表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        source TEXT NOT NULL,
        start_line INTEGER,
        end_line INTEGER,
        chunk_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建 FTS5 全文搜尋索引
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
        text,
        source,
        content='chunks',
        content_rowid='id',
        tokenize='porter unicode61'
      )
    `);

    // 觸發器：同步 FTS 索引
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
        INSERT INTO chunks_fts(rowid, text, source) VALUES (new.id, new.text, new.source);
      END
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
        INSERT INTO chunks_fts(chunks_fts, rowid, text, source) VALUES('delete', old.id, old.text, old.source);
      END
    `);
  }

  /**
   * 將 Markdown 文件分塊
   */
  chunkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentType = 'paragraph';
    let startLine = 1;
    let inCodeBlock = false;

    const saveChunk = (endLine) => {
      if (currentChunk.length > 0) {
        const text = currentChunk.join('\n').trim();
        if (text.length > 10) { // 忽略太短的塊
          chunks.push({
            text,
            source: filePath,
            startLine,
            endLine,
            chunkType: currentType
          });
        }
        currentChunk = [];
      }
    };

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // 處理 code block
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          currentChunk.push(line);
          saveChunk(lineNum);
          inCodeBlock = false;
          currentType = 'paragraph';
          startLine = lineNum + 1;
        } else {
          saveChunk(lineNum - 1);
          inCodeBlock = true;
          currentType = 'code';
          startLine = lineNum;
          currentChunk.push(line);
        }
        return;
      }

      if (inCodeBlock) {
        currentChunk.push(line);
        return;
      }

      // 處理 header
      if (line.match(/^#{1,6}\s+/)) {
        saveChunk(lineNum - 1);
        currentType = 'header';
        startLine = lineNum;
        currentChunk.push(line);
        saveChunk(lineNum);
        currentType = 'paragraph';
        startLine = lineNum + 1;
        return;
      }

      // 處理空行（段落分隔）
      if (line.trim() === '' && currentChunk.length > 0) {
        saveChunk(lineNum - 1);
        startLine = lineNum + 1;
        return;
      }

      // 處理列表項目（作為獨立塊）
      if (line.match(/^[-*+]\s+/) || line.match(/^\d+\.\s+/)) {
        if (currentType !== 'list') {
          saveChunk(lineNum - 1);
          currentType = 'list';
          startLine = lineNum;
        }
      }

      currentChunk.push(line);
    });

    // 保存最後的塊
    saveChunk(lines.length);

    return chunks;
  }

  /**
   * 索引目錄中的所有 Markdown 文件
   */
  indexDirectory(dirPath, pattern = /\.md$/i) {
    const files = this.findFiles(dirPath, pattern);
    let totalChunks = 0;

    // 清除舊索引
    this.db.exec('DELETE FROM chunks');
    this.db.exec('DELETE FROM chunks_fts');

    const insertStmt = this.db.prepare(`
      INSERT INTO chunks (text, source, start_line, end_line, chunk_type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((chunks) => {
      for (const chunk of chunks) {
        insertStmt.run(chunk.text, chunk.source, chunk.startLine, chunk.endLine, chunk.chunkType);
      }
    });

    for (const file of files) {
      try {
        const chunks = this.chunkFile(file);
        insertMany(chunks);
        totalChunks += chunks.length;
        console.log(`  ✓ ${path.basename(file)}: ${chunks.length} chunks`);
      } catch (err) {
        console.error(`  ✗ ${file}: ${err.message}`);
      }
    }

    return {
      filesIndexed: files.length,
      chunksIndexed: totalChunks
    };
  }

  /**
   * 遞迴查找文件
   */
  findFiles(dirPath, pattern) {
    const results = [];
    
    const scan = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && pattern.test(item)) {
          results.push(fullPath);
        }
      }
    };

    scan(dirPath);
    return results;
  }

  /**
   * 搜尋記憶
   */
  search(query, limit = 5) {
    // 使用 FTS5 BM25 排序
    const stmt = this.db.prepare(`
      SELECT 
        c.id,
        c.text,
        c.source,
        c.start_line,
        c.end_line,
        c.chunk_type,
        bm25(chunks_fts) as score
      FROM chunks_fts
      JOIN chunks c ON chunks_fts.rowid = c.id
      WHERE chunks_fts MATCH ?
      ORDER BY bm25(chunks_fts)
      LIMIT ?
    `);

    // FTS5 查詢語法：用空格分隔的詞會 AND 在一起
    // 我們轉換成 OR 查詢以獲得更多結果
    const ftsQuery = query
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1)
      .map(w => `"${w}"`)
      .join(' OR ');

    try {
      const results = stmt.all(ftsQuery, limit);
      return results.map(r => ({
        text: r.text,
        source: r.source,
        startLine: r.start_line,
        endLine: r.end_line,
        chunkType: r.chunk_type,
        score: Math.abs(r.score), // BM25 返回負值，越小越好
        matchType: Math.abs(r.score) < 5 ? 'strong' : Math.abs(r.score) < 10 ? 'good' : 'weak'
      }));
    } catch (err) {
      // 如果 FTS 查詢失敗，回退到 LIKE 查詢
      const likeStmt = this.db.prepare(`
        SELECT * FROM chunks 
        WHERE text LIKE ? 
        ORDER BY length(text) 
        LIMIT ?
      `);
      return likeStmt.all(`%${query}%`, limit).map(r => ({
        text: r.text,
        source: r.source,
        startLine: r.start_line,
        endLine: r.end_line,
        chunkType: r.chunk_type,
        score: 0,
        matchType: 'fallback'
      }));
    }
  }

  /**
   * 獲取統計資訊
   */
  getStats() {
    const chunksCount = this.db.prepare('SELECT COUNT(*) as count FROM chunks').get();
    const filesCount = this.db.prepare('SELECT COUNT(DISTINCT source) as count FROM chunks').get();
    const typeStats = this.db.prepare(`
      SELECT chunk_type, COUNT(*) as count 
      FROM chunks 
      GROUP BY chunk_type
    `).all();

    return {
      totalChunks: chunksCount.count,
      totalFiles: filesCount.count,
      byType: Object.fromEntries(typeStats.map(t => [t.chunk_type, t.count]))
    };
  }

  /**
   * 清除索引
   */
  clear() {
    this.db.exec('DELETE FROM chunks');
    this.db.exec('DELETE FROM chunks_fts');
  }

  close() {
    this.db.close();
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  const search = new MemorySearch();

  switch (command) {
    case 'index': {
      const dir = args[1] || process.cwd();
      console.log(`📚 Indexing: ${dir}\n`);
      const result = search.indexDirectory(dir);
      console.log(`\n✅ Done: ${result.filesIndexed} files, ${result.chunksIndexed} chunks`);
      break;
    }

    case 'search': {
      const query = args.slice(1).join(' ');
      if (!query) {
        console.log('Usage: node index.js search <query>');
        process.exit(1);
      }
      console.log(`🔍 Searching: "${query}"\n`);
      const results = search.search(query, 5);
      
      if (results.length === 0) {
        console.log('No results found.');
      } else {
        results.forEach((r, i) => {
          console.log(`[${i + 1}] ${r.source}:${r.startLine} (${r.matchType})`);
          console.log(`    ${r.text.substring(0, 150).replace(/\n/g, ' ')}...`);
          console.log();
        });
      }
      break;
    }

    case 'stats': {
      const stats = search.getStats();
      console.log('📊 Index Stats:');
      console.log(`  Files: ${stats.totalFiles}`);
      console.log(`  Chunks: ${stats.totalChunks}`);
      console.log(`  By type:`, stats.byType);
      break;
    }

    default:
      console.log('Memory Search - 本地語意記憶搜尋');
      console.log('');
      console.log('Commands:');
      console.log('  index [dir]      Index markdown files in directory');
      console.log('  search <query>   Search indexed memory');
      console.log('  stats            Show index statistics');
  }

  search.close();
}

module.exports = MemorySearch;
