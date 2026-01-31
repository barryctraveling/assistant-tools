# 投資監控系統 📈

Barry 的個人投資組合監控工具。

## 功能

### 📊 即時報價
```bash
node src/index.js quote ONDS TSLA
```

### 🔔 價格警報
```bash
# 設定警報
node src/index.js alert add ONDS --above 5.00 --below 2.00
node src/index.js alert add TSLA --above 450 --below 350

# 查看警報
node src/index.js alert list

# 檢查觸發
node src/index.js alert check
```

### 📰 新聞追蹤
```bash
node src/index.js news ONDS TSLA
```

### 📋 投資組合
```bash
# 設定持倉
node src/index.js portfolio set ONDS 1000 --cost 3.50
node src/index.js portfolio set TSLA 10 --cost 250.00

# 查看組合
node src/index.js portfolio view

# 績效報告
node src/index.js portfolio report
```

### 📅 定期報告
```bash
# 每日摘要
node src/index.js daily

# 週報
node src/index.js weekly
```

## 資料來源

- **股價**: Yahoo Finance (免費)
- **新聞**: 多來源聚合

## 持倉資訊

| 股票 | 說明 |
|------|------|
| ONDS | Ondas Holdings - 無線/無人機技術 |
| TSLA | Tesla - 電動車/能源 |

## 整合

- 可透過 Telegram 發送警報
- 可設定每日早晨報告
