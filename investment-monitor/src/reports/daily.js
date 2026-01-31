/**
 * 每日投資報告
 */

const { fetchQuotes, formatQuote } = require('../market/quotes');
const { calculatePerformance, formatPortfolioSummary } = require('../market/portfolio');
const { checkAlerts, formatTriggeredAlert } = require('../alerts/manager');
const { WATCHLIST } = require('../utils/config');

/**
 * 生成每日報告
 */
async function generateDailyReport() {
  const sections = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 標題
  sections.push(`📅 **每日投資報告**\n${dateStr}\n`);

  // 1. 市場概覽
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('📊 **關注股票**\n');

  try {
    const quotes = await fetchQuotes(WATCHLIST);
    for (const symbol of WATCHLIST) {
      const quote = quotes[symbol];
      if (quote && !quote.error) {
        sections.push(formatQuote(quote));
        sections.push('');
      } else {
        sections.push(`❌ ${symbol}: 無法獲取資料\n`);
      }
    }
  } catch (error) {
    sections.push(`⚠️ 獲取報價時發生錯誤: ${error.message}\n`);
  }

  // 2. 投資組合狀態
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('💼 **投資組合**\n');

  try {
    const performance = await calculatePerformance();
    sections.push(formatPortfolioSummary(performance));
  } catch (error) {
    sections.push(`⚠️ 計算組合時發生錯誤: ${error.message}\n`);
  }

  // 3. 警報觸發
  try {
    const triggered = await checkAlerts();
    if (triggered.length > 0) {
      sections.push('━━━━━━━━━━━━━━━━━━');
      sections.push('🔔 **觸發的警報**\n');
      for (const item of triggered) {
        sections.push(formatTriggeredAlert(item));
      }
    }
  } catch (error) {
    // 警報檢查失敗不影響報告
  }

  // 時間戳
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push(`_更新時間: ${now.toLocaleTimeString('zh-TW')}_`);

  return sections.join('\n');
}

/**
 * 生成簡短版報告（用於 Telegram）
 */
async function generateQuickUpdate() {
  const quotes = await fetchQuotes(WATCHLIST);
  
  let update = '📊 **快速更新**\n\n';

  for (const symbol of WATCHLIST) {
    const quote = quotes[symbol];
    if (quote && !quote.error) {
      const emoji = quote.change >= 0 ? '📈' : '📉';
      const sign = quote.change >= 0 ? '+' : '';
      update += `${emoji} **${symbol}**: $${quote.price.toFixed(2)} (${sign}${quote.changePercent.toFixed(2)}%)\n`;
    }
  }

  return update;
}

module.exports = {
  generateDailyReport,
  generateQuickUpdate,
};
