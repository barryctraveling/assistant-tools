#!/usr/bin/env node

/**
 * 主題深度報告腳本
 * 
 * 用法：
 *   node topic-report.js RWA
 *   node topic-report.js 穩定幣
 */

const { ReportGenerator } = require('./lib/reporter');

async function main() {
  const tag = process.argv[2];
  
  if (!tag) {
    console.log('用法: node topic-report.js <標籤>');
    console.log('範例: node topic-report.js RWA');
    process.exit(1);
  }

  try {
    const reporter = new ReportGenerator();
    const report = await reporter.generateTopicReport(tag);
    console.log(report);
  } catch (error) {
    console.error('生成報告時發生錯誤:', error.message);
    process.exit(1);
  }
}

main();
