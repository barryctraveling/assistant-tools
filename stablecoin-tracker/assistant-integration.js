/**
 * 穩定幣追蹤器 - 助手整合
 */

const { 
  fetchStablecoinData,
  generateMarketCapReport,
  generateBriefSummary,
  formatMarketCap,
  STABLECOINS,
} = require('./src/index');

/**
 * 獲取穩定幣市值報告
 */
async function getStablecoinReport() {
  return await generateMarketCapReport();
}

/**
 * 獲取穩定幣簡短摘要
 */
async function getStablecoinBrief() {
  return await generateBriefSummary();
}

/**
 * 獲取原始穩定幣資料
 */
async function getStablecoinData() {
  return await fetchStablecoinData();
}

/**
 * 檢查穩定幣是否脫鉤
 * 返回脫鉤超過 1% 的穩定幣
 */
async function checkDepeg(threshold = 0.01) {
  const coins = await fetchStablecoinData();
  
  const depegged = coins.filter(coin => 
    Math.abs(coin.price - 1) > threshold
  );

  if (depegged.length === 0) {
    return null;
  }

  let alert = '⚠️ **穩定幣脫鉤警報**\n\n';
  for (const coin of depegged) {
    const direction = coin.price > 1 ? '📈' : '📉';
    const deviation = ((coin.price - 1) * 100).toFixed(2);
    alert += `${direction} **${coin.symbol}**: $${coin.price.toFixed(4)} (${deviation > 0 ? '+' : ''}${deviation}%)\n`;
  }

  return alert;
}

/**
 * 獲取穩定幣總市值
 */
async function getTotalMarketCap() {
  const coins = await fetchStablecoinData();
  const total = coins.reduce((sum, coin) => sum + (coin.marketCap || 0), 0);
  return {
    total,
    formatted: formatMarketCap(total),
    count: coins.length,
  };
}

/**
 * 獲取單一穩定幣資訊
 */
async function getCoin(symbol) {
  const coins = await fetchStablecoinData();
  return coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
}

module.exports = {
  getStablecoinReport,
  getStablecoinBrief,
  getStablecoinData,
  checkDepeg,
  getTotalMarketCap,
  getCoin,
  STABLECOINS,
};
