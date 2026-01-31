/**
 * 市場儀表板 - 助手整合模組
 */

const { getFullReport, getQuickSummary, getWorkReport } = require('./index');

module.exports = {
  getFullReport,
  getQuickSummary,
  getWorkReport,
  
  // 別名
  getMarketReport: getFullReport,
  getMarketBrief: getQuickSummary,
  getFintechReport: getWorkReport
};
