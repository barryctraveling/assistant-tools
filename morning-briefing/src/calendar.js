/**
 * 行事曆模組
 * 使用 gog CLI 讀取 Google Calendar
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * 獲取今天和明天的事件
 */
async function getTodayEvents() {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const fromDate = today.toISOString().split('T')[0] + 'T00:00:00+08:00';
    const toDate = tomorrow.toISOString().split('T')[0] + 'T23:59:59+08:00';

    const { stdout } = await execAsync(
      `gog calendar events primary --from "${fromDate}" --to "${toDate}" --json`,
      { timeout: 15000 }
    );

    const data = JSON.parse(stdout);
    return data.events || [];
  } catch (e) {
    console.error('Calendar error:', e.message);
    return [];
  }
}

/**
 * 獲取本週事件
 */
async function getWeekEvents() {
  try {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const fromDate = today.toISOString().split('T')[0] + 'T00:00:00+08:00';
    const toDate = endOfWeek.toISOString().split('T')[0] + 'T23:59:59+08:00';

    const { stdout } = await execAsync(
      `gog calendar events primary --from "${fromDate}" --to "${toDate}" --json`,
      { timeout: 15000 }
    );

    const data = JSON.parse(stdout);
    return data.events || [];
  } catch (e) {
    return [];
  }
}

/**
 * 格式化事件列表
 */
function formatEvents(events) {
  if (!events || events.length === 0) {
    return '📭 今日沒有行程';
  }

  let output = '';

  for (const event of events) {
    const summary = event.summary || '（無標題）';
    const startTime = formatEventTime(event.start);
    const endTime = formatEventTime(event.end);

    output += `• ${startTime} - ${endTime}\n`;
    output += `  **${summary}**\n`;

    if (event.location) {
      output += `  📍 ${event.location}\n`;
    }

    output += '\n';
  }

  return output.trim();
}

/**
 * 格式化事件時間
 */
function formatEventTime(timeObj) {
  if (!timeObj) return '??:??';

  // 全天事件
  if (timeObj.date) {
    return '全天';
  }

  // 有具體時間
  if (timeObj.dateTime) {
    const date = new Date(timeObj.dateTime);
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return '??:??';
}

/**
 * 獲取即將開始的事件（2小時內）
 */
async function getUpcomingEvents(withinHours = 2) {
  const events = await getTodayEvents();
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  return events.filter(event => {
    if (!event.start?.dateTime) return false;
    const startTime = new Date(event.start.dateTime);
    return startTime > now && startTime <= cutoff;
  });
}

/**
 * 生成行程提醒
 */
async function getCalendarReminder() {
  const upcoming = await getUpcomingEvents(2);

  if (upcoming.length === 0) {
    return null;
  }

  const event = upcoming[0];
  const startTime = new Date(event.start.dateTime);
  const minutesUntil = Math.round((startTime - new Date()) / 60000);

  return `⏰ **即將開始**: ${event.summary}\n` +
         `   ${minutesUntil} 分鐘後 (${formatEventTime(event.start)})`;
}

/**
 * 獲取行事曆摘要（用於早晨簡報）
 */
async function getCalendarSummary() {
  const events = await getTodayEvents();

  if (events.length === 0) {
    return '📭 今日沒有行程安排';
  }

  let summary = `📅 今日有 ${events.length} 個行程：\n\n`;
  summary += formatEvents(events.slice(0, 5)); // 最多顯示 5 個

  if (events.length > 5) {
    summary += `\n_還有 ${events.length - 5} 個行程..._`;
  }

  return summary;
}

module.exports = {
  getTodayEvents,
  getWeekEvents,
  formatEvents,
  getUpcomingEvents,
  getCalendarReminder,
  getCalendarSummary,
};
