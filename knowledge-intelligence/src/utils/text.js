/**
 * 文字處理工具
 * 提供文章分析所需的各種文字處理功能
 */

// 中文停用詞
const CHINESE_STOPWORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一個',
  '上', '也', '很', '到', '說', '要', '去', '你', '會', '著', '沒有', '看', '好',
  '自己', '這', '那', '什麼', '他', '她', '它', '們', '這個', '那個', '如果',
  '但是', '因為', '所以', '可以', '沒', '把', '讓', '被', '與', '或', '及',
  '之', '等', '能', '將', '從', '為', '對', '而', '以', '其', '中', '更',
]);

// 英文停用詞
const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have',
  'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'they',
  'them', 'their', 'he', 'she', 'him', 'her', 'his', 'we', 'us', 'our', 'you',
  'your', 'i', 'me', 'my', 'not', 'no', 'if', 'then', 'than', 'so', 'such',
  'when', 'where', 'what', 'which', 'who', 'whom', 'how', 'why', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'any', 'only', 'own',
  'same', 'just', 'also', 'very', 'even', 'still', 'about', 'after', 'before',
]);

/**
 * 判斷是否為中文字符
 */
function isChinese(char) {
  const code = char.charCodeAt(0);
  return code >= 0x4E00 && code <= 0x9FFF;
}

/**
 * 分詞（支援中英文混合）
 */
function tokenize(text) {
  if (!text) return [];
  
  const tokens = [];
  let currentToken = '';
  let currentType = null; // 'chinese', 'english', 'number'
  
  for (const char of text.toLowerCase()) {
    if (isChinese(char)) {
      // 中文：每個字都是獨立的 token
      if (currentToken && currentType !== 'chinese') {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
      currentType = 'chinese';
      currentToken = '';
    } else if (/[a-z]/.test(char)) {
      // 英文字母
      if (currentType !== 'english' && currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      currentToken += char;
      currentType = 'english';
    } else if (/[0-9]/.test(char)) {
      // 數字
      if (currentType !== 'number' && currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      currentToken += char;
      currentType = 'number';
    } else {
      // 其他字符（空白、標點等）
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      currentType = null;
    }
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens;
}

/**
 * 移除停用詞
 */
function removeStopwords(tokens) {
  return tokens.filter(token => {
    if (token.length === 1 && isChinese(token.charAt(0))) {
      return !CHINESE_STOPWORDS.has(token);
    }
    return !ENGLISH_STOPWORDS.has(token) && token.length > 1;
  });
}

/**
 * 提取 N-grams
 */
function extractNgrams(tokens, n = 2) {
  const ngrams = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(''));
  }
  return ngrams;
}

/**
 * 計算詞頻
 */
function termFrequency(tokens) {
  const freq = {};
  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1;
  }
  return freq;
}

/**
 * 文字預處理管道
 */
function preprocess(text) {
  const tokens = tokenize(text);
  const filtered = removeStopwords(tokens);
  
  // 加入 bigrams 增加語意資訊
  const bigrams = extractNgrams(filtered, 2);
  
  return {
    tokens: filtered,
    bigrams,
    all: [...filtered, ...bigrams],
  };
}

/**
 * 計算文字相似度（基於 Jaccard）
 */
function jaccardSimilarity(set1, set2) {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * 計算餘弦相似度
 */
function cosineSimilarity(vec1, vec2) {
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
 * 提取關鍵句子
 */
function extractKeySentences(text, topN = 3) {
  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) return [];
  
  // 計算每個句子的重要性分數
  const docTokens = new Set(preprocess(text).tokens);
  
  const scored = sentences.map(sentence => {
    const sentTokens = new Set(preprocess(sentence).tokens);
    const overlap = [...sentTokens].filter(t => docTokens.has(t)).length;
    const score = overlap / Math.sqrt(sentTokens.size);
    return { sentence: sentence.trim(), score };
  });
  
  // 排序並返回前 N 個
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.sentence);
}

/**
 * 提取關鍵詞
 */
function extractKeywords(text, topN = 10) {
  const { tokens } = preprocess(text);
  const freq = termFrequency(tokens);
  
  return Object.entries(freq)
    .filter(([token]) => token.length >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([token, count]) => ({ token, count }));
}

module.exports = {
  tokenize,
  removeStopwords,
  extractNgrams,
  termFrequency,
  preprocess,
  jaccardSimilarity,
  cosineSimilarity,
  extractKeySentences,
  extractKeywords,
  isChinese,
  CHINESE_STOPWORDS,
  ENGLISH_STOPWORDS,
};
