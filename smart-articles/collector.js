#!/usr/bin/env node

/**
 * 智慧文章收藏系統 - 主程式
 * 
 * 使用方式：
 *   node collector.js <url> [options]
 * 
 * 選項：
 *   --dry-run    只分析，不存入 Notion
 *   --verbose    顯示詳細資訊
 */

const { ArticleAnalyzer } = require('./lib/analyzer');
const { NotionClient } = require('./lib/notion');
const { KnowledgeBase } = require('./lib/knowledge');
const fs = require('fs').promises;
const path = require('path');

// 載入配置
async function loadConfig() {
  const configPath = path.join(__dirname, '..', '..', 'config', 'notion.json');
  const data = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(data);
}

// 抓取網頁內容（使用 fetch API）
async function fetchArticle(url) {
  // 使用 OpenClaw 的 web_fetch 或直接 fetch
  // 這裡簡化為直接 fetch，實際使用時會由 OpenClaw 代勞
  const response = await fetch(url);
  const html = await response.text();
  
  // 簡單的 HTML 轉文字（實際使用時由 OpenClaw 的 web_fetch 處理）
  // 移除 HTML 標籤
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return text;
}

// 主程式
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法: node collector.js <url> [--dry-run] [--verbose]');
    console.log('');
    console.log('範例:');
    console.log('  node collector.js https://example.com/article');
    console.log('  node collector.js https://example.com/article --dry-run');
    process.exit(1);
  }

  const url = args[0];
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('🚀 智慧文章收藏系統');
  console.log('==================');
  console.log(`📎 URL: ${url}`);
  console.log(`⚙️  模式: ${dryRun ? '測試模式（不寫入 Notion）' : '正式模式'}`);
  console.log('');

  try {
    // 1. 載入配置
    console.log('📂 載入配置...');
    const config = await loadConfig();
    
    // 2. 抓取文章內容
    console.log('🌐 抓取文章內容...');
    const content = await fetchArticle(url);
    
    if (verbose) {
      console.log(`   內容長度: ${content.length} 字元`);
    }

    // 3. 分析文章
    console.log('🔍 分析文章...');
    const analyzer = new ArticleAnalyzer();
    const analysis = analyzer.analyze(content, url);

    console.log('');
    console.log('📊 分析結果');
    console.log('----------');
    console.log(`📰 標題: ${analysis.title}`);
    console.log(`📁 分類: ${analysis.category}`);
    console.log(`🏷️  標籤: ${analysis.tags.join(', ')}`);
    console.log('');
    console.log(`📌 摘要: ${analysis.summary}`);
    console.log('');
    console.log('🎯 關鍵重點:');
    analysis.keyPoints.forEach((point, i) => {
      console.log(`   ${i + 1}. ${point}`);
    });

    if (analysis.quotes.length > 0) {
      console.log('');
      console.log('💬 重要引用:');
      analysis.quotes.forEach(quote => {
        console.log(`   "${quote.text}" — ${quote.source}`);
      });
    }

    if (analysis.dataPoints.length > 0) {
      console.log('');
      console.log('📊 關鍵數據:');
      analysis.dataPoints.forEach(data => {
        console.log(`   • ${data}`);
      });
    }

    // 4. 知識庫處理
    console.log('');
    console.log('📚 查詢知識庫...');
    const kb = new KnowledgeBase();
    await kb.load();
    
    const relatedArticles = kb.findRelated(analysis.tags, url);
    if (relatedArticles.length > 0) {
      console.log('🔗 相關文章:');
      relatedArticles.forEach(related => {
        console.log(`   • ${related.title}`);
      });
    } else {
      console.log('   （尚無相關文章）');
    }

    // 5. 寫入 Notion
    if (!dryRun) {
      console.log('');
      console.log('📝 寫入 Notion...');
      
      const notion = new NotionClient(
        config.token,
        config.databases.articles.id
      );

      const articleData = {
        ...analysis,
        relatedArticles: relatedArticles.map(r => r.title),
      };

      const page = await notion.createArticlePage(articleData);
      
      console.log(`✅ 成功！`);
      console.log(`🔗 Notion 連結: ${page.url}`);

      // 6. 更新知識庫
      console.log('');
      console.log('📚 更新知識庫...');
      await kb.addArticle({
        ...analysis,
        notionPageId: page.id,
        notionUrl: page.url,
      });
      
      const stats = kb.getStats();
      console.log(`   總收藏: ${stats.totalArticles} 篇`);
    } else {
      console.log('');
      console.log('⚠️  測試模式：未寫入 Notion');
    }

    console.log('');
    console.log('✨ 完成！');

  } catch (error) {
    console.error('');
    console.error('❌ 錯誤:', error.message);
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 匯出供外部使用
module.exports = {
  ArticleAnalyzer,
  NotionClient,
  KnowledgeBase,
  loadConfig,
  fetchArticle,
};

// 如果直接執行
if (require.main === module) {
  main();
}
