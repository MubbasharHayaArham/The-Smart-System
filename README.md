# The Smart System — Multi-Symbol Price Webhook

## ✅ TradingView Alert Setup

- **Chart timeframe:** `1Min`
- **Alert condition:** `Once Per Bar`
- **Alert message:** Leave the "message" field **empty**
- **Webhook URL:**
  ```
  https://the-smart-system.vercel.app/api/qqq-price-hook
  ```

## 📜 Pine Script (v5)

```pinescript
//@version=5
indicator("Multi-Symbol Price Webhook", overlay=true)

// Function to extract extended session close
getExtendedClose(sym) =>
    is_extended = time_close > timestamp("2025-07-18 16:00")  // Market closed at 4PM
    close_val = request.security(sym, "1", close)
    close_val

// === Symbols (1-min close for now) ===
qqq = getExtendedClose("QQQ")
spy = getExtendedClose("SPY")
vix = getExtendedClose("VIX")
dxy = getExtendedClose("DXY")
nq  = getExtendedClose("NAS100USD")

// === JSON message ===
alert_msg = '{"symbol":"Multi","livePrices":{' +
            '"QQQ":' + str.tostring(qqq) + ',' +
            '"SPY":' + str.tostring(spy) + ',' +
            '"VIX":' + str.tostring(vix) + ',' +
            '"DXY":' + str.tostring(dxy) + ',' +
            '"NQ":'  + str.tostring(nq)  + '}}'

// === Alert firing ===
alert(alert_msg, freq=alert.freq_once_per_bar)
```
