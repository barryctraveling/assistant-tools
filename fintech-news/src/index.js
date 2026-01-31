#!/usr/bin/env node

/**
 * Fintech 新聞追蹤器 - 主程式
 * 
 * 注意：此工具需要配合助手使用
 * 助手會使用 web_search 來搜尋新聞
 */

const { TOPICS } = require('./config');
const { getSearchInstructions, generateQueries } = require('./sources/search');
const { formatNewsList, formatByTopic, formatBrief } = require('./reports/formatter');

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'topics':
      showTopics();
      break;

    case 'queries':
      showQueries(args[1]);
      break;

    case 'instructions':
      showInstructions();
      break;

    case 'help':
    case '-h':
    case '--help':
    default:
      showHelp();
      break;
  }
}

function showTopics() {
  console.log('📰 **追蹤主題**\n');

  for (const [id, config] of Object.entries(TOPICS)) {
    const stars = '⭐'.repeat(config.priority);
    console.log(`**${config.name}** (${id}) ${stars}`);
    console.log(`  EN: ${config.keywords.en.slice(0, 3).join(', ')}`);
    console.log(`  ZH: ${config.keywords.zh.slice(0, 3).join(', ')}`);
    console.log();
  }
}

function showQueries(topic) {
  if (topic) {
    const config = TOPICS[topic];
    if (!config) {
      console.error(`❌ 未知主題: ${topic}`);
      console.log(`可用主題: ${Object.keys(TOPICS).join(', ')}`);
      return;
    }

    console.log(`📰 ${config.name} 搜尋查詢\n`);
    console.log('英文:');
    generateQueries(topic, 'en').forEach(q => console.log(`  - ${q}`));
    console.log('\n中文:');
    generateQueries(topic, 'zh').forEach(q => console.log(`  - ${q}`));
  } else {
    console.log('📰 所有主題搜尋查詢\n');
    
    for (const [id, config] of Object.entries(TOPICS)) {
      console.log(`**${config.name}** (${id})`);
      console.log(`  ${config.keywords.en[0]}, ${config.keywords.zh[0]}`);
    }
  }
}

function showInstructions() {
  const instructions = getSearchInstructions();
  console.log('📋 **助手搜尋指南**\n');
  console.log(JSON.stringify(instructions, null, 2));
}

function showHelp() {
  console.log(`
📰 Fintech 新聞追蹤器

使用方法:
  node src/index.js <command>

指令:
  topics          列出所有追蹤主題
  queries [TOPIC] 顯示搜尋查詢
  instructions    顯示助手搜尋指南
  help            顯示此幫助

主題:
  ${Object.keys(TOPICS).join(', ')}

注意:
  此工具設計用於助手整合。
  助手會使用 web_search 工具來搜尋新聞，
  然後使用此工具的模組來格式化結果。

助手整合:
  const fintech = require('./assistant-integration');
  await fintech.searchTopic('rwa');
  fintech.formatNews(items);
`);
}

main();
