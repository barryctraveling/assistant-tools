/**
 * 文章分析模組
 * 負責提取文章的關鍵資訊、摘要、引用等
 */

class ArticleAnalyzer {
  constructor() {
    // 停用詞（不提取為標籤的常見詞）
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      '的', '了', '是', '在', '有', '和', '與', '或', '但', '而', '因為',
      '所以', '如果', '那麼', '這', '那', '它', '他', '她', '我們', '你們',
    ]);

    // 分類關鍵字對照表
    this.categoryKeywords = {
      '🤖 AI 科技': [
        'AI', '人工智慧', 'artificial intelligence', 'machine learning',
        'GPT', 'LLM', '大語言模型', 'deep learning', '深度學習',
        'neural network', '神經網路', 'OpenAI', 'Anthropic', 'Claude',
        'ChatGPT', 'Gemini', '生成式', 'generative', 'AGI'
      ],
      '🏦 金融科技/區塊鏈': [
        'RWA', 'real world asset', '真實世界資產', 'tokenization', '代幣化',
        'stablecoin', '穩定幣', 'blockchain', '區塊鏈', 'DeFi',
        'crypto', '加密貨幣', 'CBDC', '央行數位貨幣', 'fintech', '金融科技',
        'STO', '證券代幣', 'Web3', 'smart contract', '智能合約',
        '金管會', 'FSC', 'SEC', '虛擬資產', 'VASP'
      ],
      '🌍 全球趨勢': [
        '全球', 'global', 'world', '國際', 'international',
        '趨勢', 'trend', '未來', 'future', '預測', 'forecast',
        '市場', 'market', '經濟', 'economy', 'GDP'
      ],
      '📱 社群熱門': [
        'viral', '爆紅', '熱門', 'trending', '社群', 'social media',
        'Twitter', 'X', 'Instagram', 'TikTok', 'Facebook', 'YouTube'
      ]
    };

    // 引用識別模式
    this.quotePatterns = [
      /[「「]([^」」]+)[」」]\s*[—–-]\s*([^,，。]+)/g,
      /"([^"]+)"\s*[—–-]\s*([^,，。]+)/g,
      /"([^"]+)"\s*said\s+([^,，。]+)/gi,
      /([^,，。]+)\s+said[,:]?\s*"([^"]+)"/gi,
    ];

    // 數據識別模式
    this.dataPatterns = [
      /(\d+(?:\.\d+)?)\s*%/g,  // 百分比
      /\$\s*(\d+(?:\.\d+)?)\s*(billion|million|trillion|B|M|T)/gi,  // 金額
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(億|萬|兆)/g,  // 中文數字
    ];
  }

  /**
   * 分析文章並提取關鍵資訊
   */
  analyze(content, url = '') {
    const result = {
      title: this.extractTitle(content),
      category: this.determineCategory(content),
      tags: this.extractTags(content),
      summary: this.generateSummary(content),
      keyPoints: this.extractKeyPoints(content),
      quotes: this.extractQuotes(content),
      dataPoints: this.extractDataPoints(content),
      entities: this.extractEntities(content),
      url,
    };

    return result;
  }

  /**
   * 判斷文章分類
   */
  determineCategory(content) {
    const contentLower = content.toLowerCase();
    const scores = {};

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      scores[category] = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword.toLowerCase(), 'gi');
        const matches = contentLower.match(regex);
        if (matches) {
          scores[category] += matches.length;
        }
      }
    }

    // 找出得分最高的分類
    let maxScore = 0;
    let bestCategory = '📌 其他';
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  /**
   * 提取標籤
   */
  extractTags(content) {
    const tags = new Set();
    const contentLower = content.toLowerCase();

    // 從所有關鍵字中找出出現的
    for (const keywords of Object.values(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          // 標準化標籤
          const tag = this.normalizeTag(keyword);
          if (tag) tags.add(tag);
        }
      }
    }

    return Array.from(tags).slice(0, 10);  // 最多10個標籤
  }

  /**
   * 標準化標籤
   */
  normalizeTag(keyword) {
    const tagMap = {
      'artificial intelligence': 'AI',
      '人工智慧': 'AI',
      'machine learning': 'ML',
      'blockchain': '區塊鏈',
      'stablecoin': '穩定幣',
      'cryptocurrency': '加密貨幣',
      'crypto': '加密貨幣',
      'real world asset': 'RWA',
      '真實世界資產': 'RWA',
      'tokenization': '代幣化',
      '金管會': '金管會',
      'fsc': '金管會',
    };

    const lower = keyword.toLowerCase();
    return tagMap[lower] || keyword;
  }

  /**
   * 提取標題（簡單版，實際使用時由外部提供）
   */
  extractTitle(content) {
    // 嘗試從內容開頭提取標題
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      return lines[0].replace(/^#+\s*/, '').trim().slice(0, 100);
    }
    return '未命名文章';
  }

  /**
   * 生成摘要（50字內的核心觀點）
   */
  generateSummary(content) {
    // 簡單版：取第一段非空內容
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length > 0) {
      const firstPara = paragraphs[0].trim();
      // 截取前100字，然後找到最後一個完整句子
      let summary = firstPara.slice(0, 150);
      const lastPeriod = Math.max(
        summary.lastIndexOf('。'),
        summary.lastIndexOf('！'),
        summary.lastIndexOf('？'),
        summary.lastIndexOf('. '),
      );
      if (lastPeriod > 50) {
        summary = summary.slice(0, lastPeriod + 1);
      }
      return summary;
    }
    return '';
  }

  /**
   * 提取關鍵重點（3-5個要點）
   */
  extractKeyPoints(content) {
    const points = [];
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 30);

    // 尋找包含關鍵信號詞的段落
    const signalWords = [
      '關鍵', '重要', '核心', '主要', '首先', '其次', '最後',
      'key', 'important', 'main', 'crucial', 'significant',
      '結論', '總結', '發現', 'conclusion', 'finding'
    ];

    for (const para of paragraphs) {
      const paraLower = para.toLowerCase();
      for (const signal of signalWords) {
        if (paraLower.includes(signal.toLowerCase())) {
          // 提取這個段落的核心句子
          const sentences = para.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
          if (sentences.length > 0) {
            const point = sentences[0].trim().slice(0, 100);
            if (point && !points.includes(point)) {
              points.push(point);
            }
          }
          break;
        }
      }
      if (points.length >= 5) break;
    }

    // 如果找不到足夠的重點，從段落開頭提取
    if (points.length < 3) {
      for (const para of paragraphs.slice(0, 5)) {
        const sentences = para.split(/[。！？.!?]/).filter(s => s.trim().length > 20);
        if (sentences.length > 0) {
          const point = sentences[0].trim().slice(0, 100);
          if (point && !points.includes(point)) {
            points.push(point);
          }
        }
        if (points.length >= 5) break;
      }
    }

    return points.slice(0, 5);
  }

  /**
   * 提取引用
   */
  extractQuotes(content) {
    const quotes = [];

    for (const pattern of this.quotePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 200) {
          quotes.push({
            text: match[1].trim(),
            source: match[2]?.trim() || '未知'
          });
        }
      }
    }

    return quotes.slice(0, 3);  // 最多3個引用
  }

  /**
   * 提取數據點
   */
  extractDataPoints(content) {
    const dataPoints = [];
    const sentences = content.split(/[。！？.!?]/);

    for (const sentence of sentences) {
      // 檢查是否包含數字和單位
      if (/\d+/.test(sentence) && 
          (/%|億|萬|兆|billion|million|trillion|\$|美元|dollar/i.test(sentence))) {
        const point = sentence.trim().slice(0, 100);
        if (point.length > 15 && !dataPoints.includes(point)) {
          dataPoints.push(point);
        }
      }
      if (dataPoints.length >= 5) break;
    }

    return dataPoints;
  }

  /**
   * 提取實體（人物、組織）
   */
  extractEntities(content) {
    const entities = {
      people: [],
      organizations: [],
      concepts: []
    };

    // 常見組織識別
    const orgPatterns = [
      /(?:臺灣|台灣)?銀行/g,
      /金管會|證期局|央行/g,
      /(?:Apple|Google|Microsoft|Amazon|Meta|OpenAI|Anthropic)/gi,
    ];

    for (const pattern of orgPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        entities.organizations.push(...matches);
      }
    }

    entities.organizations = [...new Set(entities.organizations)].slice(0, 5);

    return entities;
  }
}

module.exports = { ArticleAnalyzer };
