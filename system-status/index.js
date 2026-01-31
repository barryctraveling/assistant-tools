#!/usr/bin/env node

/**
 * 系統狀態監控
 * 檢查各種服務和工具的狀態
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * 檢查命令是否可用
 */
async function checkCommand(cmd) {
  try {
    await execAsync(`which ${cmd}`);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 檢查服務狀態
 */
async function checkServices() {
  const services = [];

  // OpenClaw Gateway
  try {
    const { stdout } = await execAsync('ps aux | grep openclaw-gateway | grep -v grep');
    services.push({ name: 'OpenClaw Gateway', status: 'running', emoji: '✅' });
  } catch (e) {
    services.push({ name: 'OpenClaw Gateway', status: 'not running', emoji: '❌' });
  }

  // gog CLI
  if (await checkCommand('gog')) {
    services.push({ name: 'gog CLI', status: 'installed', emoji: '✅' });
  } else {
    services.push({ name: 'gog CLI', status: 'not installed', emoji: '❌' });
  }

  // Node.js
  try {
    const { stdout } = await execAsync('node --version');
    services.push({ name: 'Node.js', status: stdout.trim(), emoji: '✅' });
  } catch (e) {
    services.push({ name: 'Node.js', status: 'not available', emoji: '❌' });
  }

  return services;
}

/**
 * 檢查專案狀態
 */
async function checkProjects() {
  const projectsDir = path.join(__dirname, '..');
  const projects = [
    'investment-monitor',
    'stablecoin-tracker',
    'rwa-tracker',
    'morning-briefing',
    'fintech-news',
    'taiwan-fintech',
  ];

  const status = [];

  for (const project of projects) {
    const projectPath = path.join(projectsDir, project);
    const indexPath = path.join(projectPath, 'src/index.js');
    const integrationPath = path.join(projectPath, 'assistant-integration.js');

    const hasIndex = require('fs').existsSync(indexPath);
    const hasIntegration = require('fs').existsSync(integrationPath);

    status.push({
      name: project,
      hasIndex,
      hasIntegration,
      emoji: hasIndex ? '✅' : '❌',
    });
  }

  return status;
}

/**
 * 生成狀態報告
 */
async function generateStatusReport() {
  let report = '🔧 **系統狀態報告**\n\n';

  // 時間
  report += `⏰ ${new Date().toLocaleString('zh-TW')}\n\n`;

  // 服務狀態
  report += '**服務狀態**\n';
  const services = await checkServices();
  for (const s of services) {
    report += `${s.emoji} ${s.name}: ${s.status}\n`;
  }
  report += '\n';

  // 專案狀態
  report += '**專案狀態**\n';
  const projects = await checkProjects();
  for (const p of projects) {
    const integration = p.hasIntegration ? '(整合)' : '';
    report += `${p.emoji} ${p.name} ${integration}\n`;
  }

  return report;
}

// CLI
async function main() {
  console.log(await generateStatusReport());
}

if (require.main === module) {
  main().catch(e => console.error('Error:', e.message));
}

module.exports = {
  checkServices,
  checkProjects,
  generateStatusReport,
};
