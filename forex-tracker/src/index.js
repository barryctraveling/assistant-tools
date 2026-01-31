#!/usr/bin/env node

/**
 * 匯率追蹤器
 * 追蹤 USD/TWD 及主要貨幣匯率
 */

const fs = require('fs');
const path = require('path');

// 資料目錄
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 追蹤的貨幣對
const CURRENCY_PAIRS = {
  'USD/TWD': { base: 'USD', target: 'TWD', name: '美元/台幣', emoji: '🇺🇸🇹🇼' },
  'EUR/TWD': { base: 'EUR', target: 'TWD', name: '歐元/台幣', emoji: '🇪🇺🇹🇼' },
  'JPY/TWD': { base: 'JPY', target: 'TWD', name: '日圓/台幣', emoji: '🇯🇵🇹🇼' },
  'CNY/TWD': { base: 'CNY', target: 'TWD', name: '人民幣/台幣', emoji: '🇨🇳🇹🇼' },
  'USD/JPY': { base: 'USD', target: 'JPY', name: '美元/日圓', emoji: '🇺🇸🇯🇵' },
  'EUR/USD': { base: 'EUR', target: 'USD', name: '歐元/美元', emoji: '🇪🇺🇺🇸' },
};

// 快取設定
const CACHE_FILE = path.join(DATA_DIR, 'cache.json');
const CACHE_TTL = 60 * 60 * 1000; // 1 小時

/**
 * 讀取快取
 */
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

/**
 * 寫入快取
 */
function writeCache(data) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

/**
 * 從 exchangerate-api.com 獲取匯率（免費，無需 API key）
 */
async function fetchExchangeRates(baseCurrency = 'USD') {
  // 檢查快取
  const cache = readCache();
  const cacheKey = `rates_${baseCurrency}`;
  
  if (cache[cacheKey]) {
    const age = Date.now() - cache[cacheKey].fetchedAt;
    if (age < CACHE_TTL) {
      return cache[cacheKey].rates;
    }
  }

  try {
    // 使用免費的 exchangerate-api
    const url = `https://open.er-api.com/v6/latest/${baseCurrency}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result !== 'success') {
      throw new Error(data['error-type'] || 'API error');
    }

    const rates = {
      base: baseCurrency,
      rates: data.rates,
      lastUpdate: data.time_last_update_utc,
      nextUpdate: data.time_next_update_utc,
    };

    // 儲存快取
    cache[cacheKey] = {
      rates,
      fetchedAt: Date.now(),
    };
    writeCache(cache);

    return rates;
  } catch (error) {
    console.error('Fetch error:', error.message);
    // 返回快取資料（如果有）
    if (cache[cacheKey]) {
      console.log('使用快取資料...');
      return cache[cacheKey].rates;
    }
    return null;
  }
}

/**
 * 計算匯率
 */
async function getExchangeRate(base, target) {
  const rates = await fetchExchangeRates(base);
  
  if (!rates || !rates.rates[target]) {
    return null;
  }

  return {
    pair: `${base}/${target}`,
    rate: rates.rates[target],
    lastUpdate: rates.lastUpdate,
  };
}

/**
 * 生成完整匯率報告
 */
async function generateFullReport() {
  console.log('💱 獲取匯率資料中...\n');

  let report = '💱 **匯率報告**\n\n';

  // 獲取 USD 為基準的匯率
  const usdRates = await fetchExchangeRates('USD');
  const eurRates = await fetchExchangeRates('EUR');

  if (!usdRates) {
    return '❌ 無法獲取匯率資料';
  }

  // 台幣相關匯率
  report += '**🇹🇼 台幣相關**\n';
  
  const twdRate = usdRates.rates.TWD;
  report += `🇺🇸 USD/TWD: ${twdRate.toFixed(4)}\n`;

  if (eurRates) {
    const eurTwd = eurRates.rates.TWD;
    report += `🇪🇺 EUR/TWD: ${eurTwd.toFixed(4)}\n`;
  }

  // 日圓需要特殊處理（100日圓兌換）
  const jpyUsd = usdRates.rates.JPY;
  const jpyTwd = twdRate / jpyUsd;
  report += `🇯🇵 JPY/TWD: ${jpyTwd.toFixed(4)} (每日圓)\n`;
  report += `🇯🇵 JPY/TWD: ${(jpyTwd * 100).toFixed(2)} (每百日圓)\n`;

  const cnyTwd = twdRate / usdRates.rates.CNY;
  report += `🇨🇳 CNY/TWD: ${cnyTwd.toFixed(4)}\n`;

  report += '\n**🌍 主要貨幣對**\n';
  report += `🇺🇸🇯🇵 USD/JPY: ${jpyUsd.toFixed(2)}\n`;
  
  if (eurRates) {
    const eurUsd = 1 / usdRates.rates.EUR;
    report += `🇪🇺🇺🇸 EUR/USD: ${eurUsd.toFixed(4)}\n`;
  }

  report += '\n━━━━━━━━━━━━━━━━━━\n';
  report += `_更新時間: ${usdRates.lastUpdate}_`;

  return report;
}

/**
 * 生成台幣匯率簡報
 */
async function generateTwdBrief() {
  const usdRates = await fetchExchangeRates('USD');

  if (!usdRates) {
    return '💱 匯率資料暫時無法獲取';
  }

  const twdRate = usdRates.rates.TWD;
  const jpyRate = usdRates.rates.JPY;
  const jpyTwd = (twdRate / jpyRate) * 100;

  let brief = '💱 **匯率快訊**\n\n';
  brief += `🇺🇸 USD/TWD: ${twdRate.toFixed(2)}\n`;
  brief += `🇯🇵 JPY/TWD: ${jpyTwd.toFixed(2)} (每百日圓)\n`;

  return brief.trim();
}

/**
 * 換算工具
 */
async function convert(amount, from, to) {
  from = from.toUpperCase();
  to = to.toUpperCase();

  const rates = await fetchExchangeRates(from);
  
  if (!rates || !rates.rates[to]) {
    return null;
  }

  const rate = rates.rates[to];
  const result = amount * rate;

  return {
    from,
    to,
    amount,
    rate,
    result,
    formatted: `${amount.toLocaleString()} ${from} = ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`,
  };
}

/**
 * 儲存歷史資料
 */
async function saveHistory() {
  const usdRates = await fetchExchangeRates('USD');
  
  if (!usdRates) {
    return false;
  }

  const historyFile = path.join(DATA_DIR, 'history.json');
  let history = [];

  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    } catch (e) {}
  }

  history.push({
    timestamp: new Date().toISOString(),
    usdTwd: usdRates.rates.TWD,
    usdJpy: usdRates.rates.JPY,
    usdCny: usdRates.rates.CNY,
    usdEur: usdRates.rates.EUR,
  });

  // 只保留最近 90 天
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  history = history.filter(h => new Date(h.timestamp).getTime() > ninetyDaysAgo);

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  return true;
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'report';

  switch (command) {
    case 'report':
    case 'full':
      console.log(await generateFullReport());
      break;

    case 'brief':
    case 'quick':
      console.log(await generateTwdBrief());
      break;

    case 'convert':
      const amount = parseFloat(args[1]);
      const from = args[2];
      const to = args[3];

      if (!amount || !from || !to) {
        console.log('用法: node src/index.js convert <金額> <來源貨幣> <目標貨幣>');
        console.log('例如: node src/index.js convert 1000 USD TWD');
        break;
      }

      const result = await convert(amount, from, to);
      if (result) {
        console.log(`💱 ${result.formatted}`);
        console.log(`匯率: 1 ${result.from} = ${result.rate.toFixed(4)} ${result.to}`);
      } else {
        console.log('❌ 無法獲取匯率');
      }
      break;

    case 'save':
      const saved = await saveHistory();
      console.log(saved ? '✅ 歷史資料已儲存' : '❌ 儲存失敗');
      break;

    case 'help':
    default:
      console.log(`
💱 匯率追蹤器

使用: node src/index.js <command>

指令:
  report, full       完整匯率報告
  brief, quick       台幣匯率簡報
  convert <amt> <from> <to>  換算貨幣
  save               儲存歷史資料
  help               顯示幫助

範例:
  node src/index.js convert 1000 USD TWD
  node src/index.js convert 50000 TWD JPY
`);
  }
}

// 只在直接執行時運行 CLI
if (require.main === module) {
  main().catch(e => console.error('Error:', e.message));
}

module.exports = {
  fetchExchangeRates,
  getExchangeRate,
  generateFullReport,
  generateTwdBrief,
  convert,
  saveHistory,
};
