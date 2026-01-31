/**
 * 快速回答模組
 * 
 * 讓助手可以快速回答 Barry 常見的問題
 */

const path = require('path');

// 載入其他模組
function load(name) {
  try {
    return require(path.join(__dirname, '..', name, 'assistant-integration'));
  } catch (e) {
    return null;
  }
}

const investment = load('investment-monitor');
const stablecoin = load('stablecoin-tracker');
const rwa = load('rwa-tracker');
const briefing = load('morning-briefing');

/**
 * 股票怎麼樣？
 */
async function howAreStocks() {
  if (!investment) return '投資模組未載入';
  
  const quote = await investment.getQuickQuote();
  const portfolio = await investment.getPortfolioSummary();
  
  return `📈 **股票狀況**\n\n${quote}\n\n💼 **組合績效**\n${portfolio}`;
}

/**
 * 穩定幣狀況？
 */
async function howAreStablecoins() {
  if (!stablecoin) return '穩定幣模組未載入';
  
  const brief = await stablecoin.getStablecoinBrief();
  const depeg = await stablecoin.checkDepeg();
  
  let response = brief;
  if (depeg) {
    response += '\n\n' + depeg;
  } else {
    response += '\n\n✅ 所有穩定幣價格正常';
  }
  
  return response;
}

/**
 * RWA 市場？
 */
function howIsRWA() {
  if (!rwa) return 'RWA 模組未載入';
  return rwa.getRWAWorkBrief();
}

/**
 * 今天天氣？
 */
async function howIsWeather() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getWeather();
}

/**
 * 今天有什麼行程？
 */
async function whatIsOnCalendar() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getCalendarSummary();
}

/**
 * 給我早晨簡報
 */
async function giveMorningBriefing() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getMorningBriefing();
}

/**
 * 市場概覽（綜合）
 */
async function marketOverview() {
  const parts = [];
  
  // 股票
  if (investment) {
    parts.push('📈 **股票**');
    parts.push(await investment.getQuickQuote());
  }
  
  // 穩定幣
  if (stablecoin) {
    parts.push('\n' + await stablecoin.getStablecoinBrief());
  }
  
  // RWA
  if (rwa) {
    parts.push('\n' + rwa.getRWABrief());
  }
  
  return parts.join('\n');
}

/**
 * 快速狀態檢查
 */
async function quickStatus() {
  const lines = [];
  const now = new Date();
  const timeStr = now.toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  
  lines.push(`⏰ 現在時間: ${timeStr}`);
  
  // 天氣
  if (briefing) {
    try {
      const weatherOneLine = await briefing.getWeatherOneLine();
      lines.push(`🌤️ ${weatherOneLine}`);
    } catch (e) {}
  }
  
  // 股票快訊
  if (investment) {
    try {
      const quotes = await investment.fetchQuotes(['ONDS', 'TSLA']);
      for (const symbol of ['ONDS', 'TSLA']) {
        const q = quotes[symbol];
        if (q && !q.error) {
          const emoji = q.change >= 0 ? '📈' : '📉';
          lines.push(`${emoji} ${symbol}: $${q.price.toFixed(2)}`);
        }
      }
    } catch (e) {}
  }
  
  return lines.join('\n');
}

/**
 * 關鍵字匹配回答
 */
async function answerQuestion(question) {
  const q = question.toLowerCase();
  
  if (q.includes('股票') || q.includes('stock') || q.includes('onds') || q.includes('tsla')) {
    return await howAreStocks();
  }
  
  if (q.includes('穩定幣') || q.includes('stablecoin') || q.includes('usdt') || q.includes('usdc')) {
    return await howAreStablecoins();
  }
  
  if (q.includes('rwa') || q.includes('資產代幣') || q.includes('國債')) {
    return howIsRWA();
  }
  
  if (q.includes('天氣') || q.includes('weather')) {
    return await howIsWeather();
  }
  
  if (q.includes('行程') || q.includes('calendar') || q.includes('日曆')) {
    return await whatIsOnCalendar();
  }
  
  if (q.includes('簡報') || q.includes('briefing') || q.includes('早安')) {
    return await giveMorningBriefing();
  }
  
  if (q.includes('市場') || q.includes('market')) {
    return await marketOverview();
  }
  
  return null; // 沒有匹配
}

module.exports = {
  howAreStocks,
  howAreStablecoins,
  howIsRWA,
  howIsWeather,
  whatIsOnCalendar,
  giveMorningBriefing,
  marketOverview,
  quickStatus,
  answerQuestion,
};
