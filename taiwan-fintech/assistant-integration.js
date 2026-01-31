/**
 * 台灣金融科技 - 助手整合
 */

const {
  TOPICS,
  KEY_ENTITIES,
  getTaiwanFintechOverview,
  getSearchSuggestions,
  formatBriefing,
  generateWorkReport,
} = require('./src/index');

/**
 * 獲取台灣 Fintech 概覽
 */
function getOverview() {
  return getTaiwanFintechOverview();
}

/**
 * 獲取工作報告
 */
function getWorkReport() {
  return generateWorkReport();
}

/**
 * 獲取快訊
 */
function getBrief(news = []) {
  return formatBriefing(news);
}

/**
 * 獲取搜尋關鍵字
 */
function getKeywords(topicId = null) {
  if (topicId && TOPICS[topicId]) {
    return TOPICS[topicId].keywords;
  }
  
  // 返回所有關鍵字
  const allKeywords = [];
  for (const topic of Object.values(TOPICS)) {
    allKeywords.push(...topic.keywords);
  }
  return [...new Set(allKeywords)];
}

/**
 * 獲取追蹤主題
 */
function getTopics() {
  return Object.entries(TOPICS).map(([id, topic]) => ({
    id,
    ...topic,
  }));
}

module.exports = {
  getOverview,
  getWorkReport,
  getBrief,
  getKeywords,
  getTopics,
  TOPICS,
  KEY_ENTITIES,
};
