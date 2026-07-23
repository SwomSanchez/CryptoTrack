# 🚀 CryptoTrack

**CryptoTrack** is a premium, modern, and highly responsive Cryptocurrency Tracking Dashboard built entirely with Vanilla HTML, CSS, and JavaScript. It leverages the CoinGecko API to provide real-time market data, historical analytics, dynamic charts, and a robust personal portfolio manager.

---

## ✨ Features

- 🎨 **Premium Glassmorphism UI**: A stunning dark mode design featuring vibrant background orbs, frosted glass blur effects, and smooth micro-animations.
- 🎬 **Cinematic Splash Screen**: A highly polished, animated loading screen that warmly welcomes users while essential data is fetched in the background.
- 💼 **Interactive Portfolio & Analytics**: Track your personal cryptocurrency holdings. Not only does it show current values with a sleek Doughnut chart, but it also calculates your **Profit/Loss (PnL)** over customizable timeframes (**1D, 7D, 1M, 3M, 1Y**) displayed on a unified historical line chart.
- 🔔 **Custom Toast Notifications**: Elegant, non-intrusive popup notifications for user actions (adding/removing assets, API errors, favorites) fully integrated with the glassmorphism theme, replacing standard browser alerts.
- 🔍 **Google-Like Autocomplete**: Lightning-fast, zero-latency search dropdowns complete with coin logos, names, and tickers. Powered by a smart 12-hour local caching system.
- 🛡️ **Advanced API Rate Limit Protection**: Intelligent request batching, built-in delays, and strict `localStorage` caching mechanisms to aggressively prevent CoinGecko `429 Too Many Requests` bans.
- 📊 **Dynamic Market Charts**: Visual price tracking using Chart.js with responsive gradients.
- ⚖️ **Coin Comparison**: Compare two different cryptocurrencies side-by-side with overlapping multi-axis comparison charts.
- ⭐️ **Favorites**: Save your favorite coins to local storage for quick access.
- 📱 **Mobile Responsive**: Fully optimized for mobile devices with horizontally scrollable native-feeling tabs.

---

## 🛠️ Tech Stack

- **HTML5** & **CSS3** (Custom Grid/Flexbox, CSS Animations, Glassmorphism, Responsive UI)
- **Vanilla JavaScript** (ES6+, Async/Await, DOM Manipulation, Promise Mapping)
- **Chart.js** (For historical line charts, comparison charts, and portfolio doughnut charts)
- **CoinGecko API v3** (Real-time crypto market data)
- **LocalStorage API** (Caching API responses and persisting user state)

---

## 🚀 Getting Started

No complex build tools or `npm install` required! It's a completely static Vanilla web app.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SwomSanchez/CryptoTrack.git
   ```
2. **Open the project:**
   Simply double-click the `index.html` file to open it in any modern web browser (Chrome, Firefox, Safari, Edge).
   *Alternatively, you can run it via a Live Server extension in VS Code.*

---

## 💡 How it works (API Rate Limit Protection)

Public APIs like CoinGecko heavily restrict request volumes. CryptoTrack solves this via:
1. **Initial Cache:** Fetches the top 250 coins by market cap once and caches them in the browser's `localStorage` for **12 hours**. All search and autocomplete queries are instantly filtered from this local cache without hitting the API.
2. **Batching & Delays:** When generating the historical portfolio chart, the app iterates through your holdings and sequentially fetches historical prices with controlled `200ms` delays to prevent triggering Cloudflare blocks.
3. **Chart Caching:** Historical chart data is temporarily cached in memory for 1 hour to prevent redundant fetch requests if the user toggles back and forth between timeframes.

---

## 📸 Screenshots

*(Add your screenshots here)*

| Trending | Search |
|:---:|:---:|
| ![Trending](https://github.com/user-attachments/assets/823469f2-058c-489b-8401-02edcf83e13c) | ![Search](https://github.com/user-attachments/assets/8be690d5-a07f-46a0-97e6-762b57f0360b) |
| **Compare Tool** | **Favorites List** |
| ![Compare](https://github.com/user-attachments/assets/955ef394-9342-4546-9c4b-a35a2870583a) | ![Favorites](https://github.com/user-attachments/assets/f6a835cb-ebbe-4a46-bede-5ec3d0e4f716) |

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is open-source and available under the MIT License.

---
<p align="center">
  <b>Developed with ❤️ by <a href="https://github.com/SwomSanchez">Swom Sânchez</a></b>
</p>
