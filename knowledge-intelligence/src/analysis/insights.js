/**
 * 洞見生成模組
 * 從累積的知識中產生有價值的洞見
 */

const { TrendAnalyzer } = require('./trends');
const { ConnectionDiscovery } = require('./connections');
const { extractKeywords } = require('../utils/text');

class InsightGenerator {
  constructor() {
    this.articles = [];
    this.trendAnalyzer = new TrendAnalyzer();
    this.connectionDiscovery = new ConnectionDiscovery();
  }

  /**
   * 設定文章資料
   */
  setArticles(articles) {
    this.articles = articles;
    this.trendAnalyzer.setArticles(articles);
    this.connectionDiscovery.setArticles(articles);
  }

  /**
   * 生成主題洞見
   */
  generateTopicInsights(tag) {
    const relatedArticles = this.articles.filter(a =>
      a.tags?.includes(tag) ||
      a.title?.toLowerCase().includes(tag.toLowerCase())
    );

    if (relatedArticles.length === 0) {
      return {
        tag,
        status: 'no_data',
        message: `沒有關於「${tag}」的文章`,
      };
    }

    // 收集所有關鍵觀點
    const allKeyPoints = relatedArticles.flatMap(a => a.keyPoints || []);
    
    // 找出共同的關鍵詞
    const combinedText = relatedArticles
      .map(a => [a.title, a.summary, ...(a.keyPoints || [])].join(' '))
      .join(' ');
    const keywords = extractKeywords(combinedText, 15);

    // 分析趨勢
    const trend = this.trendAnalyzer.analyzeTrend(tag);

    // 生成洞見
    const insights = {
      tag,
      articleCount: relatedArticles.length,
      trend: trend.trendDescription,
      
      // 主要觀點（去重後的關鍵觀點）
      mainPoints: this.deduplicatePoints(allKeyPoints).slice(0, 5),
      
      // 核心關鍵詞
      coreKeywords: keywords.slice(0, 8).map(k => k.token),
      
      // 時間跨度
      timespan: {
        first: relatedArticles.sort((a, b) => 
          new Date(a.savedAt) - new Date(b.savedAt)
        )[0]?.savedAt,
        last: relatedArticles.sort((a, b) => 
          new Date(b.savedAt) - new Date(a.savedAt)
        )[0]?.savedAt,
      },
      
      // 相關主題
      relatedTopics: this.findRelatedTopics(tag),
    };

    return insights;
  }

  /**
   * 去重關鍵觀點
   */
  deduplicatePoints(points) {
    const unique = [];
    const seen = new Set();
    
    for (const point of points) {
      // 簡單的去重：檢查是否有高度相似的觀點
      const normalized = point.toLowerCase().slice(0, 50);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(point);
      }
    }
    
    return unique;
  }

  /**
   * 找出相關主題
   */
  findRelatedTopics(tag) {
    const relatedArticles = this.articles.filter(a =>
      a.tags?.includes(tag)
    );
    
    const otherTags = {};
    for (const article of relatedArticles) {
      for (const t of (article.tags || [])) {
        if (t !== tag) {
          otherTags[t] = (otherTags[t] || 0) + 1;
        }
      }
    }
    
    return Object.entries(otherTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([t, count]) => ({ tag: t, coOccurrence: count }));
  }

  /**
   * 生成跨文章洞見
   */
  generateCrossArticleInsights() {
    if (this.articles.length < 2) {
      return {
        status: 'insufficient_data',
        message: '需要至少 2 篇文章才能生成跨文章洞見',
      };
    }

    // 找出知識群組
    const clusters = this.connectionDiscovery.findClusters();
    
    // 找出共同主題
    const commonThemes = this.connectionDiscovery.findCommonThemes();
    
    // 找出熱門和新興主題
    const hotTopics = this.trendAnalyzer.findHotTopics();
    const emergingTopics = this.trendAnalyzer.findEmergingTopics();

    // 生成洞見摘要
    const insights = {
      totalArticles: this.articles.length,
      
      // 知識群組
      knowledgeClusters: clusters.map(cluster => ({
        size: cluster.length,
        articles: cluster.map(a => a.title),
      })),
      
      // 核心主題
      coreThemes: commonThemes.slice(0, 5).map(t => ({
        theme: t.tag,
        articleCount: t.count,
        articles: t.articles.map(a => a.title),
      })),
      
      // 趨勢
      trends: {
        hot: hotTopics.slice(0, 3),
        emerging: emergingTopics.slice(0, 3),
      },
      
      // 生成敘述性洞見
      narrativeInsights: this.generateNarrativeInsights(
        commonThemes, hotTopics, emergingTopics
      ),
    };

    return insights;
  }

  /**
   * 生成敘述性洞見
   */
  generateNarrativeInsights(commonThemes, hotTopics, emergingTopics) {
    const insights = [];

    // 核心主題洞見
    if (commonThemes.length > 0) {
      const topTheme = commonThemes[0];
      insights.push({
        type: 'core_theme',
        text: `您最關注的主題是「${topTheme.tag}」，共有 ${topTheme.count} 篇相關文章。`,
      });
    }

    // 趨勢洞見
    if (emergingTopics.length > 0) {
      const emerging = emergingTopics[0];
      insights.push({
        type: 'emerging',
        text: `「${emerging.tag}」是近期新興的關注主題，顯示您對此領域的興趣正在增加。`,
      });
    }

    // 多樣性洞見
    const categories = new Set(this.articles.map(a => a.category).filter(Boolean));
    if (categories.size >= 3) {
      insights.push({
        type: 'diversity',
        text: `您的知識庫涵蓋 ${categories.size} 個不同領域，顯示廣泛的閱讀興趣。`,
      });
    }

    return insights;
  }

  /**
   * 回答基於知識的問題
   */
  answerQuestion(question, relevantArticles) {
    if (relevantArticles.length === 0) {
      return {
        status: 'no_relevant_info',
        answer: '在您的知識庫中沒有找到相關資訊。',
      };
    }

    // 收集相關的關鍵觀點和摘要
    const allPoints = relevantArticles.flatMap(a => a.keyPoints || []);
    const allSummaries = relevantArticles.map(a => a.summary).filter(Boolean);

    // 組織答案
    const answer = {
      status: 'found',
      basedOn: relevantArticles.length,
      sources: relevantArticles.map(a => ({
        title: a.title,
        url: a.url,
      })),
      keyPoints: this.deduplicatePoints(allPoints).slice(0, 5),
      summaries: allSummaries.slice(0, 3),
    };

    return answer;
  }

  /**
   * 生成週度洞見
   */
  generateWeeklyInsights() {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyArticles = this.articles.filter(a =>
      new Date(a.savedAt) > weekAgo
    );

    if (weeklyArticles.length === 0) {
      return {
        status: 'no_activity',
        message: '本週沒有新收藏的文章',
      };
    }

    // 本週標籤統計
    const weeklyTags = {};
    for (const article of weeklyArticles) {
      for (const tag of (article.tags || [])) {
        weeklyTags[tag] = (weeklyTags[tag] || 0) + 1;
      }
    }

    const topTags = Object.entries(weeklyTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // 收集本週關鍵觀點
    const weeklyPoints = weeklyArticles.flatMap(a => a.keyPoints || []);

    return {
      status: 'active',
      articleCount: weeklyArticles.length,
      topTopics: topTags.map(([tag, count]) => ({ tag, count })),
      keyTakeaways: this.deduplicatePoints(weeklyPoints).slice(0, 5),
      articles: weeklyArticles.map(a => ({
        title: a.title,
        category: a.category,
        date: a.savedAt,
      })),
    };
  }

  /**
   * 生成完整洞見報告
   */
  generateFullReport() {
    const crossInsights = this.generateCrossArticleInsights();
    const weeklyInsights = this.generateWeeklyInsights();
    const trendReport = this.trendAnalyzer.generateReport();

    let report = `# 🧠 知識智能報告\n\n`;
    report += `📅 生成時間：${new Date().toLocaleString('zh-TW')}\n`;
    report += `📚 知識庫規模：${this.articles.length} 篇文章\n\n`;

    // 本週摘要
    report += `## 📆 本週摘要\n\n`;
    if (weeklyInsights.status === 'active') {
      report += `本週收藏 **${weeklyInsights.articleCount}** 篇文章\n\n`;
      report += `**熱門主題：** ${weeklyInsights.topTopics.map(t => t.tag).join('、')}\n\n`;
      if (weeklyInsights.keyTakeaways.length > 0) {
        report += `**關鍵收穫：**\n`;
        for (const point of weeklyInsights.keyTakeaways) {
          report += `- ${point}\n`;
        }
        report += '\n';
      }
    } else {
      report += `_本週尚未收藏新文章_\n\n`;
    }

    // 知識洞見
    report += `## 💡 知識洞見\n\n`;
    for (const insight of (crossInsights.narrativeInsights || [])) {
      report += `- ${insight.text}\n`;
    }
    report += '\n';

    // 核心主題
    if (crossInsights.coreThemes?.length > 0) {
      report += `## 🎯 核心主題\n\n`;
      for (const theme of crossInsights.coreThemes) {
        report += `### ${theme.theme}\n`;
        report += `${theme.articleCount} 篇文章\n\n`;
      }
    }

    return report;
  }
}

module.exports = { InsightGenerator };
