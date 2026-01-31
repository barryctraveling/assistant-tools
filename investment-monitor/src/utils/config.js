/**
 * 投資監控系統 - 配置
 */

const path = require('path');
const fs = require('fs');

// 資料存儲路徑
const DATA_DIR = path.join(__dirname, '../../data');
const PORTFOLIO_FILE = path.join(DATA_DIR, 'portfolio.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const CACHE_FILE = path.join(DATA_DIR, 'cache.json');

// 確保資料夾存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Barry 的持股
const WATCHLIST = ['ONDS', 'TSLA'];

// 快取時間（毫秒）
const CACHE_TTL = {
  quote: 60 * 1000,      // 1 分鐘
  news: 30 * 60 * 1000,  // 30 分鐘
};

// 貨幣格式化
function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

// 百分比格式化
function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// 讀取 JSON 檔案
function readJSON(file, defaultValue = {}) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
  return defaultValue;
}

// 寫入 JSON 檔案
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  DATA_DIR,
  PORTFOLIO_FILE,
  ALERTS_FILE,
  CACHE_FILE,
  WATCHLIST,
  CACHE_TTL,
  formatCurrency,
  formatPercent,
  readJSON,
  writeJSON,
};
