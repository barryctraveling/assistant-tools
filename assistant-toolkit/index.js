/**
 * 助手工具箱
 * 
 * 統一入口，整合所有專案的功能
 * 讓助手可以方便地調用各種工具
 */

const path = require('path');

// 專案路徑
const PROJECTS_DIR = path.join(__dirname, '..');

/**
 * 載入專案模組
 */
function loadProject(name) {
  try {
    const projectPath = path.join(PROJECTS_DIR, name);
    // 優先載入 assistant-integration.js
    try {
      return require(path.join(projectPath, 'assistant-integration'));
    } catch (e) {
      // 回退到 src/index.js
      return require(path.join(projectPath, 'src/index'));
    }
  } catch (e) {
    console.error(`Failed to load project ${name}:`, e.message);
    return null;
  }
}

// 載入各專案
const investment = loadProject('investment-monitor');
const fintech = loadProject('fintech-news');
const briefing = loadProject('morning-briefing');
const stablecoin = loadProject('stablecoin-tracker');
const rwa = loadProject('rwa-tracker');
const forex = loadProject('forex-tracker');
const crypto = loadProject('crypto-tracker');
const marketDashboard = loadProject('market-dashboard');
const memorySearch = loadProject('memory-search');

/**
 * ======================
 * 記憶搜尋
 * ======================
 */

/**
 * 搜尋記憶
 * @param {string} query - 搜尋查詢
 * @param {number} limit - 結果數量（預設 5）
 */
async function searchMemory(query, limit = 5) {
  if (!memorySearch) return { error: 'Memory search module not loaded' };
  return memorySearch.searchMemory(query, limit);
}

/**
 * 搜尋記憶（簡報格式）
 */
async function searchMemoryBrief(query, limit = 3) {
  if (!memorySearch) return '記憶搜尋模組未載入';
  return memorySearch.searchMemoryBrief(query, limit);
}

/**
 * 重建記憶索引
 */
async function rebuildMemoryIndex() {
  if (!memorySearch) return { error: 'Memory search module not loaded' };
  return memorySearch.rebuildIndex();
}

/**
 * 獲取記憶索引統計
 */
async function getMemoryStats() {
  if (!memorySearch) return { error: 'Memory search module not loaded' };
  return memorySearch.getStats();
}

/**
 * ======================
 * 投資相關
 * ======================
 */

/**
 * 獲取股票報價
 * @param {string[]} symbols - 股票代碼（預設 ONDS, TSLA）
 */
async function getStockQuotes(symbols) {
  if (!investment) return '投資監控模組未載入';
  return await investment.getQuickQuote(symbols);
}

/**
 * 獲取投資組合績效
 */
async function getPortfolio() {
  if (!investment) return '投資監控模組未載入';
  return await investment.getPortfolioFull();
}

/**
 * 獲取投資組合摘要
 */
async function getPortfolioSummary() {
  if (!investment) return '投資監控模組未載入';
  return await investment.getPortfolioSummary();
}

/**
 * 設定股票持倉
 */
function setHolding(symbol, shares, cost) {
  if (!investment) return '投資監控模組未載入';
  return investment.setHolding(symbol, shares, cost);
}

/**
 * 設定價格警報
 */
function setPriceAlert(symbol, above, below) {
  if (!investment) return '投資監控模組未載入';
  return investment.setAlert(symbol, above, below);
}

/**
 * 檢查價格警報
 */
async function checkAlerts() {
  if (!investment) return null;
  return await investment.checkAndReportAlerts();
}

/**
 * ======================
 * Fintech 新聞相關
 * ======================
 */

/**
 * 獲取 Fintech 新聞主題列表
 */
function getNewsTopics() {
  if (!fintech) return [];
  return fintech.getTopics();
}

/**
 * 獲取新聞快訊
 */
function getNewsQuick() {
  if (!fintech) return '新聞模組未載入';
  return fintech.getQuickUpdate();
}

/**
 * 處理搜尋結果
 */
function processNewsResults(results, topic) {
  if (!fintech) return [];
  return fintech.processSearchResults(results, topic);
}

/**
 * 快取新聞
 */
function cacheNews(items) {
  if (!fintech) return 0;
  return fintech.cacheNews(items);
}

/**
 * ======================
 * 早晨簡報相關
 * ======================
 */

/**
 * 獲取完整早晨簡報
 */
async function getMorningBriefing() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getMorningBriefing();
}

/**
 * 獲取快速簡報
 */
async function getQuickBriefing() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getQuickBriefing();
}

/**
 * 獲取天氣
 */
async function getWeather(location = 'Taipei') {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getWeather(location);
}

/**
 * 獲取今日行程
 */
async function getTodayCalendar() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getCalendarSummary();
}

/**
 * 獲取狀態檢查
 */
async function getStatusCheck() {
  if (!briefing) return '簡報模組未載入';
  return await briefing.getStatusCheck();
}

/**
 * ======================
 * 穩定幣相關
 * ======================
 */

/**
 * 獲取穩定幣市場報告
 */
async function getStablecoinReport() {
  if (!stablecoin) return '穩定幣模組未載入';
  return await stablecoin.getStablecoinReport();
}

/**
 * 獲取穩定幣簡短摘要
 */
async function getStablecoinBrief() {
  if (!stablecoin) return '穩定幣模組未載入';
  return await stablecoin.getStablecoinBrief();
}

/**
 * 檢查穩定幣脫鉤
 */
async function checkStablecoinDepeg() {
  if (!stablecoin) return null;
  return await stablecoin.checkDepeg();
}

/**
 * ======================
 * RWA 相關
 * ======================
 */

/**
 * 獲取 RWA 市場概覽
 */
function getRWAOverview() {
  if (!rwa) return 'RWA 模組未載入';
  return rwa.getRWAOverview();
}

/**
 * 獲取 RWA 簡短摘要
 */
function getRWABrief() {
  if (!rwa) return 'RWA 模組未載入';
  return rwa.getRWABrief();
}

/**
 * 獲取 RWA 工作簡報
 */
function getRWAWorkBrief() {
  if (!rwa) return 'RWA 模組未載入';
  return rwa.getWorkBrief();
}

/**
 * 獲取代幣化國債報告
 */
function getTreasuriesReport() {
  if (!rwa) return 'RWA 模組未載入';
  return rwa.getTreasuriesReport();
}

/**
 * ======================
 * 匯率相關
 * ======================
 */

/**
 * 獲取匯率報告
 */
async function getForexReport() {
  if (!forex) return '匯率模組未載入';
  return await forex.getForexReport();
}

/**
 * 獲取匯率簡報
 */
async function getForexBrief() {
  if (!forex) return '匯率模組未載入';
  return await forex.getForexBrief();
}

/**
 * 貨幣換算
 */
async function convertCurrency(amount, from, to) {
  if (!forex) return null;
  return await forex.convert(amount, from, to);
}

/**
 * 獲取 USD/TWD 匯率
 */
async function getUsdTwdRate() {
  if (!forex) return null;
  return await forex.getUsdTwd();
}

/**
 * 美元換台幣
 */
async function usdToTwd(amount) {
  if (!forex) return null;
  return await forex.usdToTwd(amount);
}

/**
 * 台幣換美元
 */
async function twdToUsd(amount) {
  if (!forex) return null;
  return await forex.twdToUsd(amount);
}

/**
 * ======================
 * 加密貨幣相關
 * ======================
 */

/**
 * 獲取加密貨幣快訊
 */
async function getCryptoBrief() {
  if (!crypto) return '加密貨幣模組未載入';
  return await crypto.getCryptoBrief();
}

/**
 * 獲取加密貨幣完整報告
 */
async function getCryptoReport() {
  if (!crypto) return '加密貨幣模組未載入';
  return await crypto.getCryptoReport();
}

/**
 * 獲取特定幣種價格
 */
async function getCoinPrice(symbol) {
  if (!crypto) return '加密貨幣模組未載入';
  return await crypto.getCoinPrice(symbol);
}

/**
 * 獲取 BTC 價格
 */
async function getBtcPrice() {
  if (!crypto) return '加密貨幣模組未載入';
  return await crypto.getBtcPrice();
}

/**
 * 獲取 ETH 價格
 */
async function getEthPrice() {
  if (!crypto) return '加密貨幣模組未載入';
  return await crypto.getEthPrice();
}

/**
 * ======================
 * 市場儀表板相關
 * ======================
 */

/**
 * 獲取綜合市場報告
 */
async function getMarketReport() {
  if (!marketDashboard) return '市場儀表板模組未載入';
  return await marketDashboard.getFullReport();
}

/**
 * 獲取市場速報
 */
async function getMarketBrief() {
  if (!marketDashboard) return '市場儀表板模組未載入';
  return await marketDashboard.getQuickSummary();
}

/**
 * 獲取 Fintech 工作報告
 */
async function getFintechWorkReport() {
  if (!marketDashboard) return '市場儀表板模組未載入';
  return await marketDashboard.getWorkReport();
}

/**
 * ======================
 * 綜合功能
 * ======================
 */

/**
 * 每日摘要（所有重要資訊）
 */
async function getDailySummary() {
  const sections = [];

  // 早晨簡報
  if (briefing) {
    sections.push(await briefing.getMorningBriefing());
  } else {
    // 備用方案
    if (investment) {
      sections.push('💼 **投資**');
      sections.push(await investment.getQuickQuote());
    }
  }

  return sections.join('\n\n');
}

/**
 * 工具箱狀態
 */
function getToolkitStatus() {
  return {
    investment: !!investment,
    fintech: !!fintech,
    briefing: !!briefing,
    stablecoin: !!stablecoin,
    rwa: !!rwa,
    forex: !!forex,
    crypto: !!crypto,
    marketDashboard: !!marketDashboard,
    loaded: [
      investment && 'investment',
      fintech && 'fintech',
      briefing && 'briefing',
      stablecoin && 'stablecoin',
      rwa && 'rwa',
      forex && 'forex',
      crypto && 'crypto',
      marketDashboard && 'marketDashboard',
    ].filter(Boolean),
  };
}

module.exports = {
  // 投資
  getStockQuotes,
  getPortfolio,
  getPortfolioSummary,
  setHolding,
  setPriceAlert,
  checkAlerts,

  // 新聞
  getNewsTopics,
  getNewsQuick,
  processNewsResults,
  cacheNews,

  // 簡報
  getMorningBriefing,
  getQuickBriefing,
  getWeather,
  getTodayCalendar,
  getStatusCheck,

  // 穩定幣
  getStablecoinReport,
  getStablecoinBrief,
  checkStablecoinDepeg,

  // RWA
  getRWAOverview,
  getRWABrief,
  getRWAWorkBrief,
  getTreasuriesReport,

  // 匯率
  getForexReport,
  getForexBrief,
  convertCurrency,
  getUsdTwdRate,
  usdToTwd,
  twdToUsd,

  // 加密貨幣
  getCryptoBrief,
  getCryptoReport,
  getCoinPrice,
  getBtcPrice,
  getEthPrice,

  // 市場儀表板
  getMarketReport,
  getMarketBrief,
  getFintechWorkReport,

  // 記憶搜尋
  searchMemory,
  searchMemoryBrief,
  rebuildMemoryIndex,
  getMemoryStats,

  // 綜合
  getDailySummary,
  getToolkitStatus,
};
