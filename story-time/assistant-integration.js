/**
 * 故事時間 - 助手整合
 */

const {
  generateStory,
  generateShortStory,
  generateStoryStart,
  CHARACTERS,
  PLACES,
  LESSONS,
} = require('./index');

/**
 * 生成完整睡前故事
 */
function tellStory() {
  return generateStory();
}

/**
 * 生成簡短故事（很累的時候）
 */
function tellShortStory() {
  return generateShortStory();
}

/**
 * 生成故事開頭（互動用）
 */
function startStory() {
  return generateStoryStart();
}

/**
 * 獲取角色列表
 */
function getCharacters() {
  return CHARACTERS.map(c => `${c.emoji} ${c.name} - ${c.trait}`).join('\n');
}

/**
 * 獲取場景列表
 */
function getPlaces() {
  return PLACES.map(p => `${p.emoji} ${p.name}`).join('\n');
}

/**
 * 為 Tim 生成晚安訊息
 */
function goodNightTim() {
  const messages = [
    '🌙 晚安，Tim！做個好夢！',
    '⭐ 晚安，小寶貝！星星在看著你！',
    '🌟 晚安，Tim！明天又是美好的一天！',
    '🌙 睡覺時間到了，Tim！夢裡見！',
    '💤 晚安，Tim！讓小兔子陪你進入夢鄉！',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = {
  tellStory,
  tellShortStory,
  startStory,
  getCharacters,
  getPlaces,
  goodNightTim,
  CHARACTERS,
  PLACES,
  LESSONS,
};
