/**
 * 趨勢分析模組
 * 追蹤主題隨時間的發展
 */

const { preprocess, extractKeywords } = require('../utils/text');

class TrendAnalyzer {
  constructor(articles = []) {
    this.articles = articles;
  }

  /**
   * 設定文章資料
   */
  setArticles(articles) {
    this.articles = articles;
  }

  /**
   * 依時間排序文章
   */
  sortByDate(ascending = true) {
    return [...this.articles].sort((a, b) => {
      const dateA = new Date(a.savedAt || 0);
      const dateB = new Date(b.savedAt || 0);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * 建立時間軸
   */
  buildTimeline(tag = null) {
    let filtered = this.articles;
    
    // 如果指定標籤，只看相關文章
    if (tag) {
      filtered = filtered.filter(a => 
        a.tags?.includes(tag) || 
        a.title?.toLowerCase().includes(tag.toLowerCase()) ||
        a.content?.toLowerCase().includes(tag.toLowerCase())
      );
    }
    
    // 依時間排序
    const sorted = filtered.sort((a, b) => 
      new Date(a.savedAt || 0) - new Date(b.savedAt || 0)
    );
    
    // 建立時間軸
    return sorted.map(article => ({
      date: article.savedAt,
      title: article.title,
      id: article.id,
      category: article.category,
      keyPoints: article.keyPoints?.slice(0, 2) || [],
    }));
  }

  /**
   * 分析主題趨勢
   */
  analyzeTrend(tag) {
    const timeline = this.buildTimeline(tag);
    
    if (timeline.length === 0) {
      return {
        tag,
        articleCount: 0,
        trend: 'no_data',
        message: `沒有找到與「${tag}」相關的文章`,
      };
    }

    // 計算趨勢
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    
    const recentCount = timeline.filter(a => new Date(a.date) > thirtyDaysAgo).length;
    const olderCount = timeline.filter(a => {
      const date = new Date(a.date);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    }).length;
    
    let trend = 'stable';
    let trendDescription = '穩定關注中';
    
    if (recentCount > olderCount * 1.5) {
      trend = 'rising';
      trendDescription = '關注度上升 📈';
    } else if (recentCount < olderCount * 0.5 && olderCount > 0) {
      trend = 'declining';
      trendDescription = '關注度下降 📉';
    } else if (timeline.length === 1) {
      trend = 'new';
      trendDescription = '新興主題 🆕';
    }

    // 提取主要觀點演變
    const keyPointsOverTime = timeline.map(a => ({
      date: a.date,
      points: a.keyPoints,
    })).filter(a => a.points.length > 0);

    return {
      tag,
      articleCount: timeline.length,
      trend,
      trendDescription,
      recentCount,
      olderCount,
      firstMention: timeline[0]?.date,
      lastMention: timeline[timeline.length - 1]?.date,
      timeline: timeline.slice(-10),  // 最近 10 篇
      keyPointsEvolution: keyPointsOverTime.slice(-5),
    };
  }

  /**
   * 找出熱門主題
   */
  findHotTopics(days = 30) {
    const now = new Date();
    const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
    
    const recentArticles = this.articles.filter(a => 
      new Date(a.savedAt || 0) > cutoff
    );
    
    // 統計標籤頻率
    const tagFreq = {};
    for (const article of recentArticles) {
      for (const tag of (article.tags || [])) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
    }
    
    // 排序
    return Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round(count / recentArticles.length * 100),
      }));
  }

  /**
   * 找出新興主題
   */
  findEmergingTopics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    
    const recentArticles = this.articles.filter(a => 
      new Date(a.savedAt || 0) > thirtyDaysAgo
    );
    const olderArticles = this.articles.filter(a => {
      const date = new Date(a.savedAt || 0);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    });
    
    // 計算標籤頻率變化
    const recentTags = {};
    const olderTags = {};
    
    for (const a of recentArticles) {
      for (const tag of (a.tags || [])) {
        recentTags[tag] = (recentTags[tag] || 0) + 1;
      }
    }
    
    for (const a of olderArticles) {
      for (const tag of (a.tags || [])) {
        olderTags[tag] = (olderTags[tag] || 0) + 1;
      }
    }
    
    // 找出增長最快的主題
    const emerging = [];
    for (const [tag, recentCount] of Object.entries(recentTags)) {
      const olderCount = olderTags[tag] || 0;
      if (recentCount > olderCount) {
        const growth = olderCount === 0 ? recentCount * 2 : recentCount / olderCount;
        emerging.push({ tag, recentCount, olderCount, growth });
      }
    }
    
    return emerging
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 5);
  }

  /**
   * 生成趨勢報告
   */
  generateReport() {
    const hotTopics = this.findHotTopics();
    const emergingTopics = this.findEmergingTopics();
    const sortedArticles = this.sortByDate(false);
    
    let report = `# 📊 知識庫趨勢報告\n\n`;
    report += `📚 總文章數：${this.articles.length}\n\n`;
    
    report += `## 🔥 近期熱門主題（30天內）\n`;
    if (hotTopics.length > 0) {
      for (const topic of hotTopics) {
        report += `- **${topic.tag}**：${topic.count} 篇 (${topic.percentage}%)\n`;
      }
    } else {
      report += `_尚無足夠資料_\n`;
    }
    
    report += `\n## 📈 新興主題\n`;
    if (emergingTopics.length > 0) {
      for (const topic of emergingTopics) {
        const growthText = topic.olderCount === 0 ? '新出現' : `成長 ${topic.growth.toFixed(1)}x`;
        report += `- **${topic.tag}**：${topic.recentCount} 篇 (${growthText})\n`;
      }
    } else {
      report += `_尚無明顯新興主題_\n`;
    }
    
    report += `\n## 📅 最近收藏\n`;
    for (const article of sortedArticles.slice(0, 5)) {
      const date = new Date(article.savedAt).toLocaleDateString('zh-TW');
      report += `- **${date}** - ${article.title}\n`;
    }
    
    return report;
  }
}

module.exports = { TrendAnalyzer };
