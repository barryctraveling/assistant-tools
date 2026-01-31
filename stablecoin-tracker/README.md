# 穩定幣追蹤器 💵

追蹤主要穩定幣的市值、發行量和相關資訊。

## 追蹤的穩定幣

| 幣種 | 發行商 | 類型 |
|------|--------|------|
| USDT | Tether | 法幣抵押 |
| USDC | Circle | 法幣抵押 |
| DAI | MakerDAO | 加密抵押 |
| TUSD | TrueUSD | 法幣抵押 |
| BUSD | Paxos | 法幣抵押（停止發行）|
| FDUSD | First Digital | 法幣抵押 |

## 功能

### 市值追蹤
```bash
node src/index.js mcap           # 市值排名
node src/index.js mcap USDT      # 單一幣種
```

### 供應量變化
```bash
node src/index.js supply         # 供應量變化
```

### 每日摘要
```bash
node src/index.js daily          # 每日報告
```

## 資料來源

- CoinGecko API（免費）
- DefiLlama（備用）

## 用途

- 追蹤穩定幣市場動態
- 監控發行量變化
- 為 Barry 的 RWA/穩定幣工作提供數據支援
