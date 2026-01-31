/**
 * AI 助理輔助函數
 * 這些函數專門設計給 OpenClaw 助理使用
 * 
 * 使用方式：由助理透過 exec 呼叫
 */

const { ArticleAnalyzer } = require('./lib/analyzer');
const { KnowledgeBase } = require('./lib/knowledge');

/**
 * 分析文章內容（不需要抓取 URL，內容由助理提供）
 * 
 * 輸入：文章內容文字
 * 輸出：JSON 格式的分析結果
 */
async function analyzeContent(content, url = '', title = '') {
  const analyzer = new ArticleAnalyzer();
  const result = analyzer.analyze(content, url);
  
  // 如果提供了標題，使用提供的標題
  if (title) {
    result.title = title;
  }

  // 載入知識庫查詢相關文章
  const kb = new KnowledgeBase();
  await kb.load();
  result.relatedArticles = kb.findRelated(result.tags, url);
  result.kbStats = kb.getStats();

  return result;
}

/**
 * 取得知識庫統計
 */
async function getKnowledgeStats() {
  const kb = new KnowledgeBase();
  await kb.load();
  return {
    stats: kb.getStats(),
    recent: kb.getRecent(5),
    report: kb.generateReport(),
  };
}

/**
 * 搜尋知識庫
 */
async function searchKnowledge(query) {
  const kb = new KnowledgeBase();
  await kb.load();
  return kb.search(query);
}

/**
 * 新增文章到知識庫（在 Notion 寫入後呼叫）
 */
async function addToKnowledge(articleData) {
  const kb = new KnowledgeBase();
  await kb.load();
  const entry = await kb.addArticle(articleData);
  return {
    success: true,
    entry,
    totalArticles: kb.articles.length,
  };
}

/**
 * 依標籤查詢文章
 */
async function getByTag(tag) {
  const kb = new KnowledgeBase();
  await kb.load();
  return kb.getByTag(tag);
}

/**
 * 依分類查詢文章
 */
async function getByCategory(category) {
  const kb = new KnowledgeBase();
  await kb.load();
  return kb.getByCategory(category);
}

// CLI 入口點
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    let result;

    switch (command) {
      case 'stats':
        result = await getKnowledgeStats();
        break;
      
      case 'search':
        result = await searchKnowledge(args[1] || '');
        break;
      
      case 'tag':
        result = await getByTag(args[1] || '');
        break;
      
      case 'category':
        result = await getByCategory(args[1] || '');
        break;
      
      case 'analyze':
        // 從 stdin 讀取內容
        const chunks = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk);
        }
        const content = Buffer.concat(chunks).toString('utf-8');
        const url = args[1] || '';
        const title = args[2] || '';
        result = await analyzeContent(content, url, title);
        break;

      default:
        console.log('用法:');
        console.log('  node assistant-helpers.js stats');
        console.log('  node assistant-helpers.js search <query>');
        console.log('  node assistant-helpers.js tag <tag>');
        console.log('  node assistant-helpers.js category <category>');
        console.log('  echo "<content>" | node assistant-helpers.js analyze [url] [title]');
        process.exit(1);
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeContent,
  getKnowledgeStats,
  searchKnowledge,
  addToKnowledge,
  getByTag,
  getByCategory,
};
