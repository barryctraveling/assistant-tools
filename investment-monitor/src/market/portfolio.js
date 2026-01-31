/**
 * 投資組合管理
 */

const { PORTFOLIO_FILE, readJSON, writeJSON, formatCurrency, formatPercent } = require('../utils/config');
const { fetchQuotes } = require('./quotes');

/**
 * 獲取投資組合
 */
function getPortfolio() {
  return readJSON(PORTFOLIO_FILE, { 
    positions: {},
    updatedAt: null,
  });
}

/**
 * 儲存投資組合
 */
function savePortfolio(portfolio) {
  portfolio.updatedAt = new Date().toISOString();
  writeJSON(PORTFOLIO_FILE, portfolio);
}

/**
 * 設定持倉
 * @param {string} symbol - 股票代碼
 * @param {number} shares - 股數
 * @param {number} costBasis - 成本價（每股）
 * @param {string} note - 備註
 */
function setPosition(symbol, shares, costBasis, note = '') {
  const portfolio = getPortfolio();
  
  portfolio.positions[symbol.toUpperCase()] = {
    symbol: symbol.toUpperCase(),
    shares,
    costBasis,
    totalCost: shares * costBasis,
    note,
    addedAt: new Date().toISOString(),
  };
  
  savePortfolio(portfolio);
  return portfolio.positions[symbol.toUpperCase()];
}

/**
 * 移除持倉
 */
function removePosition(symbol) {
  const portfolio = getPortfolio();
  
  if (!portfolio.positions[symbol.toUpperCase()]) {
    return false;
  }
  
  delete portfolio.positions[symbol.toUpperCase()];
  savePortfolio(portfolio);
  return true;
}

/**
 * 計算投資組合績效
 */
async function calculatePerformance() {
  const portfolio = getPortfolio();
  const positions = Object.values(portfolio.positions);
  
  if (positions.length === 0) {
    return {
      positions: [],
      totalCost: 0,
      totalValue: 0,
      totalGain: 0,
      totalGainPercent: 0,
    };
  }

  // 獲取最新報價
  const symbols = positions.map(p => p.symbol);
  const quotes = await fetchQuotes(symbols);

  // 計算每個持倉的績效
  const enrichedPositions = positions.map(pos => {
    const quote = quotes[pos.symbol];
    
    if (!quote || quote.error) {
      return {
        ...pos,
        currentPrice: null,
        currentValue: null,
        gain: null,
        gainPercent: null,
        dayChange: null,
        dayChangePercent: null,
        error: quote?.error || 'No quote data',
      };
    }

    const currentValue = pos.shares * quote.price;
    const gain = currentValue - pos.totalCost;
    const gainPercent = (gain / pos.totalCost) * 100;
    const dayChange = pos.shares * quote.change;
    const dayChangePercent = quote.changePercent;

    return {
      ...pos,
      name: quote.name,
      currentPrice: quote.price,
      currentValue,
      gain,
      gainPercent,
      dayChange,
      dayChangePercent,
      marketState: quote.marketState,
    };
  });

  // 計算總計
  const validPositions = enrichedPositions.filter(p => p.currentValue != null);
  const totalCost = validPositions.reduce((sum, p) => sum + p.totalCost, 0);
  const totalValue = validPositions.reduce((sum, p) => sum + p.currentValue, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const totalDayChange = validPositions.reduce((sum, p) => sum + (p.dayChange || 0), 0);

  return {
    positions: enrichedPositions,
    totalCost,
    totalValue,
    totalGain,
    totalGainPercent,
    totalDayChange,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 格式化投資組合報告
 */
function formatPortfolioReport(performance) {
  const { positions, totalCost, totalValue, totalGain, totalGainPercent, totalDayChange } = performance;

  if (positions.length === 0) {
    return '📭 尚未設定任何持倉\n\n使用 `portfolio set` 來新增持倉';
  }

  let report = '📊 **投資組合報告**\n\n';

  // 個股詳情
  for (const pos of positions) {
    if (pos.error) {
      report += `❌ **${pos.symbol}** - 無法獲取資料\n\n`;
      continue;
    }

    const gainEmoji = pos.gain >= 0 ? '📈' : '📉';
    const dayEmoji = pos.dayChange >= 0 ? '🟢' : '🔴';

    report += `**${pos.symbol}** (${pos.name})\n`;
    report += `├ 持股: ${pos.shares} 股\n`;
    report += `├ 成本: ${formatCurrency(pos.costBasis)}/股 (總: ${formatCurrency(pos.totalCost)})\n`;
    report += `├ 現價: ${formatCurrency(pos.currentPrice)}/股 (總: ${formatCurrency(pos.currentValue)})\n`;
    report += `├ ${gainEmoji} 損益: ${formatCurrency(pos.gain)} (${formatPercent(pos.gainPercent)})\n`;
    report += `└ ${dayEmoji} 今日: ${formatCurrency(pos.dayChange)} (${formatPercent(pos.dayChangePercent)})\n`;
    report += '\n';
  }

  // 總計
  report += '━━━━━━━━━━━━━━━━━━\n';
  report += `**總投入**: ${formatCurrency(totalCost)}\n`;
  report += `**總市值**: ${formatCurrency(totalValue)}\n`;
  
  const totalEmoji = totalGain >= 0 ? '📈' : '📉';
  report += `**總損益**: ${totalEmoji} ${formatCurrency(totalGain)} (${formatPercent(totalGainPercent)})\n`;
  
  if (totalDayChange !== undefined) {
    const dayEmoji = totalDayChange >= 0 ? '🟢' : '🔴';
    report += `**今日變化**: ${dayEmoji} ${formatCurrency(totalDayChange)}\n`;
  }

  return report;
}

/**
 * 簡潔版組合摘要（用於每日報告）
 */
function formatPortfolioSummary(performance) {
  const { positions, totalValue, totalGain, totalGainPercent, totalDayChange } = performance;

  if (positions.length === 0) {
    return '（尚無持倉資料）';
  }

  const totalEmoji = totalGain >= 0 ? '📈' : '📉';
  const dayEmoji = totalDayChange >= 0 ? '🟢' : '🔴';

  let summary = `總市值: ${formatCurrency(totalValue)}\n`;
  summary += `${totalEmoji} 總損益: ${formatCurrency(totalGain)} (${formatPercent(totalGainPercent)})\n`;
  summary += `${dayEmoji} 今日: ${formatCurrency(totalDayChange)}\n\n`;

  // 個股快速摘要
  for (const pos of positions) {
    if (pos.error) continue;
    
    const emoji = pos.dayChange >= 0 ? '🟢' : '🔴';
    summary += `${emoji} ${pos.symbol}: ${formatCurrency(pos.currentPrice)} (${formatPercent(pos.dayChangePercent)})\n`;
  }

  return summary;
}

module.exports = {
  getPortfolio,
  setPosition,
  removePosition,
  calculatePerformance,
  formatPortfolioReport,
  formatPortfolioSummary,
};
