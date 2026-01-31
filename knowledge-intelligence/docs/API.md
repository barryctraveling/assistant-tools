# API 文檔

## 主程式 CLI

```bash
# 語意搜尋
node src/index.js search <query>

# 知識問答
node src/index.js ask <question>

# 趨勢分析
node src/index.js analyze [tag]

# 查看關聯
node src/index.js connections [article_id]

# 生成報告
node src/index.js report

# 統計資訊
node src/index.js stats
```

## 程式化 API

### 初始化

```javascript
const { 
  loadKnowledgeBase,
  SemanticSearch,
  TrendAnalyzer,
  ConnectionDiscovery,
  InsightGenerator,
  QAEngine,
} = require('./src/index');

// 載入知識庫
const articles = await loadKnowledgeBase();
```

### SemanticSearch - 語意搜尋

```javascript
const search = new SemanticSearch();

// 索引文章
search.indexArticles(articles);

// 搜尋
const results = search.search('RWA 代幣化', {
  topK: 5,           // 返回數量
  minScore: 0.1,     // 最低相關度
  includeSnippets: true,  // 包含片段
});

// 找相似文章
const similar = search.findSimilar(articleId, 5);

// 按主題分群
const clusters = search.clusterByTopic();

// 統計
const stats = search.getStats();
```

### TrendAnalyzer - 趨勢分析

```javascript
const trends = new TrendAnalyzer(articles);

// 分析特定主題趨勢
const trend = trends.analyzeTrend('RWA');
// 返回: { tag, articleCount, trend, trendDescription, ... }

// 熱門主題
const hot = trends.findHotTopics(30);  // 30天內

// 新興主題
const emerging = trends.findEmergingTopics();

// 建立時間軸
const timeline = trends.buildTimeline('穩定幣');

// 生成報告
const report = trends.generateReport();
```

### ConnectionDiscovery - 關聯發現

```javascript
const connections = new ConnectionDiscovery();
connections.setArticles(articles);

// 計算兩篇文章的關聯
const relation = connections.calculateRelation(article1, article2);
// 返回: { tagOverlap, topicSimilarity, totalScore, types, ... }

// 建立關聯圖譜
connections.buildConnectionGraph(0.15);  // 最低分數閾值

// 找出文章的關聯
const related = connections.findConnections(articleId, 5);

// 找出共同主題
const themes = connections.findCommonThemes();

// 找出知識群組
const clusters = connections.findClusters();

// 為新文章找關聯
const newConnections = connections.findConnectionsForNewArticle(newArticle);
```

### InsightGenerator - 洞見生成

```javascript
const insights = new InsightGenerator();
insights.setArticles(articles);

// 主題洞見
const topicInsights = insights.generateTopicInsights('RWA');
// 返回: { tag, articleCount, mainPoints, coreKeywords, relatedTopics, ... }

// 跨文章洞見
const crossInsights = insights.generateCrossArticleInsights();
// 返回: { knowledgeClusters, coreThemes, trends, narrativeInsights, ... }

// 週度洞見
const weekly = insights.generateWeeklyInsights();

// 完整報告
const report = insights.generateFullReport();
```

### QAEngine - 問答引擎

```javascript
const qa = new QAEngine();
qa.loadArticles(articles);

// 回答問題
const answer = qa.answer('RWA 的主要挑戰是什麼？');
// 返回: { status, question, questionType, answer, keyPoints, sources, ... }

// 分析問題類型
const type = qa.analyzeQuestion('什麼是穩定幣？');
// 返回: 'definition' | 'listing' | 'reason' | 'summary' | 'trend' | 'general'

// 互動式問答（支援上下文）
const interactive = qa.interactiveQA(question, { previousTopic: 'RWA' });
```

## 回傳格式

### 搜尋結果

```javascript
{
  id: 'article_id',
  score: 0.75,        // 0-1 相關度
  title: '文章標題',
  category: '分類',
  tags: ['tag1', 'tag2'],
  snippets: ['相關片段1', '相關片段2'],
  summary: '摘要',
  keyPoints: ['觀點1', '觀點2'],
}
```

### 趨勢分析結果

```javascript
{
  tag: 'RWA',
  articleCount: 5,
  trend: 'rising',              // rising | stable | declining | new | no_data
  trendDescription: '關注度上升 📈',
  recentCount: 3,               // 近30天
  olderCount: 2,                // 30-60天前
  firstMention: '2026-01-01',
  lastMention: '2026-01-30',
  timeline: [...],
  keyPointsEvolution: [...],
}
```

### 問答結果

```javascript
{
  status: 'answered',           // answered | no_relevant_info
  question: '原始問題',
  questionType: 'definition',
  answer: '生成的答案',
  keyPoints: ['觀點1', '觀點2'],
  items: [...],                 // listing 類型
  reasons: [...],               // reason 類型
  sources: [
    { title: '來源文章', relevance: 80, url: '...' }
  ],
  suggestedFollowups: ['建議追問1', '建議追問2'],
}
```

## 錯誤處理

所有 API 在失敗時會拋出標準 Error，建議使用 try-catch：

```javascript
try {
  const results = search.search(query);
} catch (error) {
  console.error('搜尋失敗:', error.message);
}
```
