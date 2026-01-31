#!/usr/bin/env node

/**
 * 投資監控系統 - 主程式
 * 
 * 使用方法:
 *   node src/index.js quote ONDS TSLA
 *   node src/index.js alert add ONDS --above 5 --below 2
 *   node src/index.js portfolio set ONDS 1000 --cost 3.50
 *   node src/index.js daily
 */

const { fetchQuotes, formatQuote } = require('./market/quotes');
const { getAlerts, addAlert, removeAlert, checkAlerts, formatAlertsList, formatTriggeredAlert } = require('./alerts/manager');
const { getPortfolio, setPosition, removePosition, calculatePerformance, formatPortfolioReport } = require('./market/portfolio');
const { generateDailyReport, generateQuickUpdate } = require('./reports/daily');
const { WATCHLIST, formatCurrency } = require('./utils/config');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'quote':
      case 'q':
        await handleQuote(args.slice(1));
        break;

      case 'alert':
      case 'a':
        await handleAlert(args.slice(1));
        break;

      case 'portfolio':
      case 'p':
        await handlePortfolio(args.slice(1));
        break;

      case 'daily':
      case 'd':
        await handleDaily();
        break;

      case 'quick':
        await handleQuick();
        break;

      case 'help':
      case '-h':
      case '--help':
        showHelp();
        break;

      default:
        console.error(`❌ 未知指令: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 錯誤: ${error.message}`);
    process.exit(1);
  }
}

// 報價指令
async function handleQuote(args) {
  const symbols = args.length > 0 ? args.map(s => s.toUpperCase()) : WATCHLIST;
  
  console.log('📊 獲取報價中...\n');
  const quotes = await fetchQuotes(symbols);

  for (const symbol of symbols) {
    console.log(formatQuote(quotes[symbol]));
    console.log();
  }
}

// 警報指令
async function handleAlert(args) {
  const subCommand = args[0];

  switch (subCommand) {
    case 'add': {
      const symbol = args[1];
      if (!symbol) {
        console.error('❌ 請提供股票代碼');
        return;
      }

      const options = parseOptions(args.slice(2));
      const alert = addAlert(symbol, {
        above: options.above ? parseFloat(options.above) : null,
        below: options.below ? parseFloat(options.below) : null,
        note: options.note || '',
      });

      console.log('✅ 警報已新增\n');
      console.log(`股票: ${alert.symbol}`);
      if (alert.above) console.log(`高於: ${formatCurrency(alert.above)}`);
      if (alert.below) console.log(`低於: ${formatCurrency(alert.below)}`);
      console.log(`ID: ${alert.id}`);
      break;
    }

    case 'remove':
    case 'rm': {
      const alertId = args[1];
      if (!alertId) {
        console.error('❌ 請提供警報 ID');
        return;
      }
      
      if (removeAlert(alertId)) {
        console.log('✅ 警報已移除');
      } else {
        console.log('❌ 找不到該警報');
      }
      break;
    }

    case 'list':
    case 'ls': {
      const alerts = getAlerts();
      console.log(formatAlertsList(alerts));
      break;
    }

    case 'check': {
      console.log('🔍 檢查警報中...\n');
      const triggered = await checkAlerts();
      
      if (triggered.length === 0) {
        console.log('✅ 沒有觸發的警報');
      } else {
        for (const item of triggered) {
          console.log(formatTriggeredAlert(item));
        }
      }
      break;
    }

    default:
      console.log('警報指令:');
      console.log('  alert add <SYMBOL> --above <PRICE> --below <PRICE>');
      console.log('  alert remove <ID>');
      console.log('  alert list');
      console.log('  alert check');
  }
}

// 投資組合指令
async function handlePortfolio(args) {
  const subCommand = args[0];

  switch (subCommand) {
    case 'set': {
      const symbol = args[1];
      const shares = args[2] ? parseFloat(args[2]) : null;
      
      if (!symbol || shares == null) {
        console.error('❌ 用法: portfolio set <SYMBOL> <SHARES> --cost <PRICE>');
        return;
      }

      const options = parseOptions(args.slice(3));
      const cost = options.cost ? parseFloat(options.cost) : 0;

      const position = setPosition(symbol, shares, cost, options.note || '');
      
      console.log('✅ 持倉已設定\n');
      console.log(`股票: ${position.symbol}`);
      console.log(`股數: ${position.shares}`);
      console.log(`成本: ${formatCurrency(position.costBasis)}/股`);
      console.log(`總投入: ${formatCurrency(position.totalCost)}`);
      break;
    }

    case 'remove':
    case 'rm': {
      const symbol = args[1];
      if (!symbol) {
        console.error('❌ 請提供股票代碼');
        return;
      }
      
      if (removePosition(symbol)) {
        console.log(`✅ 已移除 ${symbol.toUpperCase()} 持倉`);
      } else {
        console.log('❌ 找不到該持倉');
      }
      break;
    }

    case 'view':
    case 'report':
    default: {
      console.log('📊 計算投資組合績效中...\n');
      const performance = await calculatePerformance();
      console.log(formatPortfolioReport(performance));
      break;
    }
  }
}

// 每日報告
async function handleDaily() {
  const report = await generateDailyReport();
  console.log(report);
}

// 快速更新
async function handleQuick() {
  const update = await generateQuickUpdate();
  console.log(update);
}

// 解析選項
function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      if (value !== true) i++;
    }
  }
  
  return options;
}

// 顯示幫助
function showHelp() {
  console.log(`
📈 投資監控系統

使用方法:
  node src/index.js <command> [options]

指令:
  quote [SYMBOLS...]     獲取股票報價 (預設: ${WATCHLIST.join(', ')})
  
  alert add <SYMBOL>     新增價格警報
    --above <PRICE>      設定上限價格
    --below <PRICE>      設定下限價格
    --note <TEXT>        備註
  alert remove <ID>      移除警報
  alert list             列出所有警報
  alert check            檢查警報觸發

  portfolio set <SYMBOL> <SHARES>  設定持倉
    --cost <PRICE>       成本價（每股）
    --note <TEXT>        備註
  portfolio remove <SYMBOL>        移除持倉
  portfolio view                   查看組合績效

  daily                  生成每日報告
  quick                  快速更新

範例:
  node src/index.js quote ONDS TSLA
  node src/index.js alert add ONDS --above 5.00 --below 2.00
  node src/index.js portfolio set ONDS 1000 --cost 3.50
  node src/index.js daily
  `);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
