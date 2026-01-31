/**
 * 價格警報管理
 */

const { ALERTS_FILE, readJSON, writeJSON, formatCurrency } = require('../utils/config');
const { fetchQuotes } = require('../market/quotes');

/**
 * 獲取所有警報
 */
function getAlerts() {
  return readJSON(ALERTS_FILE, { alerts: [] }).alerts;
}

/**
 * 儲存警報
 */
function saveAlerts(alerts) {
  writeJSON(ALERTS_FILE, { alerts, updatedAt: new Date().toISOString() });
}

/**
 * 新增警報
 * @param {string} symbol - 股票代碼
 * @param {Object} options - 選項
 * @param {number} options.above - 上限價格
 * @param {number} options.below - 下限價格
 * @param {string} options.note - 備註
 */
function addAlert(symbol, options = {}) {
  const alerts = getAlerts();
  
  const alert = {
    id: `alert_${Date.now()}`,
    symbol: symbol.toUpperCase(),
    above: options.above || null,
    below: options.below || null,
    note: options.note || '',
    enabled: true,
    triggered: [],
    createdAt: new Date().toISOString(),
  };

  alerts.push(alert);
  saveAlerts(alerts);
  
  return alert;
}

/**
 * 移除警報
 */
function removeAlert(alertId) {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  
  if (index === -1) {
    return false;
  }
  
  alerts.splice(index, 1);
  saveAlerts(alerts);
  return true;
}

/**
 * 啟用/停用警報
 */
function toggleAlert(alertId, enabled) {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === alertId);
  
  if (!alert) {
    return false;
  }
  
  alert.enabled = enabled;
  saveAlerts(alerts);
  return true;
}

/**
 * 檢查警報觸發
 * @returns {Promise<Object[]>} 觸發的警報列表
 */
async function checkAlerts() {
  const alerts = getAlerts();
  const enabledAlerts = alerts.filter(a => a.enabled);
  
  if (enabledAlerts.length === 0) {
    return [];
  }

  // 獲取所有需要檢查的股票報價
  const symbols = [...new Set(enabledAlerts.map(a => a.symbol))];
  const quotes = await fetchQuotes(symbols);
  
  const triggered = [];
  const now = new Date().toISOString();

  for (const alert of enabledAlerts) {
    const quote = quotes[alert.symbol];
    
    if (!quote || quote.error) {
      continue;
    }

    const price = quote.price;
    let triggerType = null;
    let triggerPrice = null;

    // 檢查上限
    if (alert.above && price >= alert.above) {
      triggerType = 'above';
      triggerPrice = alert.above;
    }
    
    // 檢查下限
    if (alert.below && price <= alert.below) {
      triggerType = 'below';
      triggerPrice = alert.below;
    }

    if (triggerType) {
      // 檢查最近是否已觸發過（1小時內不重複）
      const recentTrigger = alert.triggered.find(t => {
        const triggerTime = new Date(t.time).getTime();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return t.type === triggerType && triggerTime > oneHourAgo;
      });

      if (!recentTrigger) {
        const triggerInfo = {
          type: triggerType,
          targetPrice: triggerPrice,
          actualPrice: price,
          time: now,
        };

        // 記錄觸發
        alert.triggered.push(triggerInfo);
        
        triggered.push({
          alert,
          quote,
          trigger: triggerInfo,
        });
      }
    }
  }

  // 儲存更新的警報
  saveAlerts(alerts);

  return triggered;
}

/**
 * 格式化警報列表
 */
function formatAlertsList(alerts) {
  if (alerts.length === 0) {
    return '📭 沒有設定任何警報';
  }

  let output = '🔔 **價格警報列表**\n\n';

  for (const alert of alerts) {
    const status = alert.enabled ? '✅' : '⏸️';
    output += `${status} **${alert.symbol}**\n`;
    
    if (alert.above) {
      output += `   📈 高於 ${formatCurrency(alert.above)}\n`;
    }
    if (alert.below) {
      output += `   📉 低於 ${formatCurrency(alert.below)}\n`;
    }
    if (alert.note) {
      output += `   💬 ${alert.note}\n`;
    }
    output += `   🆔 ${alert.id}\n\n`;
  }

  return output.trim();
}

/**
 * 格式化觸發通知
 */
function formatTriggeredAlert(item) {
  const { alert, quote, trigger } = item;
  const emoji = trigger.type === 'above' ? '🚀' : '⚠️';
  const direction = trigger.type === 'above' ? '突破上限' : '跌破下限';

  let msg = `${emoji} **價格警報**\n\n`;
  msg += `**${alert.symbol}** ${direction}！\n`;
  msg += `目標價: ${formatCurrency(trigger.targetPrice)}\n`;
  msg += `現價: ${formatCurrency(trigger.actualPrice)}\n`;
  
  if (alert.note) {
    msg += `備註: ${alert.note}\n`;
  }

  return msg;
}

module.exports = {
  getAlerts,
  addAlert,
  removeAlert,
  toggleAlert,
  checkAlerts,
  formatAlertsList,
  formatTriggeredAlert,
};
