/**
 * Fintech 新聞追蹤配置
 */

const path = require('path');
const fs = require('fs');

// 資料存儲
const DATA_DIR = path.join(__dirname, '../data');
const CACHE_FILE = path.join(DATA_DIR, 'cache.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// 確保資料夾存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 追蹤主題配置
const TOPICS = {
  rwa: {
    name: 'RWA 資產代幣化',
    priority: 3,
    keywords: {
      en: ['real world assets', 'RWA tokenization', 'asset tokenization', 'tokenized assets'],
      zh: ['RWA', '資產代幣化', '實物資產上鏈', '代幣化資產'],
    },
    sources: ['coindesk', 'theblock', 'cointelegraph'],
  },
  stablecoin: {
    name: '穩定幣',
    priority: 3,
    keywords: {
      en: ['stablecoin', 'USDT', 'USDC', 'stablecoin regulation', 'Tether'],
      zh: ['穩定幣', '穩定幣監管', 'USDT', 'USDC'],
    },
    sources: ['coindesk', 'theblock'],
  },
  cbdc: {
    name: 'CBDC 數位央行貨幣',
    priority: 2,
    keywords: {
      en: ['CBDC', 'central bank digital currency', 'digital yuan', 'digital euro'],
      zh: ['央行數位貨幣', 'CBDC', '數位人民幣', '數位台幣'],
    },
    sources: [],
  },
  defi: {
    name: 'DeFi 去中心化金融',
    priority: 2,
    keywords: {
      en: ['DeFi', 'decentralized finance', 'yield farming', 'liquidity'],
      zh: ['去中心化金融', 'DeFi', '流動性挖礦'],
    },
    sources: [],
  },
  taiwan: {
    name: '台灣金融科技',
    priority: 3,
    keywords: {
      en: ['Taiwan fintech', 'Taiwan banking', 'Taiwan crypto regulation'],
      zh: ['金管會', '台灣銀行', '台灣金融科技', '台灣加密貨幣', '台灣數位金融'],
    },
    sources: [],
  },
  banking: {
    name: '銀行創新',
    priority: 2,
    keywords: {
      en: ['banking innovation', 'neobank', 'open banking', 'embedded finance'],
      zh: ['銀行創新', '開放銀行', '數位銀行', '嵌入式金融'],
    },
    sources: [],
  },
};

// 讀取 JSON
function readJSON(file, defaultValue = {}) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {}
  return defaultValue;
}

// 寫入 JSON
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  DATA_DIR,
  CACHE_FILE,
  HISTORY_FILE,
  TOPICS,
  readJSON,
  writeJSON,
};
