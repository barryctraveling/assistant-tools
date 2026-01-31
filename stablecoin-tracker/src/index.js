#!/usr/bin/env node

/**
 * 穩定幣追蹤器
 * 使用 CoinGecko API 獲取穩定幣資訊
 */

const fs = require('fs');
const path = require('path');

// 資料目錄
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 追蹤的穩定幣
const STABLECOINS = {
  tether: { symbol: 'USDT', name: 'Tether', issuer: 'Tether Limited' },
  'usd-coin': { symbol: 'USDC', name: 'USD Coin', issuer: 'Circle' },
  dai: { symbol: 'DAI', name: 'Dai', issuer: 'MakerDAO' },
  'true-usd': { symbol: 'TUSD', name: 'TrueUSD', issuer: 'TrustToken' },
  'first-digital-usd': { symbol: 'FDUSD', name: 'First Digital USD', issuer: 'First Digital' },
  'usdd': { symbol: 'USDD', name: 'USDD', issuer: 'Tron DAO' },
};

/**
 * 從 CoinGecko 獲取穩定幣資料
 */
async function fetchStablecoinData() {
  const ids = Object.keys(STABLECOINS).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      circulatingSupply: coin.circulating_supply,
      priceChange24h: coin.price_change_percentage_24h,
      issuer: STABLECOINS[coin.id]?.issuer || 'Unknown',
      fetchedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Fetch error:', error.message);
    return [];
  }
}

/**
 * 格式化市值
 */
function formatMarketCap(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

/**
 * 格式化供應量
 */
function formatSupply(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString();
}

/**
 * 生成市值報告
 */
async function generateMarketCapReport() {
  console.log('📊 獲取穩定幣資料中...\n');
  const coins = await fetchStablecoinData();

  if (coins.length === 0) {
    return '❌ 無法獲取穩定幣資料';
  }

  // 按市值排序
  coins.sort((a, b) => b.marketCap - a.marketCap);

  let report = '💵 **穩定幣市值排名**\n\n';

  let totalMarketCap = 0;

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    const rank = i + 1;
    const priceEmoji = Math.abs(coin.price - 1) < 0.01 ? '✅' : '⚠️';

    report += `${rank}. **${coin.symbol}** (${coin.name})\n`;
    report += `   ${priceEmoji} 價格: $${coin.price.toFixed(4)}\n`;
    report += `   💰 市值: ${formatMarketCap(coin.marketCap)}\n`;
    report += `   📦 供應量: ${formatSupply(coin.circulatingSupply)}\n`;
    report += `   🏢 發行商: ${coin.issuer}\n\n`;

    totalMarketCap += coin.marketCap;
  }

  report += '━━━━━━━━━━━━━━━━━━\n';
  report += `**總市值**: ${formatMarketCap(totalMarketCap)}\n`;
  report += `_更新時間: ${new Date().toLocaleString('zh-TW')}_`;

  return report;
}

/**
 * 生成簡短摘要
 */
async function generateBriefSummary() {
  const coins = await fetchStablecoinData();

  if (coins.length === 0) {
    return '💵 穩定幣資料暫時無法獲取';
  }

  coins.sort((a, b) => b.marketCap - a.marketCap);

  let summary = '💵 **穩定幣快訊**\n\n';
  
  for (const coin of coins.slice(0, 4)) {
    const priceStatus = Math.abs(coin.price - 1) < 0.005 ? '✅' : 
                        coin.price > 1 ? '📈' : '📉';
    summary += `${priceStatus} ${coin.symbol}: $${coin.price.toFixed(4)} (${formatMarketCap(coin.marketCap)})\n`;
  }

  return summary.trim();
}

/**
 * 儲存歷史資料
 */
async function saveHistory(data) {
  const historyFile = path.join(DATA_DIR, 'history.json');
  let history = [];

  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    } catch (e) {}
  }

  history.push({
    timestamp: new Date().toISOString(),
    data,
  });

  // 只保留最近 30 天
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  history = history.filter(h => new Date(h.timestamp).getTime() > thirtyDaysAgo);

  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// CLI
async function main() {
  const command = process.argv[2] || 'mcap';

  switch (command) {
    case 'mcap':
    case 'market':
      console.log(await generateMarketCapReport());
      break;

    case 'brief':
    case 'quick':
      console.log(await generateBriefSummary());
      break;

    case 'save':
      const data = await fetchStablecoinData();
      await saveHistory(data);
      console.log('✅ 資料已儲存');
      break;

    case 'help':
    default:
      console.log(`
💵 穩定幣追蹤器

使用: node src/index.js <command>

指令:
  mcap, market   市值報告
  brief, quick   簡短摘要
  save           儲存歷史資料
  help           顯示幫助
`);
  }
}

// 只在直接執行時運行 CLI
if (require.main === module) {
  main().catch(e => console.error('Error:', e.message));
}

module.exports = {
  fetchStablecoinData,
  generateMarketCapReport,
  generateBriefSummary,
  formatMarketCap,
  formatSupply,
  STABLECOINS,
};
