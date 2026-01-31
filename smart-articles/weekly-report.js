#!/usr/bin/env node

/**
 * 週報生成腳本
 * 可由 cron 定期執行，或手動執行
 * 
 * 用法：
 *   node weekly-report.js           # 輸出到 console
 *   node weekly-report.js --json    # JSON 格式輸出
 */

const { ReportGenerator } = require('./lib/reporter');
const { KnowledgeBase } = require('./lib/knowledge');

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');

  try {
    const reporter = new ReportGenerator();
    const report = await reporter.generateWeeklyReport();

    if (jsonOutput) {
      const kb = new KnowledgeBase();
      await kb.load();
      
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyArticles = kb.articles.filter(a => {
        const savedAt = new Date(a.savedAt);
        return savedAt >= weekAgo;
      });

      console.log(JSON.stringify({
        period: {
          start: weekAgo.toISOString(),
          end: now.toISOString(),
        },
        stats: {
          newArticles: weeklyArticles.length,
          totalArticles: kb.articles.length,
        },
        articles: weeklyArticles,
        report: report,
      }, null, 2));
    } else {
      console.log(report);
    }
  } catch (error) {
    console.error('生成報告時發生錯誤:', error.message);
    process.exit(1);
  }
}

main();
