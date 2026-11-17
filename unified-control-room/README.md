# Unified Traffic Control Room (5 Websites)

Live URL: **[https://control.blueseasfishing.com](https://control.blueseasfishing.com)**  
Default Security PIN: **`2026`**

---

## 📱 How to Use on Your Phone (iOS / Android)

The dashboard is built as a **Progressive Web App (PWA)**:
1. Open **[https://control.blueseasfishing.com](https://control.blueseasfishing.com)** in Safari (iOS) or Chrome (Android).
2. Enter the PIN `2026` to unlock.
3. Tap the **Share / Options** button:
   - **iPhone (Safari):** Tap **Share** $\rightarrow$ **"Add to Home Screen"**.
   - **Android (Chrome):** Tap **⋮ (Three dots)** $\rightarrow$ **"Install app"** or **"Add to Home screen"**.
4. An app icon named **Control Room** will appear on your phone home screen. It will open full-screen like a native mobile app.

---

## 🌐 Covered Websites

| Website | Tracking ID |
| :--- | :--- |
| **blueseasfishing.com** | `G-5E6LJG6EQE` |
| **gardenwithserge.com** | `G-52BQHQ8HL1` |
| **timerhaven.com** | `G-R1F6Y45MW2` |
| **nexuscut.io** | `G-1BZZ7X8ZH8` |
| **newgiftsandgadgets.com** | `G-VTLRDD8KP0` |

---

## ⚡ Key Features

1. **Portfolio Overview:** Combined Daily, Weekly, Monthly, and All-Time totals across all 5 sites.
2. **Site Drilldown:** Tap any website card or the top carousel tabs to isolate individual site analytics.
3. **Interactive Charts:** Visual trend comparison rendered with Chart.js.
4. **Refresh Button:** Tap **"Refresh Data"** in the top header to trigger an instant data reload with spinning status.
5. **Breakdown Cards:** Top visited pages, referrer channels (Google, Social, Direct), and mobile/desktop device percentages.

---

## 🔄 Deployment & Synchronization

- **Deploy updates:** Run `python unified-control-room/deploy.py`
- **Manual Data Sync:** Run `python unified-control-room/sync-ga4.py`
