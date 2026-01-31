# Fintech 新聞追蹤器 📰

專門追蹤 RWA、穩定幣、金融科技相關新聞。

## 追蹤主題

| 主題 | 關鍵字 | 優先級 |
|------|--------|--------|
| RWA | real world assets, tokenization, 資產代幣化 | ⭐⭐⭐ |
| 穩定幣 | stablecoin, USDT, USDC, 穩定幣監管 | ⭐⭐⭐ |
| CBDC | central bank digital currency, 數位央行貨幣 | ⭐⭐ |
| DeFi | decentralized finance, 去中心化金融 | ⭐⭐ |
| 台灣金融 | 金管會, 台灣銀行, 台灣 Fintech | ⭐⭐⭐ |

## 功能

### 新聞搜尋
```bash
node src/index.js search "RWA tokenization"
node src/index.js search "穩定幣監管" --lang zh
```

### 主題追蹤
```bash
node src/index.js track        # 追蹤所有主題
node src/index.js track rwa    # 只追蹤 RWA
```

### 每日摘要
```bash
node src/index.js daily        # 生成每日新聞摘要
```

## 資料來源

- Web 搜尋（Brave Search API）
- RSS feeds（待實作）

## 整合

助手可以：
- 每日早晨發送相關新聞
- 有重大新聞時主動通知
- 回答「最近有什麼 RWA 新聞？」
