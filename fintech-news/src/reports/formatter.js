/**
 * 新聞報告格式化
 */

const { TOPICS } = require('../config');

/**
 * 格式化新聞列表
 * @param {Object[]} items - 新聞項目
 * @param {Object} options - 選項
 * @returns {string} 格式化的報告
 */
function formatNewsList(items, options = {}) {
  const { title = '📰 Fintech 新聞', maxItems = 10, showTopic = true } = options;

  if (!items || items.length === 0) {
    return `${title}\n\n（暫無新聞）`;
  }

  const displayItems = items.slice(0, maxItems);
  
  let output = `${title}\n\n`;

  for (const item of displayItems) {
    const topicConfig = TOPICS[item.topic];
    const topicName = showTopic && topicConfig ? `[${topicConfig.name}] ` : '';
    
    output += `• ${topicName}**${item.title}**\n`;
    
    if (item.snippet) {
      // 截短摘要
      const snippet = item.snippet.length > 100 
        ? item.snippet.slice(0, 100) + '...'
        : item.snippet;
      output += `  ${snippet}\n`;
    }
    
    output += `  🔗 ${item.url}\n\n`;
  }

  if (items.length > maxItems) {
    output += `\n_還有 ${items.length - maxItems} 則新聞_`;
  }

  return output.trim();
}

/**
 * 按主題分組格式化
 */
function formatByTopic(items, options = {}) {
  const { maxPerTopic = 3 } = options;

  // 按主題分組
  const byTopic = {};
  for (const item of items) {
    if (!byTopic[item.topic]) {
      byTopic[item.topic] = [];
    }
    byTopic[item.topic].push(item);
  }

  let output = '📰 **Fintech 新聞摘要**\n';
  const now = new Date();
  output += `_${now.toLocaleDateString('zh-TW')}_\n\n`;

  // 按優先級排序主題
  const sortedTopics = Object.keys(byTopic).sort((a, b) => {
    const priorityA = TOPICS[a]?.priority || 0;
    const priorityB = TOPICS[b]?.priority || 0;
    return priorityB - priorityA;
  });

  for (const topic of sortedTopics) {
    const topicConfig = TOPICS[topic];
    const topicItems = byTopic[topic].slice(0, maxPerTopic);

    output += `**${topicConfig?.name || topic}** `;
    output += '⭐'.repeat(topicConfig?.priority || 1);
    output += '\n';

    for (const item of topicItems) {
      output += `• ${item.title}\n`;
      output += `  ${item.url}\n`;
    }

    output += '\n';
  }

  return output.trim();
}

/**
 * 生成簡短摘要（適合 Telegram）
 */
function formatBrief(items, limit = 5) {
  if (!items || items.length === 0) {
    return '📰 今日暫無重要 Fintech 新聞';
  }

  let output = '📰 **Fintech 快訊**\n\n';

  for (const item of items.slice(0, limit)) {
    output += `• ${item.title}\n`;
  }

  if (items.length > limit) {
    output += `\n_+${items.length - limit} 則更多_`;
  }

  return output;
}

/**
 * 格式化單則新聞詳情
 */
function formatNewsDetail(item) {
  const topicConfig = TOPICS[item.topic];

  let output = `📰 **${item.title}**\n\n`;
  
  if (topicConfig) {
    output += `🏷️ 主題: ${topicConfig.name}\n`;
  }
  
  if (item.source) {
    output += `📌 來源: ${item.source}\n`;
  }
  
  output += `🔗 連結: ${item.url}\n\n`;
  
  if (item.snippet) {
    output += `> ${item.snippet}`;
  }

  return output;
}

/**
 * 生成每日新聞郵件格式
 */
function formatDailyDigest(items) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  let digest = `# Fintech 每日快報\n\n`;
  digest += `📅 ${dateStr}\n\n`;
  digest += `---\n\n`;

  if (!items || items.length === 0) {
    digest += '今日暫無重要新聞更新。\n';
    return digest;
  }

  // 按主題分類
  const byTopic = {};
  for (const item of items) {
    if (!byTopic[item.topic]) {
      byTopic[item.topic] = [];
    }
    byTopic[item.topic].push(item);
  }

  for (const [topic, topicItems] of Object.entries(byTopic)) {
    const config = TOPICS[topic];
    digest += `## ${config?.name || topic}\n\n`;

    for (const item of topicItems) {
      digest += `### ${item.title}\n\n`;
      if (item.snippet) {
        digest += `${item.snippet}\n\n`;
      }
      digest += `[閱讀全文](${item.url})\n\n`;
    }
  }

  digest += `---\n\n`;
  digest += `_此報告由 Fintech 新聞追蹤器自動生成_`;

  return digest;
}

module.exports = {
  formatNewsList,
  formatByTopic,
  formatBrief,
  formatNewsDetail,
  formatDailyDigest,
};
