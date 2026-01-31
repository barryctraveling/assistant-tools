/**
 * 語意搜尋引擎
 * 支援自然語言查詢，找出最相關的文章和段落
 */

const { TFIDFVectorizer } = require('../embeddings/vectorizer');
const { preprocess, extractKeySentences } = require('../utils/text');

class SemanticSearch {
  constructor() {
    this.vectorizer = new TFIDFVectorizer();
    this.articles = new Map(); // 儲存完整文章內容
  }

  /**
   * 索引文章
   */
  indexArticle(article) {
    const { id, title, content, summary, keyPoints = [], url, category, tags = [], savedAt } = article;
    
    // 組合所有可搜尋的文字
    const searchableText = [
      title,
      content || '',
      summary || '',
      ...keyPoints,
      ...tags,
    ].join(' ');
    
    // 儲存完整資料
    this.articles.set(id, {
      id,
      title,
      content,
      summary,
      keyPoints,
      url,
      category,
      tags,
      savedAt,
    });
    
    // 加入向量化器
    this.vectorizer.addDocument(id, searchableText, {
      title,
      category,
      tags,
      savedAt,
    });
  }

  /**
   * 批次索引文章
   */
  indexArticles(articles) {
    for (const article of articles) {
      this.indexArticle(article);
    }
    this.vectorizer.fit();
  }

  /**
   * 搜尋文章
   */
  search(query, options = {}) {
    const { topK = 5, minScore = 0.1, includeSnippets = true } = options;
    
    // 確保已訓練
    if (!this.vectorizer.fitted) {
      this.vectorizer.fit();
    }
    
    // 搜尋相似文章
    const results = this.vectorizer.search(query, topK);
    
    // 增強結果
    return results
      .filter(r => r.score >= minScore)
      .map(result => {
        const article = this.articles.get(result.id);
        const enhanced = {
          ...result,
          title: article?.title || 'Unknown',
          category: article?.category,
          tags: article?.tags || [],
          url: article?.url,
          savedAt: article?.savedAt,
        };
        
        // 提取相關片段
        if (includeSnippets && article?.content) {
          enhanced.snippets = this.extractRelevantSnippets(query, article.content);
        }
        
        if (article?.summary) {
          enhanced.summary = article.summary;
        }
        
        if (article?.keyPoints) {
          enhanced.keyPoints = article.keyPoints;
        }
        
        return enhanced;
      });
  }

  /**
   * 提取與查詢相關的片段
   */
  extractRelevantSnippets(query, content, maxSnippets = 3) {
    const queryTokens = new Set(preprocess(query).tokens);
    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim().length > 15);
    
    // 計算每個句子與查詢的相關度
    const scored = sentences.map(sentence => {
      const sentTokens = preprocess(sentence).tokens;
      const overlap = sentTokens.filter(t => queryTokens.has(t)).length;
      const score = overlap / Math.max(queryTokens.size, 1);
      return { sentence: sentence.trim(), score };
    });
    
    // 返回最相關的片段
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSnippets)
      .map(s => s.sentence);
  }

  /**
   * 搜尋並回答問題
   */
  searchWithContext(question, topK = 3) {
    const results = this.search(question, { topK, includeSnippets: true });
    
    // 建構上下文
    const context = results.map(r => ({
      title: r.title,
      relevance: r.score,
      snippets: r.snippets || [],
      summary: r.summary,
      keyPoints: r.keyPoints,
      source: r.url,
    }));
    
    return {
      question,
      results: context,
      hasRelevantInfo: results.length > 0 && results[0].score > 0.15,
    };
  }

  /**
   * 找出相似文章
   */
  findSimilar(articleId, topK = 5) {
    const article = this.articles.get(articleId);
    if (!article) return [];
    
    // 使用文章的內容作為查詢
    const searchText = [
      article.title,
      article.summary || '',
      ...(article.keyPoints || []),
    ].join(' ');
    
    return this.search(searchText, { topK: topK + 1 })
      .filter(r => r.id !== articleId)  // 排除自己
      .slice(0, topK);
  }

  /**
   * 依主題群組文章
   */
  clusterByTopic() {
    const clusters = {};
    
    for (const [id, article] of this.articles) {
      const category = article.category || '未分類';
      if (!clusters[category]) {
        clusters[category] = [];
      }
      clusters[category].push({
        id,
        title: article.title,
        tags: article.tags,
        savedAt: article.savedAt,
      });
    }
    
    return clusters;
  }

  /**
   * 取得統計資訊
   */
  getStats() {
    return {
      totalArticles: this.articles.size,
      vectorizerStats: this.vectorizer.getStats(),
      categories: this.clusterByTopic(),
    };
  }

  /**
   * 匯出索引
   */
  export() {
    return {
      vectorizer: this.vectorizer.export(),
      articles: Object.fromEntries(this.articles),
    };
  }

  /**
   * 匯入索引
   */
  import(data) {
    if (data.vectorizer) {
      this.vectorizer.import(data.vectorizer);
    }
    if (data.articles) {
      this.articles = new Map(Object.entries(data.articles));
    }
  }
}

module.exports = { SemanticSearch };
