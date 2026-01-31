/**
 * 向量存儲模組
 * 負責向量資料的持久化和載入
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'vectors');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

class VectorStore {
  constructor() {
    this.index = {
      version: '1.0',
      createdAt: null,
      updatedAt: null,
      documents: {},
    };
    this.loaded = false;
  }

  /**
   * 確保資料目錄存在
   */
  async ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  /**
   * 載入索引
   */
  async load() {
    try {
      await this.ensureDataDir();
      const data = await fs.readFile(INDEX_FILE, 'utf-8');
      this.index = JSON.parse(data);
      this.loaded = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 檔案不存在，使用預設值
        this.index.createdAt = new Date().toISOString();
        this.loaded = true;
      } else {
        throw error;
      }
    }
  }

  /**
   * 儲存索引
   */
  async save() {
    await this.ensureDataDir();
    this.index.updatedAt = new Date().toISOString();
    await fs.writeFile(INDEX_FILE, JSON.stringify(this.index, null, 2));
  }

  /**
   * 新增文檔向量
   */
  async addDocument(id, vector, metadata = {}) {
    if (!this.loaded) await this.load();
    
    this.index.documents[id] = {
      id,
      vector,
      metadata,
      addedAt: new Date().toISOString(),
    };
    
    await this.save();
  }

  /**
   * 批次新增文檔
   */
  async addDocuments(documents) {
    if (!this.loaded) await this.load();
    
    const now = new Date().toISOString();
    for (const doc of documents) {
      this.index.documents[doc.id] = {
        id: doc.id,
        vector: doc.vector,
        metadata: doc.metadata || {},
        addedAt: now,
      };
    }
    
    await this.save();
  }

  /**
   * 取得文檔
   */
  getDocument(id) {
    return this.index.documents[id];
  }

  /**
   * 取得所有文檔
   */
  getAllDocuments() {
    return Object.values(this.index.documents);
  }

  /**
   * 刪除文檔
   */
  async removeDocument(id) {
    if (!this.loaded) await this.load();
    
    delete this.index.documents[id];
    await this.save();
  }

  /**
   * 檢查文檔是否存在
   */
  hasDocument(id) {
    return !!this.index.documents[id];
  }

  /**
   * 取得統計資訊
   */
  getStats() {
    const docs = Object.values(this.index.documents);
    return {
      totalDocuments: docs.length,
      createdAt: this.index.createdAt,
      updatedAt: this.index.updatedAt,
      oldestDocument: docs.length > 0 
        ? docs.reduce((min, d) => d.addedAt < min ? d.addedAt : min, docs[0].addedAt)
        : null,
      newestDocument: docs.length > 0
        ? docs.reduce((max, d) => d.addedAt > max ? d.addedAt : max, docs[0].addedAt)
        : null,
    };
  }

  /**
   * 清空所有資料
   */
  async clear() {
    this.index = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: null,
      documents: {},
    };
    await this.save();
  }
}

module.exports = { VectorStore };
