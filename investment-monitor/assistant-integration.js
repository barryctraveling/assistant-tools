/**
 * 投資監控 - 助手整合
 * 
 * 讓助手可以直接調用投資監控功能
 */

const { fetchQuotes, formatQuote } = require('./src/market/quotes');
const { calculatePerformance, formatPortfolioReport, formatPortfolioSummary, setPosition } = require('./src/market/portfolio');
const { getAlerts, addAlert, checkAlerts, formatAlertsList, formatTriggeredAlert } = require('./src/alerts/manager');
const { generateDailyReport, generateQuickUpdate } = require('./src/reports/daily');
const { WATCHLIST, formatCurrency, formatPercent } = require('./src/utils/config');

/**
 * 獲取快速股票報價（適合聊天回覆）
 */
async function getQuickQuote(symbols = WATCHLIST) {
  const quotes = await fetchQuotes(symbols);
  
  let result = '';
  for (const symbol of symbols) {
    const q = quotes[symbol];
    if (q && !q.error) {
      const emoji = q.change >= 0 ? '📈' : '📉';
      const sign = q.change >= 0 ? '+' : '';
      result += `${emoji} **${q.symbol}** $${q.price.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)\n`;
    } else {
      result += `❌ ${symbol}: 無法獲取\n`;
    }
  }
  
  return result.trim();
}

/**
 * 獲取投資組合摘要
 */
async function getPortfolioSummary() {
  const performance = await calculatePerformance();
  return formatPortfolioSummary(performance);
}

/**
 * 獲取完整組合報告
 */
async function getPortfolioFull() {
  const performance = await calculatePerformance();
  return formatPortfolioReport(performance);
}

/**
 * 設定持倉
 */
function setHolding(symbol, shares, costBasis, note = '') {
  const position = setPosition(symbol, shares, costBasis, note);
  return `✅ 已設定 ${position.symbol}: ${position.shares} 股 @ ${formatCurrency(position.costBasis)}`;
}

/**
 * 新增價格警報
 */
function setAlert(symbol, above = null, below = null, note = '') {
  const alert = addAlert(symbol, { above, below, note });
  let msg = `✅ 已設定 ${alert.symbol} 警報\n`;
  if (above) msg += `📈 高於 ${formatCurrency(above)}\n`;
  if (below) msg += `📉 低於 ${formatCurrency(below)}`;
  return msg;
}

/**
 * 檢查並返回觸發的警報
 */
async function checkAndReportAlerts() {
  const triggered = await checkAlerts();
  
  if (triggered.length === 0) {
    return null; // 沒有觸發的警報
  }
  
  return triggered.map(item => formatTriggeredAlert(item)).join('\n');
}

/**
 * 生成市場更新（適合早晨報告）
 */
async function getMorningUpdate() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  let report = `☀️ **早安！${dateStr}**\n\n`;
  report += '📊 **市場狀態**\n';
  report += await getQuickQuote();
  
  // 組合摘要（如果有持倉）
  try {
    const performance = await calculatePerformance();
    if (performance.positions.length > 0) {
      report += '\n\n💼 **投資組合**\n';
      report += formatPortfolioSummary(performance);
    }
  } catch (e) {
    // 忽略錯誤
  }
  
  // 警報檢查
  const alerts = await checkAndReportAlerts();
  if (alerts) {
    report += '\n\n🔔 **警報**\n';
    report += alerts;
  }
  
  return report;
}

module.exports = {
  getQuickQuote,
  getPortfolioSummary,
  getPortfolioFull,
  setHolding,
  setAlert,
  checkAndReportAlerts,
  getMorningUpdate,
  generateDailyReport,
  // 原始函數（進階用途）
  fetchQuotes,
  calculatePerformance,
  WATCHLIST,
};
