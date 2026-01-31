/**
 * Notion API 整合模組
 * 負責將文章內容寫入 Notion
 */

const NOTION_VERSION = '2022-06-28';

class NotionClient {
  constructor(token, databaseId) {
    this.token = token;
    this.databaseId = databaseId;
    this.baseUrl = 'https://api.notion.com/v1';
  }

  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${data.message || JSON.stringify(data)}`);
    }
    
    return data;
  }

  /**
   * 建立文章頁面
   */
  async createArticlePage(article) {
    const { 
      title, 
      category, 
      tags = [], 
      summary,
      keyPoints = [],
      quotes = [],
      dataPoints = [],
      relatedArticles = [],
      url,
      author,
      publishDate,
    } = article;

    // 建立頁面內容區塊
    const children = [];

    // 一句話總結
    if (summary) {
      children.push(
        this.createHeading2('📌 一句話總結'),
        this.createCallout(summary, '💡')
      );
    }

    // 關鍵重點
    if (keyPoints.length > 0) {
      children.push(this.createHeading2('🎯 關鍵重點'));
      keyPoints.forEach(point => {
        children.push(this.createBulletItem(point));
      });
    }

    // 重要引用
    if (quotes.length > 0) {
      children.push(this.createHeading2('💬 重要引用'));
      quotes.forEach(quote => {
        children.push(this.createQuote(quote.text, quote.source));
      });
    }

    // 關鍵數據
    if (dataPoints.length > 0) {
      children.push(this.createHeading2('📊 關鍵數據'));
      dataPoints.forEach(data => {
        children.push(this.createBulletItem(data));
      });
    }

    // 相關文章
    if (relatedArticles.length > 0) {
      children.push(this.createHeading2('🔗 相關文章'));
      relatedArticles.forEach(related => {
        children.push(this.createBulletItem(related));
      });
    }

    // 我的筆記（預留空間）
    children.push(
      this.createHeading2('💡 我的筆記'),
      this.createParagraph('（在這裡加入你的想法...）', 'gray')
    );

    // 分隔線 + 原文連結
    children.push(
      this.createDivider(),
      this.createParagraph(`🔗 原文連結：`, null, url)
    );

    // 建立頁面
    const pageData = {
      parent: { database_id: this.databaseId },
      properties: {
        '標題': {
          title: [{ text: { content: title } }]
        },
        '分類': {
          select: { name: category }
        },
      },
      children,
    };

    return await this.request('/pages', 'POST', pageData);
  }

  // === 區塊建立輔助函數 ===

  createHeading2(text) {
    return {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: text } }]
      }
    };
  }

  createParagraph(text, color = null, linkUrl = null) {
    const richText = linkUrl 
      ? [
          { text: { content: text } },
          { text: { content: linkUrl, link: { url: linkUrl } } }
        ]
      : [{ text: { content: text } }];
    
    if (color) {
      richText[0].annotations = { color };
    }

    return {
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: richText, color: color || 'default' }
    };
  }

  createBulletItem(text) {
    return {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ text: { content: text } }]
      }
    };
  }

  createCallout(text, emoji = '💡') {
    return {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji },
        rich_text: [{ text: { content: text } }]
      }
    };
  }

  createQuote(text, source = null) {
    const content = source ? `"${text}" — ${source}` : `"${text}"`;
    return {
      object: 'block',
      type: 'quote',
      quote: {
        rich_text: [{ text: { content } }]
      }
    };
  }

  createDivider() {
    return {
      object: 'block',
      type: 'divider',
      divider: {}
    };
  }

  /**
   * 查詢知識庫中的相關文章
   */
  async queryRelatedArticles(keywords, limit = 5) {
    // TODO: 實作基於關鍵字的搜尋
    return [];
  }
}

module.exports = { NotionClient };
