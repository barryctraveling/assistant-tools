/**
 * 天氣模組
 * 使用 wttr.in 獲取天氣資訊
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// 台北座標
const TAIPEI = {
  name: 'Taipei',
  lat: 25.0330,
  lon: 121.5654,
};

/**
 * 獲取簡短天氣
 * @param {string} location - 地點名稱（預設 Taipei）
 */
async function getWeatherShort(location = 'Taipei') {
  try {
    const { stdout } = await execAsync(
      `curl -s "wttr.in/${encodeURIComponent(location)}?format=%l:+%c+%t+%h+%w&m"`,
      { timeout: 10000 }
    );
    return stdout.trim();
  } catch (e) {
    return `天氣資訊暫時無法獲取: ${e.message}`;
  }
}

/**
 * 獲取詳細天氣預報
 */
async function getWeatherForecast(location = 'Taipei') {
  try {
    // 使用緊湊格式
    const { stdout } = await execAsync(
      `curl -s "wttr.in/${encodeURIComponent(location)}?1&T&m"`,
      { timeout: 15000 }
    );
    return stdout;
  } catch (e) {
    return `天氣預報暫時無法獲取: ${e.message}`;
  }
}

/**
 * 獲取格式化的天氣資訊（適合 Telegram）
 */
async function getFormattedWeather(location = 'Taipei') {
  try {
    // 獲取詳細資訊
    const { stdout } = await execAsync(
      `curl -s "wttr.in/${encodeURIComponent(location)}?format=%l\\n🌡️+溫度:+%t\\n💧+濕度:+%h\\n🌬️+風速:+%w\\n☁️+天氣:+%C&m"`,
      { timeout: 10000 }
    );
    return stdout.trim();
  } catch (e) {
    return `天氣資訊暫時無法獲取`;
  }
}

/**
 * 獲取單行天氣摘要
 */
async function getWeatherOneLine(location = 'Taipei') {
  try {
    const { stdout } = await execAsync(
      `curl -s "wttr.in/${encodeURIComponent(location)}?format=3&m"`,
      { timeout: 10000 }
    );
    return stdout.trim();
  } catch (e) {
    return '天氣: 暫時無法獲取';
  }
}

/**
 * 判斷是否需要帶傘
 */
async function needUmbrella(location = 'Taipei') {
  try {
    const { stdout } = await execAsync(
      `curl -s "wttr.in/${encodeURIComponent(location)}?format=%p&m"`,
      { timeout: 10000 }
    );
    
    const precipitation = parseFloat(stdout) || 0;
    
    if (precipitation > 5) {
      return { need: true, message: '☔ 今天可能下雨，記得帶傘！' };
    } else if (precipitation > 0) {
      return { need: false, message: '🌂 有些許降雨機會，可以帶把傘以防萬一' };
    } else {
      return { need: false, message: '☀️ 今天應該不會下雨' };
    }
  } catch (e) {
    return { need: null, message: '無法判斷是否需要帶傘' };
  }
}

/**
 * 生成天氣建議
 */
async function getWeatherAdvice(location = 'Taipei') {
  try {
    const { stdout } = await execAsync(
      `curl -s "wttr.in/${encodeURIComponent(location)}?format=%t,%h,%w,%C&m"`,
      { timeout: 10000 }
    );
    
    const parts = stdout.split(',').map(s => s.trim());
    const temp = parseInt(parts[0]) || 25;
    const humidity = parseInt(parts[1]) || 70;
    const condition = (parts[3] || '').toLowerCase();

    const advice = [];

    // 溫度建議
    if (temp < 15) {
      advice.push('🧥 天氣偏涼，記得穿外套');
    } else if (temp > 30) {
      advice.push('🥵 天氣炎熱，注意防曬補水');
    }

    // 濕度建議
    if (humidity > 80) {
      advice.push('💧 濕度很高，可能會悶熱');
    }

    // 天氣狀況建議
    if (condition.includes('rain') || condition.includes('shower')) {
      advice.push('☔ 可能下雨，記得帶傘');
    }

    return advice.length > 0 ? advice.join('\n') : '🌤️ 天氣舒適，適合外出';
  } catch (e) {
    return '';
  }
}

module.exports = {
  getWeatherShort,
  getWeatherForecast,
  getFormattedWeather,
  getWeatherOneLine,
  needUmbrella,
  getWeatherAdvice,
};
