#!/usr/bin/env node

/**
 * 每日早晨簡報
 * 
 * 整合多個資訊來源，生成完整的早晨報告
 */

const path = require('path');

// 組件路徑
const PROJECTS_DIR = path.join(__dirname, '../..');
const INVESTMENT_MONITOR = path.join(PROJECTS_DIR, 'investment-monitor');
const FINTECH_NEWS = path.join(PROJECTS_DIR, 'fintech-news');

/**
 * 獲取問候語
 */
function getGreeting() {
  const hour = new Date().getHours();
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  let greeting;
  if (hour < 6) greeting = '🌙 深夜了';
  else if (hour < 12) greeting = '☀️ 早安';
  else if (hour < 18) greeting = '🌤️ 午安';
  else greeting = '🌙 晚安';

  return `${greeting}，Barry！\n📅 ${dateStr}`;
}

/**
 * 獲取投資摘要
 */
async function getInvestmentSummary() {
  try {
    const { calculatePerformance, formatPortfolioSummary } = require(path.join(INVESTMENT_MONITOR, 'src/market/portfolio'));
    const performance = await calculatePerformance();
    return formatPortfolioSummary(performance);
  } catch (e) {
    return `（投資資料暫時無法獲取: ${e.message}）`;
  }
}

/**
 * 獲取 Fintech 新聞
 */
function getFintechNews() {
  try {
    const { getQuickUpdate } = require(path.join(FINTECH_NEWS, 'assistant-integration'));
    return getQuickUpdate();
  } catch (e) {
    return `（新聞資料暫時無法獲取: ${e.message}）`;
  }
}

/**
 * 獲取天氣資訊
 */
async function getWeatherInfo() {
  try {
    const { getFormattedWeather, getWeatherAdvice } = require('./weather');
    const weather = await getFormattedWeather('Taipei');
    const advice = await getWeatherAdvice('Taipei');
    return weather + (advice ? '\n\n' + advice : '');
  } catch (e) {
    return '（天氣資訊暫時無法獲取）';
  }
}

/**
 * 獲取行事曆資訊
 */
async function getCalendarInfo() {
  try {
    const { getCalendarSummary } = require('./calendar');
    return await getCalendarSummary();
  } catch (e) {
    return '（行事曆資訊暫時無法獲取）';
  }
}

/**
 * 獲取加密市場簡報（穩定幣 + RWA）
 */
async function getCryptoMarketBrief() {
  const parts = [];

  // 穩定幣
  try {
    const stablecoin = require(path.join(PROJECTS_DIR, 'stablecoin-tracker/assistant-integration'));
    const brief = await stablecoin.getStablecoinBrief();
    parts.push(brief);
  } catch (e) {}

  // RWA
  try {
    const rwa = require(path.join(PROJECTS_DIR, 'rwa-tracker/assistant-integration'));
    parts.push(rwa.getRWABrief());
  } catch (e) {}

  if (parts.length === 0) {
    return '（市場資訊暫時無法獲取）';
  }

  return parts.join('\n\n');
}

/**
 * 生成完整早晨簡報
 */
async function generateFullBriefing() {
  const sections = [];

  // 問候
  sections.push(getGreeting());
  sections.push('');

  // 天氣
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('🌤️ **今日天氣**\n');
  sections.push(await getWeatherInfo());
  sections.push('');

  // 行事曆
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('📅 **今日行程**\n');
  sections.push(await getCalendarInfo());
  sections.push('');

  // 投資概覽
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('💼 **投資概覽**\n');
  sections.push(await getInvestmentSummary());
  sections.push('');

  // Fintech 新聞
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('📰 **Fintech 快訊**\n');
  sections.push(getFintechNews());
  sections.push('');

  // 穩定幣和 RWA 快訊（工作相關）
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('🏦 **市場快訊**\n');
  sections.push(await getCryptoMarketBrief());
  sections.push('');

  // 結尾
  sections.push('━━━━━━━━━━━━━━━━━━');
  sections.push('_祝你有美好的一天！_ 🚀');

  return sections.join('\n');
}

/**
 * 生成快速版簡報
 */
async function generateQuickBriefing() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' });

  let brief = `☀️ **${dateStr}**\n\n`;

  // 投資快速摘要
  try {
    const { fetchQuotes } = require(path.join(INVESTMENT_MONITOR, 'src/market/quotes'));
    const quotes = await fetchQuotes(['ONDS', 'TSLA']);
    
    for (const symbol of ['ONDS', 'TSLA']) {
      const q = quotes[symbol];
      if (q && !q.error) {
        const emoji = q.change >= 0 ? '📈' : '📉';
        const sign = q.change >= 0 ? '+' : '';
        brief += `${emoji} ${symbol}: $${q.price.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)\n`;
      }
    }
  } catch (e) {
    brief += '💼 投資資料暫時無法獲取\n';
  }

  return brief;
}

// CLI
async function main() {
  const command = process.argv[2] || 'full';

  switch (command) {
    case 'full':
      console.log(await generateFullBriefing());
      break;

    case 'quick':
      console.log(await generateQuickBriefing());
      break;

    case 'market':
      console.log('💼 **投資概覽**\n');
      console.log(await getInvestmentSummary());
      break;

    case 'news':
      console.log(getFintechNews());
      break;

    case 'help':
    default:
      console.log(`
☀️ 每日早晨簡報

使用: node src/index.js <command>

指令:
  full    完整簡報
  quick   快速版
  market  投資概覽
  news    Fintech 新聞
  help    顯示幫助
`);
  }
}

main().catch(e => console.error('Error:', e.message));

module.exports = {
  getGreeting,
  getInvestmentSummary,
  getFintechNews,
  generateFullBriefing,
  generateQuickBriefing,
};
