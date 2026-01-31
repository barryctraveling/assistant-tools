/**
 * RWA 追蹤器 - 助手整合
 */

const {
  fetchRWAData,
  getMarketStats,
  generateMarketOverview,
  generateBriefSummary,
  generateTreasuriesReport,
  formatAmount,
  RWA_CATEGORIES,
} = require('./src/index');

/**
 * 獲取 RWA 市場概覽
 */
function getRWAOverview() {
  return generateMarketOverview();
}

/**
 * 獲取 RWA 簡短摘要
 */
function getRWABrief() {
  return generateBriefSummary();
}

/**
 * 獲取代幣化國債報告
 */
function getTreasuriesReport() {
  return generateTreasuriesReport();
}

/**
 * 獲取市場統計數據
 */
function getStats() {
  return getMarketStats();
}

/**
 * 獲取特定類別的市值
 */
function getCategoryValue(category) {
  const stats = getMarketStats();
  const value = stats[category];
  if (!value) return null;
  
  return {
    category,
    name: RWA_CATEGORIES[category]?.name || category,
    value,
    formatted: formatAmount(value),
    percentage: ((value / stats.totalMarket) * 100).toFixed(1) + '%',
  };
}

/**
 * 獲取 RWA 協議資料
 */
async function getProtocols() {
  return await fetchRWAData();
}

/**
 * 生成工作簡報（Barry 的 RWA 工作用）
 */
function getWorkBrief() {
  const stats = getMarketStats();

  let brief = '📊 **RWA 市場工作簡報**\n\n';
  brief += `總市值: ${formatAmount(stats.totalMarket)}\n`;
  brief += `增長: +${stats.growth.ytd}% YTD / +${stats.growth.mom}% MoM\n\n`;

  brief += '**重點數據**\n';
  brief += `• 代幣化國債: ${formatAmount(stats.treasuries)} (${((stats.treasuries / stats.totalMarket) * 100).toFixed(0)}%)\n`;
  brief += `• 私募信貸: ${formatAmount(stats.privateCredit)} (${((stats.privateCredit / stats.totalMarket) * 100).toFixed(0)}%)\n\n`;

  brief += '**關注重點**\n';
  brief += '• 國債代幣化持續領先\n';
  brief += '• 機構採用加速\n';
  brief += '• 監管進展值得關注\n';

  return brief;
}

module.exports = {
  getRWAOverview,
  getRWABrief,
  getTreasuriesReport,
  getStats,
  getCategoryValue,
  getProtocols,
  getWorkBrief,
  RWA_CATEGORIES,
};
