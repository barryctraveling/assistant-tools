#!/usr/bin/env node

/**
 * 故事時間 📚
 * 
 * 為 Tim 設計的故事生成器
 * 可以生成簡短的睡前故事
 */

// 故事元素
const CHARACTERS = [
  { name: '小兔子', emoji: '🐰', trait: '勇敢' },
  { name: '小熊', emoji: '🐻', trait: '善良' },
  { name: '小狐狸', emoji: '🦊', trait: '聰明' },
  { name: '小貓咪', emoji: '🐱', trait: '好奇' },
  { name: '小狗狗', emoji: '🐶', trait: '忠誠' },
  { name: '小松鼠', emoji: '🐿️', trait: '活潑' },
  { name: '小鳥', emoji: '🐦', trait: '自由' },
  { name: '小蜜蜂', emoji: '🐝', trait: '勤勞' },
];

const PLACES = [
  { name: '魔法森林', emoji: '🌲' },
  { name: '彩虹山', emoji: '🌈' },
  { name: '糖果村', emoji: '🍭' },
  { name: '星星湖', emoji: '⭐' },
  { name: '雲朵島', emoji: '☁️' },
  { name: '花花園', emoji: '🌸' },
];

const ITEMS = [
  { name: '魔法種子', emoji: '🌱' },
  { name: '閃亮星星', emoji: '✨' },
  { name: '神奇蘑菇', emoji: '🍄' },
  { name: '金色鑰匙', emoji: '🗝️' },
  { name: '彩虹羽毛', emoji: '🪶' },
  { name: '許願石', emoji: '💎' },
];

const LESSONS = [
  '分享是最快樂的事',
  '勇敢面對困難',
  '朋友之間要互相幫助',
  '說謊是不對的',
  '要相信自己',
  '每個人都有自己的特別之處',
];

/**
 * 隨機選擇
 */
function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 生成故事
 */
function generateStory() {
  const hero = pick(CHARACTERS);
  const friend = pick(CHARACTERS.filter(c => c.name !== hero.name));
  const place = pick(PLACES);
  const item = pick(ITEMS);
  const lesson = pick(LESSONS);

  const story = `
📚 **${hero.name}的冒險** ${hero.emoji}

從前從前，在${place.name} ${place.emoji} 住著一隻${hero.trait}的${hero.name}。

有一天，${hero.name}在散步時遇到了${friend.name} ${friend.emoji}。
${friend.name}看起來很難過，因為牠弄丟了一個重要的東西。

「別擔心！」${hero.name}說，「我來幫你找！」

於是，他們一起出發去尋找。他們翻過小山丘，穿過花叢，最後在一棵大樹下找到了${item.name} ${item.emoji}！

${friend.name}開心極了！「謝謝你，${hero.name}！」

${hero.name}笑著說：「幫助朋友是最快樂的事！」

從那以後，${hero.name}和${friend.name}成為了最好的朋友。

✨ **故事告訴我們**：${lesson}

🌙 晚安，Tim！祝你有個好夢！
`.trim();

  return story;
}

/**
 * 生成簡短故事（適合很累的時候）
 */
function generateShortStory() {
  const hero = pick(CHARACTERS);
  const place = pick(PLACES);

  const story = `
📚 **晚安小故事** ${hero.emoji}

${hero.name}住在${place.name}。
今天，${hero.name}玩了一整天，累了。
${hero.name}找到一個軟軟的草地，躺下來看星星。
星星眨眨眼，說：「晚安，${hero.name}！」
${hero.name}閉上眼睛，做了一個甜甜的夢。

🌙 晚安，Tim！
`.trim();

  return story;
}

/**
 * 生成互動故事開頭（讓大人繼續講）
 */
function generateStoryStart() {
  const hero = pick(CHARACTERS);
  const place = pick(PLACES);
  const item = pick(ITEMS);

  const start = `
📚 **故事開頭** ${hero.emoji}

從前從前，${hero.name}住在${place.name}。
有一天，${hero.name}在路上發現了一個${item.name} ${item.emoji}...

💭 **接下來會發生什麼呢？**
（讓 Tim 來想像，或者爸爸媽媽繼續講！）
`.trim();

  return start;
}

// CLI
function main() {
  const command = process.argv[2] || 'story';

  switch (command) {
    case 'story':
      console.log(generateStory());
      break;

    case 'short':
      console.log(generateShortStory());
      break;

    case 'start':
      console.log(generateStoryStart());
      break;

    case 'help':
    default:
      console.log(`
📚 故事時間

使用: node index.js <command>

指令:
  story   完整故事
  short   簡短故事（累的時候）
  start   故事開頭（互動用）
  help    顯示幫助
`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateStory,
  generateShortStory,
  generateStoryStart,
  CHARACTERS,
  PLACES,
  ITEMS,
  LESSONS,
};
