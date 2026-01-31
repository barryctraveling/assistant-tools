/**
 * 文章向量化模組
 * 將文章轉換為 TF-IDF 向量，用於語意搜尋
 */

const { preprocess, termFrequency } = require('../utils/text');

class TFIDFVectorizer {
  constructor() {
    this.documents = [];      // 所有文檔
    this.vocabulary = {};     // 詞彙表 {term: index}
    this.idf = {};            // IDF 值
    this.vectors = [];        // TF-IDF 向量
    this.fitted = false;
  }

  /**
   * 新增文檔到語料庫
   */
  addDocument(id, text, metadata = {}) {
    const { all: tokens } = preprocess(text);
    this.documents.push({
      id,
      tokens,
      text,
      metadata,
      termFreq: termFrequency(tokens),
    });
    this.fitted = false;
  }

  /**
   * 計算 IDF（逆文檔頻率）
   */
  calculateIDF() {
    const numDocs = this.documents.length;
    const docFreq = {};
    
    // 計算每個詞出現在多少文檔中
    for (const doc of this.documents) {
      const uniqueTerms = new Set(doc.tokens);
      for (const term of uniqueTerms) {
        docFreq[term] = (docFreq[term] || 0) + 1;
      }
    }
    
    // 計算 IDF
    for (const [term, freq] of Object.entries(docFreq)) {
      this.idf[term] = Math.log((numDocs + 1) / (freq + 1)) + 1;
      this.vocabulary[term] = Object.keys(this.vocabulary).length;
    }
  }

  /**
   * 計算文檔的 TF-IDF 向量
   */
  vectorize(termFreq) {
    const vector = {};
    const maxFreq = Math.max(...Object.values(termFreq), 1);
    
    for (const [term, freq] of Object.entries(termFreq)) {
      if (this.idf[term]) {
        // 正規化的 TF * IDF
        const tf = freq / maxFreq;
        vector[term] = tf * this.idf[term];
      }
    }
    
    return vector;
  }

  /**
   * 訓練向量化器（計算所有文檔的向量）
   */
  fit() {
    if (this.documents.length === 0) {
      throw new Error('沒有文檔可以訓練');
    }
    
    this.calculateIDF();
    
    this.vectors = this.documents.map(doc => ({
      id: doc.id,
      vector: this.vectorize(doc.termFreq),
      metadata: doc.metadata,
    }));
    
    this.fitted = true;
  }

  /**
   * 將查詢轉換為向量
   */
  transformQuery(query) {
    const { all: tokens } = preprocess(query);
    const termFreq = termFrequency(tokens);
    return this.vectorize(termFreq);
  }

  /**
   * 計算向量之間的餘弦相似度
   */
  cosineSimilarity(vec1, vec2) {
    const keys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (const key of keys) {
      const v1 = vec1[key] || 0;
      const v2 = vec2[key] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 搜尋最相似的文檔
   */
  search(query, topK = 5) {
    if (!this.fitted) {
      this.fit();
    }
    
    const queryVector = this.transformQuery(query);
    
    const scores = this.vectors.map(doc => ({
      id: doc.id,
      score: this.cosineSimilarity(queryVector, doc.vector),
      metadata: doc.metadata,
    }));
    
    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * 找出兩個文檔之間的共同重要詞
   */
  getSharedTerms(id1, id2) {
    const doc1 = this.vectors.find(v => v.id === id1);
    const doc2 = this.vectors.find(v => v.id === id2);
    
    if (!doc1 || !doc2) return [];
    
    const shared = [];
    for (const [term, weight1] of Object.entries(doc1.vector)) {
      const weight2 = doc2.vector[term];
      if (weight2) {
        shared.push({
          term,
          weight: (weight1 + weight2) / 2,
        });
      }
    }
    
    return shared.sort((a, b) => b.weight - a.weight);
  }

  /**
   * 取得文檔的關鍵詞
   */
  getTopTerms(docId, topN = 10) {
    const doc = this.vectors.find(v => v.id === docId);
    if (!doc) return [];
    
    return Object.entries(doc.vector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([term, weight]) => ({ term, weight }));
  }

  /**
   * 匯出狀態（用於持久化）
   */
  export() {
    return {
      documents: this.documents.map(d => ({
        id: d.id,
        metadata: d.metadata,
        termFreq: d.termFreq,
      })),
      vocabulary: this.vocabulary,
      idf: this.idf,
      vectors: this.vectors,
      fitted: this.fitted,
    };
  }

  /**
   * 匯入狀態
   */
  import(state) {
    this.documents = state.documents || [];
    this.vocabulary = state.vocabulary || {};
    this.idf = state.idf || {};
    this.vectors = state.vectors || [];
    this.fitted = state.fitted || false;
  }

  /**
   * 統計資訊
   */
  getStats() {
    return {
      numDocuments: this.documents.length,
      vocabularySize: Object.keys(this.vocabulary).length,
      averageDocLength: this.documents.reduce((sum, d) => sum + d.tokens.length, 0) / 
                        Math.max(this.documents.length, 1),
      fitted: this.fitted,
    };
  }
}

module.exports = { TFIDFVectorizer };
