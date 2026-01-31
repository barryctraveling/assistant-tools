/**
 * 系統狀態 - 助手整合
 */

const {
  checkServices,
  checkProjects,
  generateStatusReport,
} = require('./index');

/**
 * 獲取系統狀態報告
 */
async function getStatusReport() {
  return await generateStatusReport();
}

/**
 * 檢查服務狀態
 */
async function getServices() {
  return await checkServices();
}

/**
 * 檢查專案狀態
 */
async function getProjects() {
  return await checkProjects();
}

/**
 * 快速健康檢查
 */
async function healthCheck() {
  const services = await checkServices();
  const allOk = services.every(s => s.status !== 'not running' && s.status !== 'not installed');
  
  if (allOk) {
    return '✅ 所有系統正常運作';
  } else {
    const issues = services.filter(s => s.status === 'not running' || s.status === 'not installed');
    return `⚠️ 發現問題:\n${issues.map(s => `• ${s.name}: ${s.status}`).join('\n')}`;
  }
}

module.exports = {
  getStatusReport,
  getServices,
  getProjects,
  healthCheck,
};
