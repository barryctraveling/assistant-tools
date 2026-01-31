/**
 * 法律新聞追蹤 - 助手整合
 */

const {
  TOPICS,
  KEY_ENTITIES,
  getLegalNewsOverview,
  getSearchSuggestions,
  generateWorkReport,
  formatBriefing,
} = require('./src/index');

/**
 * 獲取法律新聞概覽
 */
function getOverview() {
  return getLegalNewsOverview();
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
