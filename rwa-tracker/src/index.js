#!/usr/bin/env node

/**
 * RWA 市場追蹤器
 * 追蹤代幣化真實世界資產
 */

const fs = require('fs');
const path = require('path');

// 資料目錄
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// RWA 類別定義
const RWA_CATEGORIES = {
  treasuries: {
    name: '代幣化國債',
    emoji: '🏛️',
    description: '代幣化美國國債和政府債券',
  },
  privateCredit: {
    name: '私募信貸',
    emoji: '💳',
    description: '代幣化私募信貸和貸款',
  },
  commodities: {
    name: '大宗商品',
    emoji: '🥇',
    description: '代幣化黃金、白銀等',
  },
  realEstate: {
    name: '房地產',
    emoji: '🏠',
    description: '代幣化房地產資產',
  },
  equities: {
    name: '股票',
    emoji: '📈',
    description: '代幣化股票和證券',
  },
};

// 主要 RWA 協議
const RWA_PROTOCOLS = {
  ondo: { name: 'Ondo Finance', category: 'treasuries', chain: 'Ethereum' },
  matrixdock: { name: 'Matrixdock', category: 'treasuries', chain: 'Ethereum' },
  backed: { name: 'Backed Finance', category: 'treasuries', chain: 'Ethereum' },
  maple: { name: 'Maple Finance', category: 'privateCredit', chain: 'Ethereum' },
  centrifuge: { name: 'Centrifuge', category: 'privateCredit', chain: 'Ethereum' },
  goldfinch: { name: 'Goldfinch', category: 'privateCredit', chain: 'Ethereum' },
  paxos: { name: 'Paxos Gold', category: 'commodities', chain: 'Ethereum' },
  tether_gold: { name: 'Tether Gold', category: 'commodities', chain: 'Ethereum' },
};

/**
 * 從 DefiLlama 獲取 RWA TVL 資料
 */
async function fetchRWAData() {
  try {
    // 獲取 RWA 分類的 TVL
    const url = 'https://api.llama.fi/v2/protocols';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const protocols = await response.json();
    
    // 篩選 RWA 相關協議
    const rwaKeywords = ['rwa', 'treasury', 'bond', 'credit', 'gold', 'real world'];
    const rwaProtocols = protocols.filter(p => {
      const name = p.name?.toLowerCase() || '';
      const category = p.category?.toLowerCase() || '';
      return rwaKeywords.some(kw => name.includes(kw) || category.includes(kw)) ||
             Object.keys(RWA_PROTOCOLS).some(key => name.toLowerCase().includes(key));
    });

    return rwaProtocols.map(p => ({
      name: p.name,
      symbol: p.symbol,
      tvl: p.tvl || 0,
      category: p.category,
      chain: p.chain,
      url: p.url,
      change24h: p.change_1d,
      change7d: p.change_7d,
    })).sort((a, b) => b.tvl - a.tvl);
  } catch (error) {
    console.error('Fetch error:', error.message);
    return [];
  }
}

/**
 * 獲取市場統計（使用已知數據估算）
 */
function getMarketStats() {
  // 基於公開資料的估算值（截至 2026 年 1 月）
  return {
    totalMarket: 19.4e9, // ~$19.4B 總 RWA 市值
    treasuries: 8.7e9,   // ~$8.7B 代幣化國債
    privateCredit: 5.2e9, // ~$5.2B 私募信貸
    commodities: 2.1e9,  // ~$2.1B 大宗商品
    realEstate: 1.8e9,   // ~$1.8B 房地產
    equities: 1.6e9,     // ~$1.6B 其他
    growth: {
      ytd: 45,  // YTD 增長 %
      mom: 8,   // MoM 增長 %
    },
    lastUpdated: new Date().toISOString(),
    note: '數據來源：RWA.xyz, DefiLlama（估算值）',
  };
}

/**
 * 格式化金額
 */
function formatAmount(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

/**
 * 生成市場概覽報告
 */
function generateMarketOverview() {
  const stats = getMarketStats();

  let report = '🏦 **RWA 市場概覽**\n\n';
  report += `**總市值**: ${formatAmount(stats.totalMarket)}\n`;
  report += `📈 YTD 增長: +${stats.growth.ytd}%\n`;
  report += `📊 MoM 增長: +${stats.growth.mom}%\n\n`;

  report += '**按類別分布**\n';
  report += `${RWA_CATEGORIES.treasuries.emoji} 國債: ${formatAmount(stats.treasuries)}\n`;
  report += `${RWA_CATEGORIES.privateCredit.emoji} 私募信貸: ${formatAmount(stats.privateCredit)}\n`;
  report += `${RWA_CATEGORIES.commodities.emoji} 大宗商品: ${formatAmount(stats.commodities)}\n`;
  report += `${RWA_CATEGORIES.realEstate.emoji} 房地產: ${formatAmount(stats.realEstate)}\n`;
  report += `${RWA_CATEGORIES.equities.emoji} 其他: ${formatAmount(stats.equities)}\n\n`;

  report += `_${stats.note}_\n`;
  report += `_更新時間: ${new Date().toLocaleString('zh-TW')}_`;

  return report;
}

/**
 * 生成簡短摘要
 */
function generateBriefSummary() {
  const stats = getMarketStats();

  let summary = '🏦 **RWA 快訊**\n\n';
  summary += `總市值: ${formatAmount(stats.totalMarket)} (+${stats.growth.mom}% MoM)\n`;
  summary += `🏛️ 國債: ${formatAmount(stats.treasuries)}\n`;
  summary += `💳 信貸: ${formatAmount(stats.privateCredit)}\n`;

  return summary;
}

/**
 * 生成國債專題報告
 */
function generateTreasuriesReport() {
  const stats = getMarketStats();

  let report = '🏛️ **代幣化國債報告**\n\n';
  report += `**總規模**: ${formatAmount(stats.treasuries)}\n`;
  report += `佔 RWA 總市值: ${((stats.treasuries / stats.totalMarket) * 100).toFixed(1)}%\n\n`;

  report += '**主要協議**\n';
  report += '• Ondo Finance (OUSG, USDY)\n';
  report += '• Franklin Templeton (BENJI)\n';
  report += '• Matrixdock (STBT)\n';
  report += '• Backed Finance (bIB01)\n\n';

  report += '**趨勢觀察**\n';
  report += '• 機構參與度持續增加\n';
  report += '• 監管框架逐漸明朗\n';
  report += '• 與 DeFi 整合加深\n';

  return report;
}

// CLI
async function main() {
  const command = process.argv[2] || 'overview';

  switch (command) {
    case 'overview':
    case 'market':
      console.log(generateMarketOverview());
      break;

    case 'brief':
    case 'quick':
      console.log(generateBriefSummary());
      break;

    case 'treasuries':
    case 'treasury':
      console.log(generateTreasuriesReport());
      break;

    case 'protocols':
      console.log('📊 獲取協議資料中...\n');
      const protocols = await fetchRWAData();
      if (protocols.length === 0) {
        console.log('無法獲取協議資料');
      } else {
        console.log('**RWA 協議排名**\n');
        for (let i = 0; i < Math.min(10, protocols.length); i++) {
          const p = protocols[i];
          console.log(`${i + 1}. ${p.name}: ${formatAmount(p.tvl)}`);
        }
      }
      break;

    case 'help':
    default:
      console.log(`
🏦 RWA 市場追蹤器

使用: node src/index.js <command>

指令:
  overview, market   市場概覽
  brief, quick       簡短摘要
  treasuries         國債專題
  protocols          協議排名
  help               顯示幫助
`);
  }
}

// 只在直接執行時運行 CLI
if (require.main === module) {
  main().catch(e => console.error('Error:', e.message));
}

module.exports = {
  fetchRWAData,
  getMarketStats,
  generateMarketOverview,
  generateBriefSummary,
  generateTreasuriesReport,
  formatAmount,
  RWA_CATEGORIES,
  RWA_PROTOCOLS,
};
