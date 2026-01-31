/**
 * 知識問答引擎
 * 基於累積的知識回答問題
 */

const { SemanticSearch } = require('../search/semantic');
const { InsightGenerator } = require('../analysis/insights');

class QAEngine {
  constructor() {
    this.search = new SemanticSearch();
    this.insights = new InsightGenerator();
    this.articles = [];
  }

  /**
   * 載入文章資料
   */
  loadArticles(articles) {
    this.articles = articles;
    this.search.indexArticles(articles);
    this.insights.setArticles(articles);
  }

  /**
   * 分析問題類型
   */
  analyzeQuestion(question) {
    const questionLower = question.toLowerCase();
    
    // 問題類型識別
    const patterns = {
      // 定義/解釋類
      definition: [
        /什麼是/,
        /何謂/,
        /怎麼理解/,
        /what is/i,
        /define/i,
        /explain/i,
      ],
      // 比較類
      comparison: [
        /和.*比/,
        /區別/,
        /差異/,
        /不同/,
        /vs/i,
        /compare/i,
        /difference/i,
      ],
      // 列舉類
      listing: [
        /有哪些/,
        /列出/,
        /包括/,
        /what are/i,
        /list/i,
      ],
      // 原因類
      reason: [
        /為什麼/,
        /原因/,
        /why/i,
        /reason/i,
      ],
      // 總結類
      summary: [
        /總結/,
        /摘要/,
        /概括/,
        /summarize/i,
        /summary/i,
      ],
      // 趨勢類
      trend: [
        /趨勢/,
        /發展/,
        /未來/,
        /trend/i,
        /future/i,
      ],
      // 觀點類
      opinion: [
        /觀點/,
        /看法/,
        /認為/,
        /opinion/i,
        /think/i,
        /view/i,
      ],
    };

    for (const [type, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        if (regex.test(questionLower)) {
          return type;
        }
      }
    }

    return 'general';
  }

  /**
   * 提取問題中的主題/關鍵詞
   */
  extractTopics(question) {
    // 移除問句詞
    const cleaned = question
      .replace(/什麼是|何謂|怎麼|為什麼|有哪些|如何|根據我的文章|根據我收藏的/g, '')
      .replace(/what|why|how|which|when|where|who|is|are|the|my|your/gi, '')
      .replace(/[？?，,。.！!]/g, '')
      .trim();
    
    return cleaned;
  }

  /**
   * 回答問題
   */
  answer(question) {
    const questionType = this.analyzeQuestion(question);
    const topics = this.extractTopics(question);
    
    // 搜尋相關文章
    const searchResults = this.search.searchWithContext(question);
    
    if (!searchResults.hasRelevantInfo) {
      return {
        status: 'no_relevant_info',
        question,
        questionType,
        answer: `在您的知識庫中沒有找到與「${topics}」相關的資訊。`,
        suggestions: this.getSuggestions(topics),
      };
    }

    // 根據問題類型生成答案
    let answer;
    switch (questionType) {
      case 'definition':
        answer = this.generateDefinitionAnswer(topics, searchResults.results);
        break;
      case 'listing':
        answer = this.generateListingAnswer(topics, searchResults.results);
        break;
      case 'summary':
        answer = this.generateSummaryAnswer(topics, searchResults.results);
        break;
      case 'trend':
        answer = this.generateTrendAnswer(topics, searchResults.results);
        break;
      case 'reason':
        answer = this.generateReasonAnswer(topics, searchResults.results);
        break;
      default:
        answer = this.generateGeneralAnswer(topics, searchResults.results);
    }

    return {
      status: 'answered',
      question,
      questionType,
      ...answer,
      sources: searchResults.results.map(r => ({
        title: r.title,
        relevance: Math.round(r.relevance * 100),
        url: r.source,
      })),
    };
  }

  /**
   * 生成定義類答案
   */
  generateDefinitionAnswer(topic, results) {
    const summaries = results
      .filter(r => r.summary)
      .map(r => r.summary);
    
    const keyPoints = results.flatMap(r => r.keyPoints || []);
    
    return {
      answer: summaries[0] || keyPoints[0] || `根據您的文章，「${topic}」的相關資訊如下：`,
      supportingPoints: keyPoints.slice(0, 3),
    };
  }

  /**
   * 生成列舉類答案
   */
  generateListingAnswer(topic, results) {
    const allPoints = results.flatMap(r => r.keyPoints || []);
    const uniquePoints = [...new Set(allPoints)];
    
    return {
      answer: `根據您收藏的文章，關於「${topic}」的要點包括：`,
      items: uniquePoints.slice(0, 8),
    };
  }

  /**
   * 生成總結類答案
   */
  generateSummaryAnswer(topic, results) {
    const summaries = results
      .filter(r => r.summary)
      .slice(0, 3)
      .map(r => r.summary);
    
    const keyPoints = results
      .flatMap(r => r.keyPoints || [])
      .slice(0, 5);
    
    return {
      answer: `關於「${topic}」的總結：`,
      summaries,
      keyTakeaways: keyPoints,
    };
  }

  /**
   * 生成趨勢類答案
   */
  generateTrendAnswer(topic, results) {
    // 按時間排序
    const sorted = [...results].sort((a, b) => {
      const dateA = new Date(a.savedAt || 0);
      const dateB = new Date(b.savedAt || 0);
      return dateA - dateB;
    });
    
    const timeline = sorted.map(r => ({
      title: r.title,
      date: r.savedAt,
      keyPoint: r.keyPoints?.[0],
    }));
    
    return {
      answer: `「${topic}」的發展趨勢：`,
      timeline: timeline.slice(0, 5),
      observation: sorted.length >= 2 
        ? '觀點隨時間有所演變，請參考以下時間軸：'
        : '目前資料量不足以分析完整趨勢。',
    };
  }

  /**
   * 生成原因類答案
   */
  generateReasonAnswer(topic, results) {
    // 尋找包含原因的關鍵觀點
    const allPoints = results.flatMap(r => r.keyPoints || []);
    const reasonPoints = allPoints.filter(p =>
      /因為|所以|原因|導致|由於|because|due to|reason/i.test(p)
    );
    
    return {
      answer: `關於「${topic}」的原因分析：`,
      reasons: reasonPoints.length > 0 ? reasonPoints.slice(0, 4) : allPoints.slice(0, 4),
    };
  }

  /**
   * 生成一般答案
   */
  generateGeneralAnswer(topic, results) {
    const summaries = results
      .filter(r => r.summary)
      .map(r => r.summary);
    
    const keyPoints = results.flatMap(r => r.keyPoints || []);
    const snippets = results.flatMap(r => r.snippets || []);
    
    return {
      answer: summaries[0] || `根據您的知識庫，以下是關於「${topic}」的資訊：`,
      keyPoints: [...new Set(keyPoints)].slice(0, 5),
      relevantExcerpts: snippets.slice(0, 3),
    };
  }

  /**
   * 獲取建議
   */
  getSuggestions(topic) {
    // 找出知識庫中有的相似主題
    const allTags = new Set();
    for (const article of this.articles) {
      for (const tag of (article.tags || [])) {
        allTags.add(tag);
      }
    }
    
    // 簡單的相似度匹配
    const suggestions = [...allTags].filter(tag =>
      tag.toLowerCase().includes(topic.toLowerCase().slice(0, 3)) ||
      topic.toLowerCase().includes(tag.toLowerCase().slice(0, 3))
    );
    
    if (suggestions.length > 0) {
      return `您可能想問的是：${suggestions.slice(0, 3).join('、')}？`;
    }
    
    return '您可以嘗試搜尋其他主題，或收藏更多相關文章。';
  }

  /**
   * 互動式問答（支援追問）
   */
  interactiveQA(question, context = null) {
    // 如果有上下文，將其加入搜尋
    let enhancedQuestion = question;
    if (context?.previousTopic) {
      enhancedQuestion = `${context.previousTopic} ${question}`;
    }
    
    const result = this.answer(enhancedQuestion);
    
    // 建議後續問題
    result.suggestedFollowups = this.suggestFollowups(question, result);
    
    return result;
  }

  /**
   * 建議後續問題
   */
  suggestFollowups(question, result) {
    const followups = [];
    
    if (result.status === 'answered') {
      const sources = result.sources || [];
      if (sources.length > 1) {
        followups.push(`這些觀點之間有什麼關聯？`);
      }
      
      const topics = this.extractTopics(question);
      followups.push(`${topics}的未來趨勢是什麼？`);
      followups.push(`還有哪些相關主題？`);
    }
    
    return followups.slice(0, 3);
  }
}

module.exports = { QAEngine };
