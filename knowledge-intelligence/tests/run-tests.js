#!/usr/bin/env node

/**
 * 知識智能系統 - 測試套件
 */

const path = require('path');
const { 
  loadKnowledgeBase, 
  SemanticSearch,
  TrendAnalyzer,
  ConnectionDiscovery,
  InsightGenerator,
  QAEngine,
} = require('../src/index');

// 測試結果
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   錯誤: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} 預期 "${expected}", 得到 "${actual}"`);
  }
}

function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(message || '條件不成立');
  }
}

// 測試資料
const testArticles = [
  {
    id: 'test-1',
    title: 'RWA 代幣化的挑戰與機會',
    content: 'RWA（真實世界資產）代幣化正在快速發展...',
    summary: 'RWA 代幣化的問題不在發行，而在可用性。',
    keyPoints: ['RWA 需要解決可用性問題', '贖回機制是關鍵'],
    tags: ['RWA', '代幣化', 'DeFi'],
    category: '🏦 金融科技/區塊鏈',
    savedAt: '2026-01-30T10:00:00.000Z',
  },
  {
    id: 'test-2',
    title: '穩定幣的未來發展',
    content: '穩定幣在加密市場中扮演重要角色...',
    summary: '穩定幣成功的關鍵是定價、結算和可組合性。',
    keyPoints: ['穩定幣解決了結算問題', '可組合性是優勢'],
    tags: ['穩定幣', 'DeFi', '加密貨幣'],
    category: '🏦 金融科技/區塊鏈',
    savedAt: '2026-01-29T10:00:00.000Z',
  },
  {
    id: 'test-3',
    title: 'AI 對金融業的影響',
    content: '人工智慧正在改變金融服務...',
    summary: 'AI 將重塑金融業的各個層面。',
    keyPoints: ['AI 自動化交易', 'AI 風險評估'],
    tags: ['AI', '金融科技', '自動化'],
    category: '🤖 AI 科技',
    savedAt: '2026-01-28T10:00:00.000Z',
  },
];

async function runTests() {
  console.log('🧪 知識智能系統 - 測試套件\n');
  console.log('='.repeat(50) + '\n');

  // 測試文字處理
  console.log('📝 文字處理測試\n');
  
  const { tokenize, preprocess, cosineSimilarity } = require('../src/utils/text');
  
  test('tokenize 應正確處理中英文混合', () => {
    const tokens = tokenize('RWA 代幣化 token');
    assertTrue(tokens.includes('rwa'), '應包含 rwa');
    assertTrue(tokens.includes('代'), '應包含中文字');
    assertTrue(tokens.includes('token'), '應包含 token');
  });
  
  test('preprocess 應移除停用詞', () => {
    const result = preprocess('這是一個測試');
    assertTrue(!result.tokens.includes('是'), '應移除停用詞');
  });

  // 測試向量化
  console.log('\n📊 向量化測試\n');
  
  const { TFIDFVectorizer } = require('../src/embeddings/vectorizer');
  
  test('TFIDFVectorizer 應正確向量化文檔', () => {
    const vectorizer = new TFIDFVectorizer();
    vectorizer.addDocument('doc1', 'RWA 代幣化是未來趨勢');
    vectorizer.addDocument('doc2', '穩定幣也很重要');
    vectorizer.fit();
    
    const stats = vectorizer.getStats();
    assertEqual(stats.numDocuments, 2, '應有 2 個文檔');
    assertTrue(stats.vocabularySize > 0, '詞彙量應大於 0');
  });
  
  test('搜尋應返回相關結果', () => {
    const vectorizer = new TFIDFVectorizer();
    vectorizer.addDocument('doc1', 'RWA 代幣化是未來趨勢');
    vectorizer.addDocument('doc2', '穩定幣市場發展');
    vectorizer.fit();
    
    const results = vectorizer.search('RWA', 5);
    assertTrue(results.length > 0, '應有搜尋結果');
    assertEqual(results[0].id, 'doc1', '第一個結果應是 doc1');
  });

  // 測試語意搜尋
  console.log('\n🔍 語意搜尋測試\n');
  
  test('SemanticSearch 應正確索引和搜尋', () => {
    const search = new SemanticSearch();
    search.indexArticles(testArticles);
    
    const results = search.search('RWA');
    assertTrue(results.length > 0, '應有搜尋結果');
  });
  
  test('findSimilar 應找出相似文章', () => {
    const search = new SemanticSearch();
    search.indexArticles(testArticles);
    
    const similar = search.findSimilar('test-1');
    // test-1 (RWA) 應該與 test-2 (穩定幣) 相似（都有 DeFi 標籤）
    assertTrue(similar.length > 0 || testArticles.length === 1, '應找到相似文章或知識庫太小');
  });

  // 測試趨勢分析
  console.log('\n📈 趨勢分析測試\n');
  
  test('TrendAnalyzer 應分析趨勢', () => {
    const analyzer = new TrendAnalyzer(testArticles);
    const trend = analyzer.analyzeTrend('RWA');
    
    assertTrue(trend.articleCount >= 0, '文章數應大於等於 0');
    assertTrue(['rising', 'stable', 'declining', 'new', 'no_data'].includes(trend.trend), '趨勢應是有效值');
  });
  
  test('findHotTopics 應找出熱門主題', () => {
    const analyzer = new TrendAnalyzer(testArticles);
    const hot = analyzer.findHotTopics(30);
    
    assertTrue(Array.isArray(hot), '應返回陣列');
  });

  // 測試關聯發現
  console.log('\n🔗 關聯發現測試\n');
  
  test('ConnectionDiscovery 應計算文章關聯', () => {
    const discovery = new ConnectionDiscovery();
    discovery.setArticles(testArticles);
    
    const relation = discovery.calculateRelation(testArticles[0], testArticles[1]);
    assertTrue(typeof relation.totalScore === 'number', '應有總分');
    assertTrue(relation.totalScore >= 0 && relation.totalScore <= 1, '分數應在 0-1 之間');
  });
  
  test('findCommonThemes 應找出共同主題', () => {
    const discovery = new ConnectionDiscovery();
    discovery.setArticles(testArticles);
    
    const themes = discovery.findCommonThemes();
    assertTrue(Array.isArray(themes), '應返回陣列');
  });

  // 測試洞見生成
  console.log('\n💡 洞見生成測試\n');
  
  test('InsightGenerator 應生成主題洞見', () => {
    const generator = new InsightGenerator();
    generator.setArticles(testArticles);
    
    const insights = generator.generateTopicInsights('RWA');
    assertTrue(insights.tag === 'RWA', '標籤應正確');
  });
  
  test('generateWeeklyInsights 應生成週報', () => {
    const generator = new InsightGenerator();
    generator.setArticles(testArticles);
    
    const weekly = generator.generateWeeklyInsights();
    assertTrue(['active', 'no_activity'].includes(weekly.status), '狀態應有效');
  });

  // 測試問答引擎
  console.log('\n❓ 問答引擎測試\n');
  
  test('QAEngine 應分析問題類型', () => {
    const qa = new QAEngine();
    
    const type1 = qa.analyzeQuestion('什麼是 RWA？');
    assertEqual(type1, 'definition', '應識別為定義類問題');
    
    const type2 = qa.analyzeQuestion('有哪些穩定幣？');
    assertEqual(type2, 'listing', '應識別為列舉類問題');
    
    const type3 = qa.analyzeQuestion('為什麼代幣化重要？');
    assertEqual(type3, 'reason', '應識別為原因類問題');
  });
  
  test('QAEngine 應回答問題', () => {
    const qa = new QAEngine();
    qa.loadArticles(testArticles);
    
    const answer = qa.answer('RWA 的挑戰是什麼？');
    assertTrue(answer.status === 'answered' || answer.status === 'no_relevant_info', '應有狀態');
  });

  // 測試結果摘要
  console.log('\n' + '='.repeat(50));
  console.log(`\n測試結果：${passed} 通過, ${failed} 失敗\n`);
  
  if (failed === 0) {
    console.log('🎉 所有測試通過！');
  } else {
    console.log('⚠️  有測試失敗，請檢查。');
    process.exit(1);
  }
}

runTests().catch(console.error);
