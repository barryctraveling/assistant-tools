#!/usr/bin/env node
/**
 * 加密貨幣追蹤器
 * 追蹤主要加密貨幣的價格和市值
 * API: CoinGecko (免費，無需 API key)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 追蹤的加密貨幣
const TRACKED_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' }
];

// 快取設定
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'prices.json');
const CACHE_DURATION = 5 * 60 * 1000; // 5 分鐘

// 確保快取目錄存在
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

// HTTP GET 請求
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'CryptoTracker/1.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('JSON 解析失敗'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// 從 CoinGecko 獲取價格
async function fetchPrices() {
  const ids = TRACKED_COINS.map(c => c.id).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,twd&include_24hr_change=true&include_market_cap=true`;
  
  try {
    return await httpGet(url);
  } catch (error) {
    console.error('API 請求失敗:', error.message);
    return null;
  }
}

// 讀取快取
function readCache() {
  ensureCacheDir();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return cache.data;
      }
    }
  } catch (e) {
    // 快取讀取失敗
  }
  return null;
}

// 寫入快取
function writeCache(data) {
  ensureCacheDir();
  fs.writeFileSync(CACHE_FILE, JSON.stringify({
    timestamp: Date.now(),
    data: data
  }, null, 2));
}

// 獲取價格（帶快取）
async function getPrices() {
  let data = readCache();
  if (!data) {
    data = await fetchPrices();
    if (data) {
      writeCache(data);
    }
  }
  return data;
}

// 格式化數字
function formatNumber(num, decimals = 2) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(decimals);
}

// 格式化價格
function formatPrice(price) {
  if (price >= 1000) return '$' + formatNumber(price, 0);
  if (price >= 1) return '$' + price.toFixed(2);
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(6);
}

// 格式化變化百分比
function formatChange(change) {
  if (!change) return '-';
  const sign = change >= 0 ? '+' : '';
  const emoji = change >= 0 ? '🟢' : '🔴';
  return `${emoji} ${sign}${change.toFixed(2)}%`;
}

// 生成完整報告
async function generateReport() {
  const data = await getPrices();
  if (!data) {
    return '❌ 無法獲取加密貨幣價格';
  }

  let report = '# 📊 加密貨幣市場報告\n\n';
  report += `*更新時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}*\n\n`;
  
  let totalMarketCap = 0;
  const coins = [];
  
  for (const coin of TRACKED_COINS) {
    const info = data[coin.id];
    if (info) {
      const marketCap = info.usd_market_cap || 0;
      totalMarketCap += marketCap;
      coins.push({
        ...coin,
        priceUsd: info.usd,
        priceTwd: info.twd,
        change24h: info.usd_24h_change,
        marketCap: marketCap
      });
    }
  }

  // 依市值排序
  coins.sort((a, b) => b.marketCap - a.marketCap);

  report += '## 💰 價格總覽\n\n';
  report += '| 幣種 | 價格 (USD) | 24h 變化 | 市值 |\n';
  report += '|------|-----------|----------|------|\n';
  
  for (const coin of coins) {
    report += `| ${coin.symbol} | ${formatPrice(coin.priceUsd)} | ${formatChange(coin.change24h)} | $${formatNumber(coin.marketCap)} |\n`;
  }

  report += `\n**追蹤幣種總市值**: $${formatNumber(totalMarketCap)}\n`;
  
  // 24h 表現最佳和最差
  const sorted = [...coins].filter(c => c.change24h != null).sort((a, b) => b.change24h - a.change24h);
  if (sorted.length > 0) {
    report += '\n## 📈 24h 表現\n\n';
    report += `- **最佳**: ${sorted[0].symbol} ${formatChange(sorted[0].change24h)}\n`;
    report += `- **最差**: ${sorted[sorted.length-1].symbol} ${formatChange(sorted[sorted.length-1].change24h)}\n`;
  }

  // TWD 換算
  report += '\n## 💱 台幣參考價\n\n';
  for (const coin of coins.slice(0, 3)) {
    if (coin.priceTwd) {
      report += `- 1 ${coin.symbol} = NT$${formatNumber(coin.priceTwd, 0)}\n`;
    }
  }

  return report;
}

// 生成簡報
async function generateBrief() {
  const data = await getPrices();
  if (!data) {
    return '❌ 無法獲取價格';
  }

  let brief = '📊 **加密貨幣快訊**\n\n';
  
  // 只顯示前 4 個
  const topCoins = TRACKED_COINS.slice(0, 4);
  
  for (const coin of topCoins) {
    const info = data[coin.id];
    if (info) {
      const change = info.usd_24h_change;
      const emoji = change >= 0 ? '🟢' : '🔴';
      const sign = change >= 0 ? '+' : '';
      brief += `${coin.symbol}: ${formatPrice(info.usd)} ${emoji} ${sign}${change?.toFixed(1)}%\n`;
    }
  }

  return brief;
}

// 獲取特定幣種
async function getCoin(symbol) {
  const data = await getPrices();
  if (!data) return null;

  const coin = TRACKED_COINS.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
  if (!coin) return null;

  const info = data[coin.id];
  if (!info) return null;

  return {
    symbol: coin.symbol,
    name: coin.name,
    priceUsd: info.usd,
    priceTwd: info.twd,
    change24h: info.usd_24h_change,
    marketCap: info.usd_market_cap
  };
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'brief';

  switch (command) {
    case 'report':
      console.log(await generateReport());
      break;
    case 'brief':
      console.log(await generateBrief());
      break;
    case 'price':
      const symbol = args[1];
      if (!symbol) {
        console.log('用法: crypto price BTC');
        break;
      }
      const coin = await getCoin(symbol);
      if (coin) {
        console.log(`${coin.symbol} (${coin.name})`);
        console.log(`價格: ${formatPrice(coin.priceUsd)} (NT$${formatNumber(coin.priceTwd, 0)})`);
        console.log(`24h: ${formatChange(coin.change24h)}`);
        console.log(`市值: $${formatNumber(coin.marketCap)}`);
      } else {
        console.log(`找不到 ${symbol}`);
      }
      break;
    default:
      console.log('加密貨幣追蹤器');
      console.log('用法:');
      console.log('  node src/index.js brief          # 快訊');
      console.log('  node src/index.js report         # 完整報告');
      console.log('  node src/index.js price BTC      # 查詢特定幣種');
  }
}

// 導出給助手使用
module.exports = {
  getPrices,
  generateReport,
  generateBrief,
  getCoin,
  TRACKED_COINS
};

// CLI 模式
if (require.main === module) {
  main().catch(console.error);
}
