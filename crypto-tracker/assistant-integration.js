/**
 * 加密貨幣追蹤器 - 助手整合
 */

const crypto = require('./src/index');

module.exports = {
  /**
   * 獲取加密貨幣快訊
   */
  async getCryptoBrief() {
    return await crypto.generateBrief();
  },

  /**
   * 獲取完整報告
   */
  async getCryptoReport() {
    return await crypto.generateReport();
  },

  /**
   * 查詢特定幣種
   */
  async getCoinPrice(symbol) {
    const coin = await crypto.getCoin(symbol);
    if (!coin) {
      return `找不到 ${symbol}`;
    }
    
    const change = coin.change24h;
    const emoji = change >= 0 ? '🟢' : '🔴';
    const sign = change >= 0 ? '+' : '';
    
    return `**${coin.symbol}** (${coin.name})\n` +
           `💰 $${coin.priceUsd.toLocaleString()} (NT$${Math.round(coin.priceTwd).toLocaleString()})\n` +
           `${emoji} 24h: ${sign}${change?.toFixed(2)}%\n` +
           `📊 市值: $${(coin.marketCap / 1e9).toFixed(2)}B`;
  },

  /**
   * 獲取 BTC 價格
   */
  async getBtcPrice() {
    return await this.getCoinPrice('BTC');
  },

  /**
   * 獲取 ETH 價格
   */
  async getEthPrice() {
    return await this.getCoinPrice('ETH');
  },

  /**
   * 獲取所有追蹤的幣種
   */
  getTrackedCoins() {
    return crypto.TRACKED_COINS.map(c => c.symbol);
  }
};
