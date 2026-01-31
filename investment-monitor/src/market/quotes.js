/**
 * 股價獲取模組
 * 使用 Yahoo Finance 獲取即時報價
 */

const { CACHE_FILE, CACHE_TTL, readJSON, writeJSON } = require('../utils/config');

/**
 * 從 Yahoo Finance 獲取報價
 * @param {string[]} symbols - 股票代碼列表
 * @returns {Promise<Object>} 報價資料
 */
async function fetchQuotes(symbols) {
  const results = {};
  
  for (const symbol of symbols) {
    try {
      // 檢查快取
      const cached = getCachedQuote(symbol);
      if (cached) {
        results[symbol] = cached;
        continue;
      }

      // 使用 Yahoo Finance chart API
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const chart = data.chart?.result?.[0];
      
      if (!chart) {
        throw new Error('No data returned');
      }

      const meta = chart.meta;
      const quote = chart.indicators?.quote?.[0];
      const timestamps = chart.timestamp || [];
      
      // 獲取最新價格
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      // 獲取歷史數據（5天）
      const history = timestamps.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        open: quote?.open?.[i],
        high: quote?.high?.[i],
        low: quote?.low?.[i],
        close: quote?.close?.[i],
        volume: quote?.volume?.[i],
      })).filter(d => d.close != null);

      const result = {
        symbol: meta.symbol,
        name: meta.shortName || meta.longName || symbol,
        price: currentPrice,
        previousClose,
        change,
        changePercent,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        volume: meta.regularMarketVolume,
        marketCap: meta.marketCap,
        exchange: meta.exchangeName,
        currency: meta.currency,
        marketState: meta.marketState, // PRE, REGULAR, POST, CLOSED
        history: history.slice(-5),
        fetchedAt: new Date().toISOString(),
      };

      // 快取結果
      cacheQuote(symbol, result);
      results[symbol] = result;

    } catch (error) {
      results[symbol] = {
        symbol,
        error: error.message,
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  return results;
}

/**
 * 檢查快取
 */
function getCachedQuote(symbol) {
  const cache = readJSON(CACHE_FILE, { quotes: {} });
  const cached = cache.quotes?.[symbol];
  
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_TTL.quote) {
      return cached;
    }
  }
  
  return null;
}

/**
 * 儲存到快取
 */
function cacheQuote(symbol, data) {
  const cache = readJSON(CACHE_FILE, { quotes: {} });
  cache.quotes = cache.quotes || {};
  cache.quotes[symbol] = data;
  writeJSON(CACHE_FILE, cache);
}

/**
 * 格式化報價輸出
 */
function formatQuote(quote) {
  if (quote.error) {
    return `❌ ${quote.symbol}: ${quote.error}`;
  }

  const { symbol, name, price, change, changePercent, dayHigh, dayLow, volume, marketState } = quote;
  
  const emoji = change >= 0 ? '📈' : '📉';
  const sign = change >= 0 ? '+' : '';
  const stateEmoji = marketState === 'REGULAR' ? '🟢' : marketState === 'CLOSED' ? '🔴' : '🟡';

  let output = `${emoji} **${symbol}** (${name})\n`;
  output += `💰 $${price.toFixed(2)} (${sign}${change.toFixed(2)} / ${sign}${changePercent.toFixed(2)}%)\n`;
  output += `📊 High: $${dayHigh?.toFixed(2) || 'N/A'} | Low: $${dayLow?.toFixed(2) || 'N/A'}\n`;
  
  if (volume) {
    const volStr = volume >= 1000000 ? `${(volume/1000000).toFixed(2)}M` : 
                   volume >= 1000 ? `${(volume/1000).toFixed(1)}K` : volume;
    output += `📦 Volume: ${volStr}\n`;
  }
  
  output += `${stateEmoji} Market: ${marketState}`;

  return output;
}

module.exports = {
  fetchQuotes,
  formatQuote,
  getCachedQuote,
  cacheQuote,
};
