/**
 * 匯率追蹤器 - 助手整合模組
 */

const forex = require('./src/index');

module.exports = {
  /**
   * 獲取完整匯率報告
   */
  getForexReport: async () => {
    return await forex.generateFullReport();
  },

  /**
   * 獲取台幣匯率簡報
   */
  getForexBrief: async () => {
    return await forex.generateTwdBrief();
  },

  /**
   * 貨幣換算
   */
  convert: async (amount, from, to) => {
    return await forex.convert(amount, from, to);
  },

  /**
   * 獲取 USD/TWD 匯率
   */
  getUsdTwd: async () => {
    const rates = await forex.fetchExchangeRates('USD');
    if (rates) {
      return {
        rate: rates.rates.TWD,
        lastUpdate: rates.lastUpdate,
      };
    }
    return null;
  },

  /**
   * 美元換算台幣
   */
  usdToTwd: async (usdAmount) => {
    return await forex.convert(usdAmount, 'USD', 'TWD');
  },

  /**
   * 台幣換算美元
   */
  twdToUsd: async (twdAmount) => {
    return await forex.convert(twdAmount, 'TWD', 'USD');
  },
};
