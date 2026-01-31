/**
 * 報告生成模組
 * 負責生成各種知識庫報告
 */

const { KnowledgeBase } = require('./knowledge');

class ReportGenerator {
  constructor() {
    this.kb = new KnowledgeBase();
  }

  /**
   * 生成週報
   */
  async generateWeeklyReport() {
    await this.kb.load();
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 篩選本週收藏的文章
    const weeklyArticles = this.kb.articles.filter(a => {
      const savedAt = new Date(a.savedAt);
      return savedAt >= weekAgo;
    });

    // 統計本週標籤
    const weeklyTags = {};
    weeklyArticles.forEach(a => {
      a.tags.forEach(tag => {
        weeklyTags[tag] = (weeklyTags[tag] || 0) + 1;
      });
    });

    // 生成報告
    let report = `# 📚 知識庫週報\n`;
    report += `📅 ${this.formatDate(weekAgo)} — ${this.formatDate(now)}\n\n`;
    
    report += `## 📊 本週統計\n`;
    report += `- 新增文章：${weeklyArticles.length} 篇\n`;
    report += `- 累計收藏：${this.kb.articles.length} 篇\n\n`;

    if (weeklyArticles.length > 0) {
      report += `## 📰 本週收藏\n`;
      weeklyArticles.forEach(a => {
        report += `### ${a.title}\n`;
        report += `- 分類：${a.category}\n`;
        report += `- 標籤：${a.tags.map(t => `#${t}`).join(' ')}\n`;
        report += `- 摘要：${a.summary}\n`;
        report += `- [Notion 連結](${a.notionUrl})\n\n`;
      });

      report += `## 🏷️ 本週熱門標籤\n`;
      const sortedTags = Object.entries(weeklyTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      sortedTags.forEach(([tag, count]) => {
        report += `- #${tag}: ${count} 篇\n`;
      });
    } else {
      report += `> 本週尚未收藏任何文章\n`;
    }

    report += `\n---\n`;
    report += `*報告生成時間：${now.toISOString()}*\n`;

    return report;
  }

  /**
   * 生成主題深度報告
   */
  async generateTopicReport(tag) {
    await this.kb.load();
    
    const articles = this.kb.getByTag(tag);
    
    let report = `# 🔍 主題深度報告：${tag}\n\n`;
    report += `## 📊 統計\n`;
    report += `- 相關文章：${articles.length} 篇\n\n`;

    if (articles.length > 0) {
      // 時間軸
      report += `## 📅 時間軸\n`;
      const sorted = [...articles].sort((a, b) => 
        new Date(a.savedAt) - new Date(b.savedAt)
      );
      sorted.forEach(a => {
        const date = new Date(a.savedAt).toLocaleDateString('zh-TW');
        report += `- **${date}** - ${a.title}\n`;
      });

      // 關鍵洞見
      report += `\n## 💡 關鍵洞見\n`;
      const allKeyPoints = articles.flatMap(a => a.keyPoints || []);
      const uniquePoints = [...new Set(allKeyPoints)].slice(0, 10);
      uniquePoints.forEach(point => {
        report += `- ${point}\n`;
      });

      // 相關標籤
      report += `\n## 🔗 相關標籤\n`;
      const relatedTags = {};
      articles.forEach(a => {
        a.tags.forEach(t => {
          if (t !== tag) {
            relatedTags[t] = (relatedTags[t] || 0) + 1;
          }
        });
      });
      const sortedRelated = Object.entries(relatedTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      sortedRelated.forEach(([t, count]) => {
        report += `- #${t}: ${count} 篇\n`;
      });
    } else {
      report += `> 尚無「${tag}」相關的文章\n`;
    }

    return report;
  }

  /**
   * 生成分類報告
   */
  async generateCategoryReport(category) {
    await this.kb.load();
    
    const articles = this.kb.getByCategory(category);
    
    let report = `# 📁 分類報告：${category}\n\n`;
    report += `## 📊 統計\n`;
    report += `- 文章數量：${articles.length} 篇\n\n`;

    if (articles.length > 0) {
      report += `## 📰 文章列表\n`;
      articles.forEach(a => {
        report += `- [${a.title}](${a.notionUrl})\n`;
        report += `  ${a.summary?.slice(0, 50)}...\n`;
      });
    }

    return report;
  }

  /**
   * 格式化日期
   */
  formatDate(date) {
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

module.exports = { ReportGenerator };
