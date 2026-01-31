/**
 * 知識庫管理模組
 * 負責追蹤所有收藏的文章，建立索引和關聯
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const KB_FILE = path.join(DATA_DIR, 'knowledge-base.json');

class KnowledgeBase {
  constructor() {
    this.articles = [];
    this.tags = {};
    this.loaded = false;
  }

  /**
   * 載入知識庫
   */
  async load() {
    try {
      const data = await fs.readFile(KB_FILE, 'utf-8');
      const kb = JSON.parse(data);
      this.articles = kb.articles || [];
      this.tags = kb.tags || {};
      this.loaded = true;
    } catch (error) {
      // 檔案不存在，初始化空的知識庫
      this.articles = [];
      this.tags = {};
      this.loaded = true;
    }
  }

  /**
   * 儲存知識庫
   */
  async save() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = {
      articles: this.articles,
      tags: this.tags,
      lastUpdated: new Date().toISOString(),
      stats: this.getStats()
    };
    await fs.writeFile(KB_FILE, JSON.stringify(data, null, 2));
  }

  /**
   * 新增文章到知識庫
   */
  async addArticle(article) {
    if (!this.loaded) await this.load();

    const entry = {
      id: this.generateId(),
      title: article.title,
      url: article.url,
      category: article.category,
      tags: article.tags || [],
      summary: article.summary,
      notionPageId: article.notionPageId,
      notionUrl: article.notionUrl,
      savedAt: new Date().toISOString(),
      keyPoints: article.keyPoints || [],
    };

    this.articles.push(entry);

    // 更新標籤索引
    for (const tag of entry.tags) {
      if (!this.tags[tag]) {
        this.tags[tag] = [];
      }
      this.tags[tag].push(entry.id);
    }

    await this.save();
    return entry;
  }

  /**
   * 搜尋相關文章
   */
  findRelated(tags, currentUrl = null, limit = 5) {
    if (!this.loaded) return [];

    const scores = {};

    for (const article of this.articles) {
      // 排除當前文章
      if (currentUrl && article.url === currentUrl) continue;

      // 計算標籤重疊分數
      let score = 0;
      for (const tag of tags) {
        if (article.tags.includes(tag)) {
          score += 1;
        }
      }

      // 同分類加分
      // if (article.category === category) score += 0.5;

      if (score > 0) {
        scores[article.id] = { article, score };
      }
    }

    // 排序並返回
    return Object.values(scores)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        title: item.article.title,
        url: item.article.notionUrl || item.article.url,
        score: item.score,
        savedAt: item.article.savedAt,
      }));
  }

  /**
   * 依分類取得文章
   */
  getByCategory(category) {
    if (!this.loaded) return [];
    return this.articles.filter(a => a.category === category);
  }

  /**
   * 依標籤取得文章
   */
  getByTag(tag) {
    if (!this.loaded) return [];
    const ids = this.tags[tag] || [];
    return this.articles.filter(a => ids.includes(a.id));
  }

  /**
   * 取得統計資訊
   */
  getStats() {
    const categoryCount = {};
    const tagCount = {};

    for (const article of this.articles) {
      // 分類統計
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
      
      // 標籤統計
      for (const tag of article.tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }

    return {
      totalArticles: this.articles.length,
      byCategory: categoryCount,
      topTags: Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
    };
  }

  /**
   * 產生唯一 ID
   */
  generateId() {
    return `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 搜尋文章
   */
  search(query) {
    if (!this.loaded) return [];
    
    const queryLower = query.toLowerCase();
    return this.articles.filter(article => {
      return (
        article.title.toLowerCase().includes(queryLower) ||
        article.summary?.toLowerCase().includes(queryLower) ||
        article.tags.some(t => t.toLowerCase().includes(queryLower))
      );
    });
  }

  /**
   * 取得最近收藏的文章
   */
  getRecent(limit = 10) {
    if (!this.loaded) return [];
    return [...this.articles]
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
      .slice(0, limit);
  }

  /**
   * 匯出報告
   */
  generateReport() {
    const stats = this.getStats();
    const recent = this.getRecent(5);

    let report = `# 知識庫報告\n\n`;
    report += `📚 總收藏：${stats.totalArticles} 篇\n\n`;
    
    report += `## 分類統計\n`;
    for (const [category, count] of Object.entries(stats.byCategory)) {
      report += `- ${category}: ${count} 篇\n`;
    }

    report += `\n## 熱門標籤\n`;
    for (const { tag, count } of stats.topTags) {
      report += `- #${tag}: ${count} 篇\n`;
    }

    report += `\n## 最近收藏\n`;
    for (const article of recent) {
      report += `- ${article.title}\n`;
    }

    return report;
  }
}

module.exports = { KnowledgeBase };
