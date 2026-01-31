#!/usr/bin/env node

/**
 * 台灣金融科技追蹤器
 * 專門追蹤台灣的金融科技、銀行創新和監管動態
 */

const path = require('path');
const fs = require('fs');

// 資料目錄
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 追蹤主題
const TOPICS = {
  fsc: {
    name: '金管會動態',
    emoji: '🏛️',
    keywords: ['金管會', '金融監督管理委員會', 'FSC'],
    description: '金管會政策、公告、法規',
  },
  banks: {
    name: '銀行創新',
    emoji: '🏦',
    keywords: ['數位銀行', '純網銀', '開放銀行', '銀行創新'],
    description: '台灣銀行業數位轉型',
  },
  crypto: {
    name: '加密貨幣監管',
    emoji: '₿',
    keywords: ['虛擬資產', '加密貨幣', 'VASP', '幣安 台灣'],
    description: '台灣加密貨幣監管動態',
  },
  cbdc: {
    name: '數位新台幣',
    emoji: '💴',
    keywords: ['數位新台幣', '央行數位貨幣', 'CBDC 台灣', '中央銀行'],
    description: '台灣央行數位貨幣進展',
  },
  payments: {
    name: '支付創新',
    emoji: '💳',
    keywords: ['行動支付', '電子支付', 'Line Pay', '街口支付'],
    description: '台灣支付產業發展',
  },
  sandbox: {
    name: '金融沙盒',
    emoji: '🧪',
    keywords: ['金融沙盒', '監理沙盒', 'fintech sandbox'],
    description: '金融監理沙盒案例',
  },
};

// 重要機構
const KEY_ENTITIES = [
  { name: '金管會', type: 'regulator' },
  { name: '中央銀行', type: 'regulator' },
  { name: '臺灣銀行', type: 'bank' },
  { name: '第一銀行', type: 'bank' },
  { name: '國泰金控', type: 'financial' },
  { name: '富邦金控', type: 'financial' },
  { name: 'LINE Bank', type: 'neobank' },
  { name: '將來銀行', type: 'neobank' },
  { name: '樂天銀行', type: 'neobank' },
];

/**
 * 獲取台灣 Fintech 概覽
 */
function getTaiwanFintechOverview() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW');

  let overview = '🇹🇼 **台灣金融科技概覽**\n\n';
  overview += `📅 ${dateStr}\n\n`;

  // 主題列表
  overview += '**追蹤主題**\n';
  for (const [id, topic] of Object.entries(TOPICS)) {
    overview += `${topic.emoji} ${topic.name}\n`;
  }

  overview += '\n**重要機構**\n';
  overview += '• 監管: 金管會、中央銀行\n';
  overview += '• 純網銀: LINE Bank、將來銀行、樂天銀行\n';
  overview += '• 金控: 國泰、富邦、中信\n';

  return overview;
}

/**
 * 獲取搜尋建議
 */
function getSearchSuggestions() {
  const suggestions = [];

  for (const [id, topic] of Object.entries(TOPICS)) {
    suggestions.push({
      topic: id,
      name: topic.name,
      queries: topic.keywords.slice(0, 2),
    });
  }

  return suggestions;
}

/**
 * 格式化台灣 Fintech 快訊
 */
function formatBriefing(news = []) {
  let briefing = '🇹🇼 **台灣 Fintech 快訊**\n\n';

  if (news.length === 0) {
    briefing += '（暫無最新消息）\n';
    briefing += '\n建議搜尋關鍵字：\n';
    briefing += '• 金管會 虛擬資產\n';
    briefing += '• 數位新台幣\n';
    briefing += '• 純網銀 台灣\n';
  } else {
    for (const item of news.slice(0, 5)) {
      briefing += `• ${item.title}\n`;
    }
  }

  return briefing;
}

/**
 * 生成工作相關報告
 * （為 Barry 在臺灣銀行創新實驗室的工作設計）
 */
function generateWorkReport() {
  let report = '📊 **台灣金融科技工作報告**\n\n';

  report += '**監管動態** 🏛️\n';
  report += '• 金管會持續推動虛擬資產監管框架\n';
  report += '• VASP 登記制度持續執行\n';
  report += '• 穩定幣相關法規研議中\n\n';

  report += '**RWA 發展** 🏦\n';
  report += '• 台灣在 RWA 領域仍處起步階段\n';
  report += '• 證券型代幣發行（STO）規範已上路\n';
  report += '• 銀行業對代幣化資產態度保守\n\n';

  report += '**純網銀進展** 💳\n';
  report += '• LINE Bank、將來銀行、樂天銀行營運中\n';
  report += '• 持續拓展存款和貸款業務\n\n';

  report += '**數位新台幣** 💴\n';
  report += '• 央行持續研究和測試\n';
  report += '• 尚未有明確推出時間表\n';

  return report;
}

// CLI
async function main() {
  const command = process.argv[2] || 'overview';

  switch (command) {
    case 'overview':
      console.log(getTaiwanFintechOverview());
      break;

    case 'work':
      console.log(generateWorkReport());
      break;

    case 'suggest':
      console.log('🔍 搜尋建議：\n');
      for (const s of getSearchSuggestions()) {
        console.log(`${s.name}: ${s.queries.join(', ')}`);
      }
      break;

    case 'brief':
      console.log(formatBriefing());
      break;

    case 'help':
    default:
      console.log(`
🇹🇼 台灣金融科技追蹤器

使用: node src/index.js <command>

指令:
  overview    台灣 Fintech 概覽
  work        工作相關報告
  suggest     搜尋建議
  brief       快訊
  help        顯示幫助
`);
  }
}

// 只在直接執行時運行 CLI
if (require.main === module) {
  main().catch(e => console.error('Error:', e.message));
}

module.exports = {
  TOPICS,
  KEY_ENTITIES,
  getTaiwanFintechOverview,
  getSearchSuggestions,
  formatBriefing,
  generateWorkReport,
};
