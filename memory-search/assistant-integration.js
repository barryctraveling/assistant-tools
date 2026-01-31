/**
 * Memory Search - Assistant Integration
 * 供助手工具箱調用的接口
 */

const path = require('path');
const MemorySearch = require('./src/index');

// 默認數據庫路徑
const DB_PATH = path.join(__dirname, 'data', 'memory_search.db');
const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');

let searchInstance = null;

/**
 * 獲取搜尋實例（單例）
 */
function getSearch() {
  if (!searchInstance) {
    const fs = require('fs');
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    searchInstance = new MemorySearch(DB_PATH);
  }
  return searchInstance;
}

/**
 * 索引記憶文件
 */
function indexMemory(dir = MEMORY_DIR) {
  const search = getSearch();
  return search.indexDirectory(dir);
}

/**
 * 搜尋記憶
 */
function searchMemory(query, limit = 5) {
  const search = getSearch();
  return search.search(query, limit);
}

/**
 * 搜尋並格式化結果
 */
function searchMemoryBrief(query, limit = 3) {
  const results = searchMemory(query, limit);
  
  if (results.length === 0) {
    return `🔍 搜尋「${query}」：無結果`;
  }

  const lines = [`🔍 搜尋「${query}」：找到 ${results.length} 條相關記錄\n`];
  
  results.forEach((r, i) => {
    const fileName = path.basename(r.source);
    const preview = r.text.substring(0, 100).replace(/\n/g, ' ');
    lines.push(`${i + 1}. [${fileName}:${r.startLine}] ${preview}...`);
  });

  return lines.join('\n');
}

/**
 * 獲取統計
 */
function getStats() {
  const search = getSearch();
  return search.getStats();
}

/**
 * 重建索引
 */
function rebuildIndex(dir = MEMORY_DIR) {
  const search = getSearch();
  search.clear();
  return search.indexDirectory(dir);
}

module.exports = {
  indexMemory,
  searchMemory,
  searchMemoryBrief,
  getStats,
  rebuildIndex,
  MEMORY_DIR,
  DB_PATH
};
