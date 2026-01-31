#!/usr/bin/env node

/**
 * 法律新聞追蹤器
 * 
 * 為 Margaret（檢察官，駐點金管會）設計
 * 追蹤金融犯罪、法律動態相關新聞
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
  financialCrime: {
    name: '金融犯罪',
    emoji: '🔍',
    keywords: ['金融犯罪', '洗錢', '詐欺', '內線交易', '經濟犯罪'],
    description: '金融犯罪案件和偵辦動態',
  },
  aml: {
    name: '反洗錢',
    emoji: '🏦',
    keywords: ['反洗錢', 'AML', '洗錢防制', '可疑交易', '金流追蹤'],
    description: '反洗錢法規和案例',
  },
  cryptoCrime: {
    name: '加密貨幣犯罪',
    emoji: '₿',
    keywords: ['加密貨幣詐騙', '虛擬貨幣犯罪', '幣安 詐騙', '投資詐騙'],
    description: '加密貨幣相關犯罪',
  },
  fscEnforcement: {
    name: '金管會執法',
    emoji: '⚖️',
    keywords: ['金管會 裁罰', '金管會 處分', '證交所 處分', '違規'],
    description: '金融監管執法動態',
  },
  prosecution: {
    name: '檢察動態',
    emoji: '🏛️',
    keywords: ['檢察官', '起訴', '偵辦', '地檢署', '法務部'],
    description: '檢察系統動態',
  },
  fraudAlert: {
    name: '詐騙警示',
    emoji: '⚠️',
    keywords: ['詐騙手法', '新型詐騙', '投資詐騙', '網路詐騙'],
    description: '最新詐騙手法警示',
  },
};

// 重要機構
const KEY_ENTITIES = [
  { name: '法務部', type: 'government' },
  { name: '台北地檢署', type: 'prosecution' },
  { name: '金管會', type: 'regulator' },
  { name: '調查局', type: 'investigation' },
  { name: '刑事局', type: 'police' },
];

/**
 * 獲取法律新聞概覽
 */
function getLegalNewsOverview() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW');

  let overview = '⚖️ **法律新聞追蹤**\n\n';
  overview += `📅 ${dateStr}\n\n`;

  overview += '**追蹤主題**\n';
  for (const [id, topic] of Object.entries(TOPICS)) {
    overview += `${topic.emoji} ${topic.name}\n`;
  }

  overview += '\n**重要機構**\n';
  for (const entity of KEY_ENTITIES) {
    overview += `• ${entity.name}\n`;
  }

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
 * 生成工作相關報告
 */
function generateWorkReport() {
  let report = '📊 **金融犯罪工作簡報**\n\n';

  report += '**近期關注重點** 🔍\n';
  report += '• 虛擬資產詐騙案件持續增加\n';
  report += '• 投資詐騙手法不斷翻新\n';
  report += '• 跨境洗錢案件複雜化\n\n';

  report += '**金管會執法動態** ⚖️\n';
  report += '• 持續加強 VASP 監管\n';
  report += '• 強化金融機構 AML 合規\n';
  report += '• 打擊非法金融活動\n\n';

  report += '**建議搜尋關鍵字** 🔎\n';
  report += '• 金融犯罪 台灣\n';
  report += '• 虛擬資產 詐騙\n';
  report += '• 金管會 裁罰\n';

  return report;
}

/**
 * 格式化新聞快訊
 */
function formatBriefing(news = []) {
  let briefing = '⚖️ **法律新聞快訊**\n\n';

  if (news.length === 0) {
    briefing += '（暫無最新消息）\n';
    briefing += '\n建議搜尋：\n';
    briefing += '• 金融犯罪 2026\n';
    briefing += '• 詐騙 起訴\n';
  } else {
    for (const item of news.slice(0, 5)) {
      briefing += `• ${item.title}\n`;
    }
  }

  return briefing;
}

// CLI
function main() {
  const command = process.argv[2] || 'overview';

  switch (command) {
    case 'overview':
      console.log(getLegalNewsOverview());
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
⚖️ 法律新聞追蹤器

使用: node src/index.js <command>

指令:
  overview    法律新聞概覽
  work        工作相關報告
  suggest     搜尋建議
  brief       快訊
  help        顯示幫助
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  TOPICS,
  KEY_ENTITIES,
  getLegalNewsOverview,
  getSearchSuggestions,
  generateWorkReport,
  formatBriefing,
};
