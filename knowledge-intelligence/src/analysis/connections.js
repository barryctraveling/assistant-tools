/**
 * 關聯發現模組
 * 自動找出文章之間的關係
 */

const { preprocess, jaccardSimilarity, cosineSimilarity, termFrequency } = require('../utils/text');

class ConnectionDiscovery {
  constructor() {
    this.articles = [];
    this.connectionGraph = {};
  }

  /**
   * 設定文章資料
   */
  setArticles(articles) {
    this.articles = articles;
    this.connectionGraph = {};
  }

  /**
   * 計算兩篇文章的關聯度
   */
  calculateRelation(article1, article2) {
    const relations = {
      tagOverlap: 0,
      topicSimilarity: 0,
      keyPointSimilarity: 0,
      totalScore: 0,
      types: [],
    };

    // 1. 標籤重疊
    const tags1 = new Set(article1.tags || []);
    const tags2 = new Set(article2.tags || []);
    const sharedTags = [...tags1].filter(t => tags2.has(t));
    relations.tagOverlap = sharedTags.length / Math.max(tags1.size, tags2.size, 1);
    relations.sharedTags = sharedTags;

    if (sharedTags.length >= 2) {
      relations.types.push('共同主題');
    }

    // 2. 標題相似度
    const title1Tokens = new Set(preprocess(article1.title || '').tokens);
    const title2Tokens = new Set(preprocess(article2.title || '').tokens);
    const titleSimilarity = jaccardSimilarity(title1Tokens, title2Tokens);
    
    if (titleSimilarity > 0.3) {
      relations.types.push('標題相似');
    }

    // 3. 內容主題相似度
    const content1 = [
      article1.title || '',
      article1.summary || '',
      ...(article1.keyPoints || []),
    ].join(' ');
    const content2 = [
      article2.title || '',
      article2.summary || '',
      ...(article2.keyPoints || []),
    ].join(' ');

    const tokens1 = preprocess(content1).tokens;
    const tokens2 = preprocess(content2).tokens;
    
    const tf1 = termFrequency(tokens1);
    const tf2 = termFrequency(tokens2);
    
    relations.topicSimilarity = cosineSimilarity(tf1, tf2);

    // 4. 關鍵觀點相似度
    const kp1 = (article1.keyPoints || []).join(' ');
    const kp2 = (article2.keyPoints || []).join(' ');
    
    if (kp1 && kp2) {
      const kpTokens1 = new Set(preprocess(kp1).tokens);
      const kpTokens2 = new Set(preprocess(kp2).tokens);
      relations.keyPointSimilarity = jaccardSimilarity(kpTokens1, kpTokens2);
      
      if (relations.keyPointSimilarity > 0.2) {
        relations.types.push('觀點相關');
      }
    }

    // 5. 計算總分
    relations.totalScore = (
      relations.tagOverlap * 0.4 +
      relations.topicSimilarity * 0.4 +
      relations.keyPointSimilarity * 0.2
    );

    // 6. 判斷關係類型
    if (article1.category === article2.category && article1.category) {
      relations.types.push('同類文章');
    }

    // 時間關係
    const date1 = new Date(article1.savedAt || 0);
    const date2 = new Date(article2.savedAt || 0);
    const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 7 && relations.totalScore > 0.2) {
      relations.types.push('近期相關');
    }

    return relations;
  }

  /**
   * 建立文章關聯圖譜
   */
  buildConnectionGraph(minScore = 0.15) {
    this.connectionGraph = {};
    
    for (let i = 0; i < this.articles.length; i++) {
      const article1 = this.articles[i];
      this.connectionGraph[article1.id] = [];
      
      for (let j = 0; j < this.articles.length; j++) {
        if (i === j) continue;
        
        const article2 = this.articles[j];
        const relation = this.calculateRelation(article1, article2);
        
        if (relation.totalScore >= minScore) {
          this.connectionGraph[article1.id].push({
            targetId: article2.id,
            targetTitle: article2.title,
            score: relation.totalScore,
            types: relation.types,
            sharedTags: relation.sharedTags,
          });
        }
      }
      
      // 排序連接
      this.connectionGraph[article1.id].sort((a, b) => b.score - a.score);
    }
    
    return this.connectionGraph;
  }

  /**
   * 找出文章的關聯
   */
  findConnections(articleId, topK = 5) {
    if (!this.connectionGraph[articleId]) {
      this.buildConnectionGraph();
    }
    
    return (this.connectionGraph[articleId] || []).slice(0, topK);
  }

  /**
   * 找出所有文章的共同主題
   */
  findCommonThemes() {
    const themes = {};
    
    for (const article of this.articles) {
      for (const tag of (article.tags || [])) {
        if (!themes[tag]) {
          themes[tag] = {
            tag,
            articles: [],
            count: 0,
          };
        }
        themes[tag].articles.push({
          id: article.id,
          title: article.title,
        });
        themes[tag].count++;
      }
    }
    
    return Object.values(themes)
      .filter(t => t.count >= 2)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 找出知識群組
   */
  findClusters() {
    this.buildConnectionGraph(0.25);
    
    const visited = new Set();
    const clusters = [];
    
    for (const article of this.articles) {
      if (visited.has(article.id)) continue;
      
      // BFS 找出連通的文章
      const cluster = [];
      const queue = [article.id];
      
      while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        const currentArticle = this.articles.find(a => a.id === currentId);
        if (currentArticle) {
          cluster.push({
            id: currentArticle.id,
            title: currentArticle.title,
          });
        }
        
        // 加入連接的文章
        const connections = this.connectionGraph[currentId] || [];
        for (const conn of connections) {
          if (!visited.has(conn.targetId) && conn.score > 0.3) {
            queue.push(conn.targetId);
          }
        }
      }
      
      if (cluster.length >= 2) {
        clusters.push(cluster);
      }
    }
    
    return clusters.sort((a, b) => b.length - a.length);
  }

  /**
   * 為新文章找出與現有知識的關聯
   */
  findConnectionsForNewArticle(newArticle) {
    const connections = [];
    
    for (const existing of this.articles) {
      const relation = this.calculateRelation(newArticle, existing);
      
      if (relation.totalScore > 0.1) {
        connections.push({
          article: {
            id: existing.id,
            title: existing.title,
            category: existing.category,
          },
          score: relation.totalScore,
          types: relation.types,
          sharedTags: relation.sharedTags,
        });
      }
    }
    
    return connections.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * 生成關聯報告
   */
  generateReport(articleId) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return '找不到文章';
    
    const connections = this.findConnections(articleId);
    
    let report = `# 🔗 文章關聯報告\n\n`;
    report += `## 📰 ${article.title}\n\n`;
    
    if (connections.length === 0) {
      report += `_目前沒有找到相關文章_\n`;
    } else {
      report += `### 相關文章\n\n`;
      for (const conn of connections) {
        const typeStr = conn.types.length > 0 ? `[${conn.types.join(', ')}]` : '';
        report += `- **${conn.targetTitle}** ${typeStr}\n`;
        report += `  相關度：${(conn.score * 100).toFixed(0)}%\n`;
        if (conn.sharedTags?.length > 0) {
          report += `  共同標籤：${conn.sharedTags.join(', ')}\n`;
        }
        report += '\n';
      }
    }
    
    return report;
  }
}

module.exports = { ConnectionDiscovery };
