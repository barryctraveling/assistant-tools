# 每日早晨簡報 ☀️

整合多個資訊來源，生成完整的早晨報告。

## 包含內容

1. **今日天氣** - 台北天氣預報
2. **投資概覽** - ONDS、TSLA 股價和組合績效
3. **Fintech 新聞** - RWA、穩定幣相關新聞
4. **今日行程** - Apple Calendar 行程（如可用）
5. **提醒事項** - 重要提醒

## 使用

```bash
# 生成完整簡報
node src/index.js full

# 快速版
node src/index.js quick

# 只看特定部分
node src/index.js weather
node src/index.js market
node src/index.js news
```

## 助手整合

```javascript
const briefing = require('./assistant-integration');
const report = await briefing.generateMorningBriefing();
```

## 排程建議

- 平日 07:30 發送
- 週末 09:00 發送
