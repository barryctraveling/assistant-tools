#!/usr/bin/env node

/**
 * 家庭紀念日檢查腳本
 * 檢查即將到來的生日和紀念日
 * 
 * 用法：
 *   node check-dates.js           # 檢查接下來 30 天
 *   node check-dates.js --days 7  # 檢查接下來 7 天
 *   node check-dates.js --json    # JSON 格式輸出
 */

const fs = require('fs').promises;
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'family-calendar.json');

async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('無法載入配置:', error.message);
    process.exit(1);
  }
}

function getDaysUntil(month, day) {
  const now = new Date();
  const thisYear = now.getFullYear();
  
  let eventDate = new Date(thisYear, month - 1, day);
  
  // 如果日期已過，計算明年的
  if (eventDate < now) {
    eventDate = new Date(thisYear + 1, month - 1, day);
  }
  
  const diffTime = eventDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    date: eventDate,
    daysUntil: diffDays,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
  };
}

function calculateAge(birthYear) {
  const now = new Date();
  return now.getFullYear() - birthYear;
}

async function checkDates(lookAheadDays = 30) {
  const config = await loadConfig();
  const upcoming = [];
  const missing = [];
  
  // 檢查生日
  for (const [id, person] of Object.entries(config.family)) {
    const { name, birthday, notes } = person;
    
    if (!birthday.day) {
      missing.push({ type: 'birthday', name, month: birthday.month });
      continue;
    }
    
    const info = getDaysUntil(birthday.month, birthday.day);
    
    if (info.daysUntil <= lookAheadDays) {
      const age = calculateAge(birthday.year);
      upcoming.push({
        type: 'birthday',
        name,
        date: info.date.toISOString().split('T')[0],
        daysUntil: info.daysUntil,
        isToday: info.isToday,
        isTomorrow: info.isTomorrow,
        age: age + (info.date.getFullYear() > new Date().getFullYear() ? 1 : 0),
        notes,
      });
    }
  }
  
  // 檢查紀念日
  for (const [id, anniversary] of Object.entries(config.anniversaries)) {
    const { month, day, year, description } = anniversary;
    
    if (!day) {
      missing.push({ type: 'anniversary', description, month });
      continue;
    }
    
    const info = getDaysUntil(month, day);
    
    if (info.daysUntil <= lookAheadDays) {
      const years = year ? new Date().getFullYear() - year : null;
      upcoming.push({
        type: 'anniversary',
        description,
        date: info.date.toISOString().split('T')[0],
        daysUntil: info.daysUntil,
        isToday: info.isToday,
        isTomorrow: info.isTomorrow,
        years: years ? years + (info.date.getFullYear() > new Date().getFullYear() ? 1 : 0) : null,
      });
    }
  }
  
  // 按日期排序
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  
  return { upcoming, missing };
}

function formatReminder(item) {
  let when = '';
  if (item.isToday) {
    when = '就是今天';
  } else if (item.isTomorrow) {
    when = '是明天';
  } else if (item.daysUntil <= 7) {
    when = `還有 ${item.daysUntil} 天`;
  } else {
    when = `${item.date}（${item.daysUntil} 天後）`;
  }
  
  if (item.type === 'birthday') {
    const ageStr = item.age ? `（將滿 ${item.age} 歲）` : '';
    return `🎂 ${item.name} 的生日${when}${ageStr}`;
  } else {
    const yearsStr = item.years ? `（第 ${item.years} 年）` : '';
    return `💕 ${item.description}${when}${yearsStr}`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  
  let lookAheadDays = 30;
  const daysIndex = args.indexOf('--days');
  if (daysIndex !== -1 && args[daysIndex + 1]) {
    lookAheadDays = parseInt(args[daysIndex + 1], 10) || 30;
  }
  
  const { upcoming, missing } = await checkDates(lookAheadDays);
  
  if (jsonOutput) {
    console.log(JSON.stringify({ upcoming, missing }, null, 2));
    return;
  }
  
  console.log(`📅 家庭紀念日檢查（接下來 ${lookAheadDays} 天）`);
  console.log('='.repeat(40));
  console.log('');
  
  if (missing.length > 0) {
    console.log('⚠️  缺少日期資訊：');
    missing.forEach(m => {
      if (m.type === 'birthday') {
        console.log(`   - ${m.name} 的生日（${m.month} 月幾號？）`);
      } else {
        console.log(`   - ${m.description}（幾月幾號？）`);
      }
    });
    console.log('');
  }
  
  if (upcoming.length === 0) {
    console.log('✅ 接下來沒有即將到來的紀念日');
  } else {
    console.log('📆 即將到來：');
    upcoming.forEach(item => {
      const emoji = item.isToday ? '🎉' : item.isTomorrow ? '⏰' : '📌';
      console.log(`${emoji} ${formatReminder(item)}`);
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkDates, formatReminder };
