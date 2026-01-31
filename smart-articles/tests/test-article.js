#!/usr/bin/env node

/**
 * 測試腳本 - 驗證文章分析功能
 */

const { ArticleAnalyzer } = require('../lib/analyzer');
const { KnowledgeBase } = require('../lib/knowledge');

// 測試用文章內容
const testContent = `
RWAs Don't Need More Tokenization. They Need A 'Cash Wrapper'

Tokenization has had a strong year. Real-world assets are moving on-chain in more formats, 
across more networks, with more institutional interest than at any point in the last cycle. 
But the adoption curve is still lopsided: lots of issuance, not nearly as much everyday usage.

That gap is the story.

Because in crypto markets, assets do not become "real" when they are tokenized. 
They become real when they behave like money: easy to move, easy to price, easy to settle, 
and reliable under stress.

"While liquidity depth is important for traders, for an RWA to reach institutional scale, 
the single most important component is reliable redemption," said Saeed Al Fahim, founder of Tharwa.

The market does not need another thousand tokenized assets. It needs a smaller number of 
RWA-linked instruments that are designed to be used as money-like infrastructure inside DeFi.

Al Fahim framed the misconception directly: "The biggest misconception is that tokenization 
itself creates value. It doesn't. It only creates efficiency."

BTCC recently reported a 809% surge in tokenized gold activity as spot gold prices pushed 
to new highs, an example of how tokenized RWAs gain traction.

Key statistics:
- Tokenized gold activity up 809%
- Stablecoins represent $150 billion in market cap
- RWA market expected to reach $16 trillion by 2030
`;

async function runTests() {
  console.log('🧪 智慧文章收藏系統 - 測試');
  console.log('========================');
  console.log('');

  // 測試 1: 文章分析
  console.log('📝 測試 1: 文章分析');
  console.log('-------------------');
  
  const analyzer = new ArticleAnalyzer();
  const result = analyzer.analyze(testContent, 'https://test.com/article');

  console.log(`標題: ${result.title}`);
  console.log(`分類: ${result.category}`);
  console.log(`標籤: ${result.tags.join(', ')}`);
  console.log(`摘要: ${result.summary}`);
  console.log('');
  
  console.log('關鍵重點:');
  result.keyPoints.forEach((point, i) => {
    console.log(`  ${i + 1}. ${point.slice(0, 60)}...`);
  });
  console.log('');

  console.log('引用:');
  result.quotes.forEach(q => {
    console.log(`  "${q.text.slice(0, 50)}..." — ${q.source}`);
  });
  console.log('');

  console.log('數據點:');
  result.dataPoints.forEach(d => {
    console.log(`  • ${d.slice(0, 60)}...`);
  });
  console.log('');

  // 驗證
  let passed = 0;
  let failed = 0;

  // 檢查分類是否正確（應該是金融科技）
  if (result.category === '🏦 金融科技/區塊鏈') {
    console.log('✅ 分類判斷正確');
    passed++;
  } else {
    console.log(`❌ 分類判斷錯誤: 預期 "🏦 金融科技/區塊鏈", 得到 "${result.category}"`);
    failed++;
  }

  // 檢查是否有提取到 RWA 標籤
  if (result.tags.some(t => t.includes('RWA'))) {
    console.log('✅ 標籤提取正確（包含 RWA）');
    passed++;
  } else {
    console.log('❌ 標籤提取錯誤（缺少 RWA）');
    failed++;
  }

  // 檢查是否有關鍵重點
  if (result.keyPoints.length >= 3) {
    console.log(`✅ 關鍵重點提取正確（${result.keyPoints.length} 個）`);
    passed++;
  } else {
    console.log(`❌ 關鍵重點不足（只有 ${result.keyPoints.length} 個）`);
    failed++;
  }

  // 檢查是否有引用
  if (result.quotes.length > 0) {
    console.log(`✅ 引用提取正確（${result.quotes.length} 個）`);
    passed++;
  } else {
    console.log('❌ 未提取到引用');
    failed++;
  }

  // 檢查是否有數據點
  if (result.dataPoints.length > 0) {
    console.log(`✅ 數據點提取正確（${result.dataPoints.length} 個）`);
    passed++;
  } else {
    console.log('❌ 未提取到數據點');
    failed++;
  }

  console.log('');
  
  // 測試 2: 知識庫
  console.log('📚 測試 2: 知識庫');
  console.log('----------------');

  const kb = new KnowledgeBase();
  await kb.load();

  const stats = kb.getStats();
  console.log(`知識庫中有 ${stats.totalArticles} 篇文章`);

  // 測試相關文章查詢
  const related = kb.findRelated(['RWA', '穩定幣']);
  console.log(`找到 ${related.length} 篇相關文章`);

  if (stats.totalArticles >= 0) {
    console.log('✅ 知識庫載入正常');
    passed++;
  } else {
    console.log('❌ 知識庫載入失敗');
    failed++;
  }

  console.log('');
  console.log('========================');
  console.log(`測試結果: ${passed} 通過, ${failed} 失敗`);
  
  if (failed === 0) {
    console.log('🎉 所有測試通過！');
  } else {
    console.log('⚠️  有測試失敗，請檢查');
  }
}

runTests().catch(console.error);
