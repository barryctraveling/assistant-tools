/**
 * Fintech 新聞追蹤 - 助手整合
 * 
 * 提供給助手使用的高層 API
 * 助手應配合 web_search 工具使用這些函數
 */

const { TOPICS, CACHE_FILE, readJSON, writeJSON } = require('./src/config');
const { parseSearchResults, filterNewItems, markAsSeen, rankAndFilter } = require('./src/sources/search');
const { formatNewsList, formatByTopic, formatBrief, formatDailyDigest } = require('./src/reports/formatter');

/**
 * 獲取主題列表
 * 助手可以用這個了解有哪些主題可以追蹤
 */
function getTopics() {
  return Object.entries(TOPICS).map(([id, config]) => ({
    id,
    name: config.name,
    priority: config.priority,
    keywords: config.keywords,
  }));
}

/**
 * 獲取主題搜尋關鍵字
 * @param {string} topicId - 主題 ID
 * @param {string} lang - 語言 (en/zh)
 */
function getKeywords(topicId, lang = 'both') {
  const topic = TOPICS[topicId];
  if (!topic) return null;

  if (lang === 'both') {
    return {
      en: topic.keywords.en,
      zh: topic.keywords.zh,
    };
  }

  return topic.keywords[lang] || topic.keywords.en;
}

/**
 * 處理搜尋結果
 * 助手搜尋後調用這個來處理結果
 * 
 * @param {Object[]} searchResults - web_search 返回的結果
 * @param {string} topicId - 主題 ID
 * @returns {Object[]} 處理後的新聞項目
 */
function processSearchResults(searchResults, topicId) {
  // 解析結果
  const items = parseSearchResults(searchResults, topicId);
  
  // 過濾已看過的
  const newItems = filterNewItems(items);
  
  // 排序和過濾低相關度
  const ranked = rankAndFilter(newItems, 0);
  
  return ranked;
}

/**
 * 儲存新聞到快取
 */
function cacheNews(items) {
  const cache = readJSON(CACHE_FILE, { news: [], lastUpdate: null });
  
  // 合併新項目
  const existingUrls = new Set(cache.news.map(n => n.url));
  const newItems = items.filter(item => !existingUrls.has(item.url));
  
  cache.news = [...newItems, ...cache.news].slice(0, 200); // 最多保留 200 條
  cache.lastUpdate = new Date().toISOString();
  
  writeJSON(CACHE_FILE, cache);
  
  return newItems.length;
}

/**
 * 獲取快取的新聞
 */
function getCachedNews(topicId = null, limit = 20) {
  const cache = readJSON(CACHE_FILE, { news: [] });
  
  let news = cache.news;
  
  if (topicId) {
    news = news.filter(n => n.topic === topicId);
  }
  
  return news.slice(0, limit);
}

/**
 * 標記新聞為已讀
 */
function markNewsAsRead(urls) {
  markAsSeen(Array.isArray(urls) ? urls : [urls]);
}

/**
 * 格式化新聞（簡短版）
 */
function formatNewsShort(items, limit = 5) {
  return formatBrief(items, limit);
}

/**
 * 格式化新聞（完整版）
 */
function formatNewsFull(items, options = {}) {
  return formatNewsList(items, options);
}

/**
 * 格式化新聞（按主題分組）
 */
function formatNewsByTopic(items, options = {}) {
  return formatByTopic(items, options);
}

/**
 * 生成每日摘要
 */
function generateDailyNews() {
  const items = getCachedNews(null, 30);
  return formatDailyDigest(items);
}

/**
 * 獲取建議的搜尋查詢
 * 助手可以用這些查詢來搜尋新聞
 */
function getSuggestedQueries() {
  const queries = [];
  
  for (const [id, config] of Object.entries(TOPICS)) {
    // 高優先級主題每個語言各加一個查詢
    if (config.priority >= 3) {
      queries.push({
        topic: id,
        query: config.keywords.en[0],
        lang: 'en',
      });
      queries.push({
        topic: id,
        query: config.keywords.zh[0],
        lang: 'zh',
      });
    } else {
      // 低優先級只加英文
      queries.push({
        topic: id,
        query: config.keywords.en[0],
        lang: 'en',
      });
    }
  }
  
  return queries;
}

/**
 * 快速新聞更新
 * 返回最近的重要新聞
 */
function getQuickUpdate() {
  const items = getCachedNews(null, 10);
  
  if (items.length === 0) {
    return '📰 尚無快取的新聞。請先搜尋相關主題。';
  }
  
  return formatBrief(items, 5);
}

module.exports = {
  // 主題相關
  getTopics,
  getKeywords,
  
  // 搜尋相關
  processSearchResults,
  getSuggestedQueries,
  
  // 快取相關
  cacheNews,
  getCachedNews,
  markNewsAsRead,
  
  // 格式化
  formatNewsShort,
  formatNewsFull,
  formatNewsByTopic,
  
  // 報告
  generateDailyNews,
  getQuickUpdate,
  
  // 原始模組（進階用途）
  TOPICS,
};
