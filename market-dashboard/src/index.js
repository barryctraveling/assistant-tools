#!/usr/bin/env node
/**
 * 綜合市場儀表板
 * 整合所有金融追蹤器的統一報告
 */

const path = require('path');

// 載入各個追蹤器
const loadModule = (modulePath) => {
  try {
    return require(path.join(__dirname, '..', '..', modulePath, 'src', 'assistant-integration.js'));
  } catch (e) {
    return null;
  }
};

const investmentMonitor = loadModule('investment-monitor');
const forexTracker = loadModule('forex-tracker');
const cryptoTracker = loadModule('crypto-tracker');
const stablecoinTracker = loadModule('stablecoin-tracker');
const rwaTracker = loadModule('rwa-tracker');

/**
 * 取得完整市場報告
 */
async function getFullReport() {
  const sections = [];
  const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  
  sections.push(`# 📊 綜合市場報告`);
  sections.push(`*更新時間: ${timestamp}*\n`);
  
  // 股票投資
  try {
    if (investmentMonitor) {
      const portfolio = await investmentMonitor.getPortfolio();
      sections.push(`## 💼 投資組合\n`);
      sections.push(portfolio);
    }
  } catch (e) {
    sections.push(`## 💼 投資組合\n⚠️ 無法取得資料\n`);
  }
  
  // 匯率
  try {
    if (forexTracker) {
      const forex = await forexTracker.getForexBrief();
      sections.push(`## 💱 匯率\n`);
      sections.push(forex);
    }
  } catch (e) {
    sections.push(`## 💱 匯率\n⚠️ 無法取得資料\n`);
  }
  
  // 加密貨幣
  try {
    if (cryptoTracker) {
      const crypto = await cryptoTracker.getCryptoBrief();
      sections.push(`## 🪙 加密貨幣\n`);
      sections.push(crypto);
    }
  } catch (e) {
    sections.push(`## 🪙 加密貨幣\n⚠️ 無法取得資料\n`);
  }
  
  // 穩定幣
  try {
    if (stablecoinTracker) {
      const stablecoin = await stablecoinTracker.getStablecoinBrief();
      sections.push(`## 💵 穩定幣\n`);
      sections.push(stablecoin);
    }
  } catch (e) {
    sections.push(`## 💵 穩定幣\n⚠️ 無法取得資料\n`);
  }
  
  // RWA
  try {
    if (rwaTracker) {
      const rwa = rwaTracker.getRWABrief();
      sections.push(`## 🏦 RWA 市場\n`);
      sections.push(rwa);
    }
  } catch (e) {
    sections.push(`## 🏦 RWA 市場\n⚠️ 無法取得資料\n`);
  }
  
  return sections.join('\n');
}

/**
 * 取得精簡市場摘要
 */
async function getQuickSummary() {
  const lines = [];
  const timestamp = new Date().toLocaleString('zh-TW', { 
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  lines.push(`📊 **市場速報** (${timestamp})`);
  lines.push('');
  
  // 股票
  try {
    if (investmentMonitor) {
      const summary = await investmentMonitor.getPortfolioSummary();
      lines.push(`💼 ${summary}`);
    }
  } catch (e) {}
  
  // 匯率
  try {
    if (forexTracker) {
      const usdTwd = await forexTracker.getUsdTwd();
      lines.push(`💱 USD/TWD: ${usdTwd}`);
    }
  } catch (e) {}
  
  // BTC & ETH
  try {
    if (cryptoTracker) {
      const btc = await cryptoTracker.getBtcPrice();
      const eth = await cryptoTracker.getEthPrice();
      lines.push(`₿ BTC: ${btc} | ETH: ${eth}`);
    }
  } catch (e) {}
  
  return lines.join('\n');
}

/**
 * 取得工作相關報告（RWA + 穩定幣重點）
 */
async function getWorkReport() {
  const sections = [];
  const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  
  sections.push(`# 🏢 Fintech 工作報告`);
  sections.push(`*${timestamp}*\n`);
  
  // RWA 詳細報告
  try {
    if (rwaTracker) {
      sections.push(`## 🏦 RWA 市場\n`);
      sections.push(rwaTracker.getRWAOverview());
    }
  } catch (e) {}
  
  // 穩定幣詳細報告
  try {
    if (stablecoinTracker) {
      sections.push(`## 💵 穩定幣\n`);
      const report = await stablecoinTracker.getStablecoinReport();
      sections.push(report);
    }
  } catch (e) {}
  
  return sections.join('\n');
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  switch (command) {
    case 'full':
      console.log(await getFullReport());
      break;
    case 'quick':
    case 'summary':
      console.log(await getQuickSummary());
      break;
    case 'work':
      console.log(await getWorkReport());
      break;
    case 'help':
      console.log(`
綜合市場儀表板

使用方式:
  node src/index.js <command>

指令:
  full      完整市場報告（預設）
  quick     市場速報
  work      工作相關報告（RWA/穩定幣）
  help      顯示說明
      `);
      break;
    default:
      console.log(`未知指令: ${command}`);
      console.log('使用 help 查看可用指令');
  }
}

module.exports = {
  getFullReport,
  getQuickSummary,
  getWorkReport
};

if (require.main === module) {
  main().catch(console.error);
}
