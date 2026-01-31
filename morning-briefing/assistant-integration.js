/**
 * 早晨簡報 - 助手整合
 * 
 * 提供給助手直接調用的高層 API
 */

const { 
  generateFullBriefing, 
  generateQuickBriefing,
  getGreeting,
  getInvestmentSummary,
  getFintechNews,
} = require('./src/index');

const weather = require('./src/weather');
const calendar = require('./src/calendar');

/**
 * 生成完整早晨簡報
 */
async function getMorningBriefing() {
  return await generateFullBriefing();
}

/**
 * 生成快速版簡報
 */
async function getQuickBriefing() {
  return await generateQuickBriefing();
}

/**
 * 獲取天氣資訊
 */
async function getWeather(location = 'Taipei') {
  return await weather.getFormattedWeather(location);
}

/**
 * 獲取單行天氣
 */
async function getWeatherOneLine(location = 'Taipei') {
  return await weather.getWeatherOneLine(location);
}

/**
 * 獲取天氣建議
 */
async function getWeatherAdvice(location = 'Taipei') {
  return await weather.getWeatherAdvice(location);
}

/**
 * 獲取今日行程
 */
async function getTodayEvents() {
  return await calendar.getTodayEvents();
}

/**
 * 獲取行程摘要
 */
async function getCalendarSummary() {
  return await calendar.getCalendarSummary();
}

/**
 * 獲取即將開始的行程提醒
 */
async function getUpcomingReminder() {
  return await calendar.getCalendarReminder();
}

/**
 * 獲取投資摘要
 */
async function getInvestment() {
  return await getInvestmentSummary();
}

/**
 * 獲取 Fintech 新聞
 */
function getNews() {
  return getFintechNews();
}

/**
 * 一站式狀態檢查
 * 用於快速了解所有重要資訊
 */
async function getStatusCheck() {
  const sections = [];
  
  // 問候
  sections.push(getGreeting());
  sections.push('');

  // 天氣（單行版）
  try {
    sections.push('🌤️ ' + await weather.getWeatherOneLine('Taipei'));
  } catch (e) {}

  // 即將開始的行程
  try {
    const reminder = await calendar.getCalendarReminder();
    if (reminder) {
      sections.push('');
      sections.push(reminder);
    }
  } catch (e) {}

  return sections.join('\n');
}

module.exports = {
  // 早晨簡報
  getMorningBriefing,
  getQuickBriefing,
  
  // 天氣
  getWeather,
  getWeatherOneLine,
  getWeatherAdvice,
  
  // 行事曆
  getTodayEvents,
  getCalendarSummary,
  getUpcomingReminder,
  
  // 投資
  getInvestment,
  
  // 新聞
  getNews,
  
  // 快速狀態
  getStatusCheck,
};
