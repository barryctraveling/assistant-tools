#!/usr/bin/env node

/**
 * 知識智能系統 - 主程式入口
 * 
 * 用法：
 *   node src/index.js search <query>      # 語意搜尋
 *   node src/index.js ask <question>      # 知識問答
 *   node src/index.js analyze [tag]       # 分析（趨勢/洞見）
 *   node src/index.js connections <id>    # 查看文章關聯
 *   node src/index.js report              # 生成完整報告
 *   node src/index.js stats               # 統計資訊
 */

const fs = require('fs').promises;
const path = require('path');

const { SemanticSearch } = require('./search/semantic');
const { TrendAnalyzer } = require('./analysis/trends');
const { ConnectionDiscovery } = require('./analysis/connections');
const { InsightGenerator } = require('./analysis/insights');
const { QAEngine } = require('./qa/engine');

// 知識庫路徑
const KNOWLEDGE_BASE_PATH = path.join(
  __dirname, '..', '..', 'smart-articles', 'data', 'knowledge-base.json'
);

/**
 * 載入知識庫
 */
async function loadKnowledgeBase() {
  try {
    const data = await fs.readFile(KNOWLEDGE_BASE_PATH, 'utf-8');
    const kb = JSON.parse(data);
    return kb.articles || [];
  } catch (error) {
    console.error('無法載入知識庫:', error.message);
    console.error('請確認路徑:', KNOWLEDGE_BASE_PATH);
    return [];
  }
}

/**
 * 初始化引擎
 */
async function initEngines() {
  const articles = await loadKnowledgeBase();
  
  if (articles.length === 0) {
    console.log('⚠️  知識庫為空，請先收藏一些文章。');
    return null;
  }
  
  const engines = {
    articles,
    search: new SemanticSearch(),
    trends: new TrendAnalyzer(articles),
    connections: new ConnectionDiscovery(),
    insights: new InsightGenerator(),
    qa: new QAEngine(),
  };
  
  // 初始化各引擎
  engines.search.indexArticles(articles);
  engines.connections.setArticles(articles);
  engines.insights.setArticles(articles);
  engines.qa.loadArticles(articles);
  
  return engines;
}

/**
 * 語意搜尋命令
 */
async function cmdSearch(query, engines) {
  console.log(`🔍 搜尋：${query}\n`);
  
  const results = engines.search.search(query, { topK: 5, includeSnippets: true });
  
  if (results.length === 0) {
    console.log('沒有找到相關文章。');
    return;
  }
  
  console.log(`找到 ${results.length} 篇相關文章：\n`);
  
  for (const result of results) {
    console.log(`📰 ${result.title}`);
    console.log(`   相關度：${(result.score * 100).toFixed(0)}%`);
    console.log(`   分類：${result.category || '未分類'}`);
    if (result.tags?.length > 0) {
      console.log(`   標籤：${result.tags.join(', ')}`);
    }
    if (result.snippets?.length > 0) {
      console.log(`   相關片段：`);
      for (const snippet of result.snippets.slice(0, 2)) {
        console.log(`   > ${snippet.slice(0, 100)}...`);
      }
    }
    console.log('');
  }
}

/**
 * 問答命令
 */
async function cmdAsk(question, engines) {
  console.log(`❓ 問題：${question}\n`);
  
  const result = engines.qa.answer(question);
  
  if (result.status === 'no_relevant_info') {
    console.log(`💭 ${result.answer}`);
    console.log(`\n${result.suggestions}`);
    return;
  }
  
  console.log(`💡 答案（問題類型：${result.questionType}）\n`);
  console.log(result.answer);
  
  if (result.keyPoints?.length > 0) {
    console.log('\n📌 關鍵觀點：');
    for (const point of result.keyPoints) {
      console.log(`   • ${point}`);
    }
  }
  
  if (result.items?.length > 0) {
    console.log('\n📋 列表：');
    for (const item of result.items) {
      console.log(`   • ${item}`);
    }
  }
  
  if (result.reasons?.length > 0) {
    console.log('\n🔍 原因分析：');
    for (const reason of result.reasons) {
      console.log(`   • ${reason}`);
    }
  }
  
  if (result.sources?.length > 0) {
    console.log('\n📚 參考來源：');
    for (const source of result.sources) {
      console.log(`   - ${source.title} (相關度 ${source.relevance}%)`);
    }
  }
  
  if (result.suggestedFollowups?.length > 0) {
    console.log('\n💬 您可能還想問：');
    for (const q of result.suggestedFollowups) {
      console.log(`   → ${q}`);
    }
  }
}

/**
 * 分析命令
 */
async function cmdAnalyze(tag, engines) {
  if (tag) {
    console.log(`📊 主題分析：${tag}\n`);
    
    const trend = engines.trends.analyzeTrend(tag);
    const insights = engines.insights.generateTopicInsights(tag);
    
    console.log(`文章數量：${trend.articleCount}`);
    console.log(`趨勢：${trend.trendDescription}`);
    console.log(`首次提及：${trend.firstMention || '未知'}`);
    console.log(`最後提及：${trend.lastMention || '未知'}`);
    
    if (insights.mainPoints?.length > 0) {
      console.log('\n📌 主要觀點：');
      for (const point of insights.mainPoints) {
        console.log(`   • ${point}`);
      }
    }
    
    if (insights.relatedTopics?.length > 0) {
      console.log('\n🔗 相關主題：');
      for (const t of insights.relatedTopics) {
        console.log(`   • ${t.tag} (${t.coOccurrence} 篇共同文章)`);
      }
    }
  } else {
    // 全面分析
    console.log('📊 知識庫全面分析\n');
    
    const report = engines.trends.generateReport();
    console.log(report);
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    const crossInsights = engines.insights.generateCrossArticleInsights();
    if (crossInsights.narrativeInsights?.length > 0) {
      console.log('💡 知識洞見：\n');
      for (const insight of crossInsights.narrativeInsights) {
        console.log(`   • ${insight.text}`);
      }
    }
  }
}

/**
 * 關聯命令
 */
async function cmdConnections(articleId, engines) {
  // 如果沒有指定 ID，列出所有文章
  if (!articleId) {
    console.log('📚 知識庫中的文章：\n');
    for (const article of engines.articles) {
      console.log(`   ${article.id} - ${article.title}`);
    }
    console.log('\n使用方式：node src/index.js connections <article_id>');
    return;
  }
  
  const report = engines.connections.generateReport(articleId);
  console.log(report);
}

/**
 * 報告命令
 */
async function cmdReport(engines) {
  const report = engines.insights.generateFullReport();
  console.log(report);
}

/**
 * 統計命令
 */
async function cmdStats(engines) {
  console.log('📊 知識庫統計\n');
  console.log(`總文章數：${engines.articles.length}`);
  
  const searchStats = engines.search.getStats();
  console.log(`詞彙量：${searchStats.vectorizerStats.vocabularySize}`);
  console.log(`平均文章長度：${searchStats.vectorizerStats.averageDocLength.toFixed(0)} tokens`);
  
  const categories = searchStats.categories;
  console.log('\n分類統計：');
  for (const [category, articles] of Object.entries(categories)) {
    console.log(`   ${category}: ${articles.length} 篇`);
  }
  
  // 標籤統計
  const tagCounts = {};
  for (const article of engines.articles) {
    for (const tag of (article.tags || [])) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('\n熱門標籤：');
  for (const [tag, count] of topTags) {
    console.log(`   #${tag}: ${count} 篇`);
  }
}

/**
 * 主程式
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args.slice(1).join(' ');
  
  if (!command) {
    console.log('🧠 知識智能系統\n');
    console.log('用法：');
    console.log('  node src/index.js search <query>      語意搜尋');
    console.log('  node src/index.js ask <question>      知識問答');
    console.log('  node src/index.js analyze [tag]       分析趨勢');
    console.log('  node src/index.js connections [id]    查看關聯');
    console.log('  node src/index.js report              完整報告');
    console.log('  node src/index.js stats               統計資訊');
    console.log('\n範例：');
    console.log('  node src/index.js search "RWA 代幣化"');
    console.log('  node src/index.js ask "穩定幣的主要風險是什麼？"');
    console.log('  node src/index.js analyze RWA');
    return;
  }
  
  const engines = await initEngines();
  if (!engines) return;
  
  switch (command) {
    case 'search':
      if (!param) {
        console.log('請提供搜尋詞。例如：node src/index.js search "RWA"');
        return;
      }
      await cmdSearch(param, engines);
      break;
      
    case 'ask':
      if (!param) {
        console.log('請提供問題。例如：node src/index.js ask "什麼是RWA？"');
        return;
      }
      await cmdAsk(param, engines);
      break;
      
    case 'analyze':
      await cmdAnalyze(param || null, engines);
      break;
      
    case 'connections':
      await cmdConnections(param || null, engines);
      break;
      
    case 'report':
      await cmdReport(engines);
      break;
      
    case 'stats':
      await cmdStats(engines);
      break;
      
    default:
      console.log(`未知命令：${command}`);
      console.log('使用 "node src/index.js" 查看可用命令。');
  }
}

// 匯出模組
module.exports = {
  loadKnowledgeBase,
  initEngines,
  SemanticSearch,
  TrendAnalyzer,
  ConnectionDiscovery,
  InsightGenerator,
  QAEngine,
};

// 執行主程式
if (require.main === module) {
  main().catch(console.error);
}
