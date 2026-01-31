/**
 * 新聞搜尋模組
 * 
 * 注意：這個模組設計用於助手整合
 * 助手可以使用 web_search 工具來搜尋新聞
 */

const { TOPICS, CACHE_FILE, HISTORY_FILE, readJSON, writeJSON } = require('../config');

/**
 * 生成搜尋查詢
 * @param {string} topic - 主題 ID
 * @param {string} lang - 語言 (en/zh)
 * @returns {string[]} 搜尋查詢列表
 */
function generateQueries(topic, lang = 'en') {
  const topicConfig = TOPICS[topic];
  if (!topicConfig) {
    throw new Error(`Unknown topic: ${topic}`);
  }

  const keywords = topicConfig.keywords[lang] || topicConfig.keywords.en;
  
  // 加上時間限定
  return keywords.map(kw => `${kw} news 2026`);
}

/**
 * 解析搜尋結果
 * @param {Object[]} results - 搜尋結果
 * @param {string} topic - 主題
 * @returns {Object[]} 新聞項目
 */
function parseSearchResults(results, topic) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.map(item => ({
    title: item.title,
    url: item.url,
    snippet: item.snippet || item.description,
    topic,
    source: extractSource(item.url),
    fetchedAt: new Date().toISOString(),
  })).filter(item => item.title && item.url);
}

/**
 * 從 URL 提取來源
 */
function extractSource(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch (e) {
    return 'unknown';
  }
}

/**
 * 檢查是否已看過
 */
function isAlreadySeen(url) {
  const history = readJSON(HISTORY_FILE, { seen: [] });
  return history.seen.includes(url);
}

/**
 * 標記為已看
 */
function markAsSeen(urls) {
  const history = readJSON(HISTORY_FILE, { seen: [] });
  history.seen = [...new Set([...history.seen, ...urls])];
  
  // 只保留最近 1000 條
  if (history.seen.length > 1000) {
    history.seen = history.seen.slice(-1000);
  }
  
  writeJSON(HISTORY_FILE, history);
}

/**
 * 過濾新的新聞
 */
function filterNewItems(items) {
  return items.filter(item => !isAlreadySeen(item.url));
}

/**
 * 為助手生成搜尋指令
 * 助手應該使用這些查詢來搜尋新聞
 */
function getSearchInstructions() {
  const instructions = {
    topics: Object.entries(TOPICS).map(([id, config]) => ({
      id,
      name: config.name,
      priority: config.priority,
      suggestedQueries: {
        en: config.keywords.en.slice(0, 2),
        zh: config.keywords.zh.slice(0, 2),
      },
    })),
    notes: [
      '使用 web_search 工具搜尋各主題',
      '中文查詢使用 country: TW, search_lang: zh',
      '英文查詢使用 country: US, search_lang: en',
      '每個主題搜尋 3-5 條結果即可',
    ],
  };

  return instructions;
}

/**
 * 計算新聞相關度分數
 */
function calculateRelevance(item, topic) {
  const topicConfig = TOPICS[topic];
  if (!topicConfig) return 0;

  const text = `${item.title} ${item.snippet || ''}`.toLowerCase();
  let score = 0;

  // 檢查關鍵字出現
  for (const lang of ['en', 'zh']) {
    for (const keyword of topicConfig.keywords[lang] || []) {
      if (text.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
  }

  // 來源加成
  if (topicConfig.sources.some(s => item.source?.includes(s))) {
    score += 5;
  }

  return score;
}

/**
 * 排序和過濾新聞
 */
function rankAndFilter(items, minScore = 5) {
  return items
    .map(item => ({
      ...item,
      relevance: calculateRelevance(item, item.topic),
    }))
    .filter(item => item.relevance >= minScore)
    .sort((a, b) => b.relevance - a.relevance);
}

module.exports = {
  generateQueries,
  parseSearchResults,
  isAlreadySeen,
  markAsSeen,
  filterNewItems,
  getSearchInstructions,
  calculateRelevance,
  rankAndFilter,
};
