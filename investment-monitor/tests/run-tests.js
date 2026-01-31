/**
 * 投資監控系統測試
 */

const path = require('path');

// 測試計數
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   ${e.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   ${e.message}`);
    failed++;
  }
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

// 測試
async function runTests() {
  console.log('🧪 投資監控系統測試\n');

  // 載入模組
  const config = require('../src/utils/config');
  const { fetchQuotes } = require('../src/market/quotes');
  const { addAlert, getAlerts, removeAlert } = require('../src/alerts/manager');
  const { setPosition, getPortfolio, removePosition, calculatePerformance } = require('../src/market/portfolio');

  // 配置測試
  test('config - WATCHLIST 存在', () => {
    assert(config.WATCHLIST.length > 0);
  });

  test('config - formatCurrency 正確', () => {
    assert(config.formatCurrency(100) === '$100.00');
  });

  test('config - formatPercent 正確（正數）', () => {
    const result = config.formatPercent(5.5);
    assert(result === '+5.50%', `Got: ${result}`);
  });

  test('config - formatPercent 正確（負數）', () => {
    const result = config.formatPercent(-3.2);
    assert(result === '-3.20%', `Got: ${result}`);
  });

  // 報價測試
  await asyncTest('quotes - 可以獲取 AAPL 報價', async () => {
    const quotes = await fetchQuotes(['AAPL']);
    assert(quotes.AAPL, 'No AAPL quote');
    assert(quotes.AAPL.price > 0 || quotes.AAPL.error, 'Invalid price');
  });

  // 警報測試
  test('alerts - 可以新增警報', () => {
    const alert = addAlert('TEST', { above: 100, below: 50, note: 'test' });
    assert(alert.id, 'No alert ID');
    assert(alert.symbol === 'TEST');
    assert(alert.above === 100);
    assert(alert.below === 50);
  });

  test('alerts - 可以列出警報', () => {
    const alerts = getAlerts();
    assert(Array.isArray(alerts));
    assert(alerts.length > 0);
  });

  test('alerts - 可以移除警報', () => {
    const alerts = getAlerts();
    const testAlert = alerts.find(a => a.symbol === 'TEST');
    if (testAlert) {
      const result = removeAlert(testAlert.id);
      assert(result === true);
    }
  });

  // 組合測試
  test('portfolio - 可以設定持倉', () => {
    const pos = setPosition('TEST', 100, 10, 'test position');
    assert(pos.symbol === 'TEST');
    assert(pos.shares === 100);
    assert(pos.costBasis === 10);
    assert(pos.totalCost === 1000);
  });

  test('portfolio - 可以讀取組合', () => {
    const portfolio = getPortfolio();
    assert(portfolio.positions);
    assert(portfolio.positions.TEST);
  });

  await asyncTest('portfolio - 可以計算績效', async () => {
    const perf = await calculatePerformance();
    assert(perf.positions);
    assert(typeof perf.totalCost === 'number');
  });

  test('portfolio - 可以移除持倉', () => {
    const result = removePosition('TEST');
    assert(result === true);
  });

  // 報告
  console.log(`\n📊 結果: ${passed} 通過, ${failed} 失敗`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
