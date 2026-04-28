let chartInstance = null;
let compareChartInstance = null;
let portfolioChartInstance = null;
let portfolioHistoryChartInstance = null;
let currentPortfolioDays = 1;
let chartCache = {};
let currentCurrency = 'usd';
let currentCoinId = null;
let favorites = JSON.parse(localStorage.getItem('cryptoFavorites')) || [];
let portfolio = JSON.parse(localStorage.getItem('cryptoPortfolio')) || [];

if (!Array.isArray(favorites)) favorites = [];
if (!Array.isArray(portfolio)) portfolio = [];

let cachedCoins = [];

function showToast(title, message, type = 'error') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

async function fetchAndCacheCoins() {
    const cacheKey = 'cachedCoinListFull';
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
        cachedCoins = cachedData.coins;
    } else {
        try {
            const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1');
            const data = await res.json();
            
            cachedCoins = data.map(c => ({ id: c.id, name: c.name, symbol: c.symbol, image: c.image }));
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), coins: cachedCoins }));
        } catch (e) {
            console.error("Failed to fetch coin list for autocomplete", e);
            if (cachedData) cachedCoins = cachedData.coins;
        }
    }
}
fetchAndCacheCoins();

function setupAutocomplete(inputId, resultsId, onSelectCallback) {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsId);
    if (!input || !resultsContainer) return;

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        if (!query) {
            resultsContainer.style.display = 'none';
            return;
        }

        const filtered = cachedCoins.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.symbol.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query)
        ).slice(0, 10);

        if (filtered.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }

        resultsContainer.innerHTML = filtered.map(c => `
            <div class="autocomplete-item" data-id="${c.id}">
                <img src="${c.image}" alt="${c.name}">
                <span class="ac-name">${c.name}</span>
                <span class="ac-symbol">${c.symbol}</span>
            </div>
        `).join('');

        resultsContainer.style.display = 'flex';

        resultsContainer.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                input.value = item.getAttribute('data-id');
                resultsContainer.style.display = 'none';
                if (onSelectCallback) onSelectCallback();
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
    
    input.addEventListener('focus', () => {
        if (input.value.trim() && resultsContainer.innerHTML) {
            resultsContainer.style.display = 'flex';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupAutocomplete('searchInput', 'searchAutocomplete', searchCoin);
    setupAutocomplete('compareInput1', 'compare1Autocomplete');
    setupAutocomplete('compareInput2', 'compare2Autocomplete');
    setupAutocomplete('portfolioInput', 'portfolioAutocomplete');
});
// Initialize immediately if DOM already loaded
setupAutocomplete('searchInput', 'searchAutocomplete', searchCoin);
setupAutocomplete('compareInput1', 'compare1Autocomplete');
setupAutocomplete('compareInput2', 'compare2Autocomplete');
setupAutocomplete('portfolioInput', 'portfolioAutocomplete');

const currencySymbols = { usd: '$', eur: '€', try: '₺' };

function setCurrency(currency) {
    currentCurrency = currency;
    document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.currency-btn[onclick="setCurrency('${currency}')"]`).classList.add('active');
    
    const activeTab = document.querySelector('.tab-content:not(.hidden)').id;
    if (activeTab === 'tab-trending') loadTrending();
    if (activeTab === 'tab-compare') compareCoin();
    if (activeTab === 'tab-favorites') loadFavorites();
    if (activeTab === 'tab-portfolio') loadPortfolio();
    if (activeTab === 'tab-search' && document.getElementById('searchInput').value) searchCoin();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    event.target.classList.add('active');
    if (tab === 'trending') loadTrending();
    if (tab === 'favorites') loadFavorites();
    if (tab === 'portfolio') loadPortfolio();
}

async function searchCoin() {
    const input = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!input) return;

    const card = document.getElementById('coinCard');
    const error = document.getElementById('errorMsg');
    const loader = document.getElementById('loader');

    card.classList.add('hidden');
    error.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${input}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        currentCoinId = data.id;

        const sym = currencySymbols[currentCurrency];
        document.getElementById('coinImg').src = data.image.large;
        document.getElementById('coinName').textContent = data.name;
        document.getElementById('coinSymbol').textContent = data.symbol;
        document.getElementById('coinPrice').textContent = `${sym}${data.market_data.current_price[currentCurrency].toLocaleString()}`;

        const change = data.market_data.price_change_percentage_24h.toFixed(2);
        const changeEl = document.getElementById('coinChange');
        changeEl.textContent = `${change > 0 ? '+' : ''}${change}%`;
        changeEl.className = change >= 0 ? 'positive' : 'negative';

        document.getElementById('marketCap').textContent = `${sym}${(data.market_data.market_cap[currentCurrency] / 1e9).toFixed(2)}B`;
        document.getElementById('high24').textContent = `${sym}${data.market_data.high_24h[currentCurrency].toLocaleString()}`;
        document.getElementById('low24').textContent = `${sym}${data.market_data.low_24h[currentCurrency].toLocaleString()}`;
        document.getElementById('volume').textContent = `${sym}${(data.market_data.total_volume[currentCurrency] / 1e9).toFixed(2)}B`;

        const favBtn = document.getElementById('favBtn');
        favBtn.className = favorites.includes(data.id) ? 'fav-btn active' : 'fav-btn';
        favBtn.textContent = favorites.includes(data.id) ? '★' : '☆';

        await loadChart(data.id);
        loader.classList.add('hidden');
        card.classList.remove('hidden');
    } catch {
        loader.classList.add('hidden');
        showToast('Search Failed', 'Could not find the specified coin. Check the name or try again later.', 'error');
    }
}

async function loadChart(id) {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${currentCurrency}&days=7`);
    const data = await res.json();

    const labels = data.prices.map(p => {
        const d = new Date(p[0]);
        return `${d.getMonth()+1}/${d.getDate()}`;
    });
    const prices = data.prices.map(p => p[1]);

    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('priceChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: '#00f2fe',
                backgroundColor: 'rgba(0, 242, 254, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#a0aec0', maxTicksLimit: 7 }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                y: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            }
        }
    });
}

function toggleFavorite() {
    if (!currentCoinId) return;
    const btn = document.getElementById('favBtn');
    if (favorites.includes(currentCoinId)) {
        favorites = favorites.filter(f => f !== currentCoinId);
        btn.className = 'fav-btn';
        btn.textContent = '☆';
        showToast('Removed', 'Coin removed from your favorites.', 'warning');
    } else {
        favorites.push(currentCoinId);
        btn.className = 'fav-btn active';
        btn.textContent = '★';
        showToast('Added', 'Coin added to your favorites.', 'success');
    }
    localStorage.setItem('cryptoFavorites', JSON.stringify(favorites));
}

async function loadTrending() {
    const list = document.getElementById('trendingList');
    const loader = document.getElementById('trendingLoader');
    list.innerHTML = '';
    loader.classList.remove('hidden');

    try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currentCurrency}&order=market_cap_desc&per_page=10&page=1`);
        const data = await res.json();
        const sym = currencySymbols[currentCurrency];

        data.forEach((coin, i) => {
            const change = coin.price_change_percentage_24h?.toFixed(2) || 0;
            const div = document.createElement('div');
            div.className = 'coin-list-item';
            div.innerHTML = `
                <span style="color:#8b949e;font-size:0.9rem;width:20px">${i+1}</span>
                <img src="${coin.image}" alt="${coin.name}">
                <div>
                    <div class="name">${coin.name}</div>
                    <div class="symbol">${coin.symbol}</div>
                </div>
                <div style="margin-left:auto;text-align:right">
                    <div class="price">${sym}${coin.current_price.toLocaleString()}</div>
                    <div class="${change >= 0 ? 'positive' : 'negative'}">${change > 0 ? '+' : ''}${change}%</div>
                </div>
            `;
            div.onclick = () => {
                document.getElementById('searchInput').value = coin.id;
                switchTab('search');
                document.querySelectorAll('.tab')[0].classList.add('active');
                searchCoin();
            };
            list.appendChild(div);
        });
    } catch {
        list.innerHTML = '<div class="error" style="color: #a0aec0;">Failed to load trending coins.</div>';
        showToast('Load Failed', 'Could not fetch trending coins.', 'error');
    }

    loader.classList.add('hidden');
}

async function compareCoin() {
    const id1 = document.getElementById('compareInput1').value.trim().toLowerCase();
    const id2 = document.getElementById('compareInput2').value.trim().toLowerCase();
    if (!id1 || !id2) return;

    const result = document.getElementById('compareResult');
    const loader = document.getElementById('compareLoader');
    const error = document.getElementById('compareError');

    result.classList.add('hidden');
    error.classList.add('hidden');
    loader.classList.remove('hidden');

    try {
        const [r1, r2] = await Promise.all([
            fetch(`https://api.coingecko.com/api/v3/coins/${id1}`).then(r => r.json()),
            fetch(`https://api.coingecko.com/api/v3/coins/${id2}`).then(r => r.json()),
        ]);

        const sym = currencySymbols[currentCurrency];

        function renderCard(el, data) {
            const change = data.market_data.price_change_percentage_24h.toFixed(2);
            el.innerHTML = `
                <img src="${data.image.large}" alt="">
                <h3>${data.name}</h3>
                <div class="big-price">${sym}${data.market_data.current_price[currentCurrency].toLocaleString()}</div>
                <div class="${change >= 0 ? 'positive' : 'negative'}">${change > 0 ? '+' : ''}${change}% (24h)</div>
                <div style="margin-top:10px;color:#8b949e;font-size:0.85rem">
                    Market Cap: ${sym}${(data.market_data.market_cap[currentCurrency]/1e9).toFixed(2)}B
                </div>
            `;
        }

        renderCard(document.getElementById('compareCard1'), r1);
        renderCard(document.getElementById('compareCard2'), r2);

        const [chart1, chart2] = await Promise.all([
            fetch(`https://api.coingecko.com/api/v3/coins/${id1}/market_chart?vs_currency=${currentCurrency}&days=7`).then(r => r.json()),
            fetch(`https://api.coingecko.com/api/v3/coins/${id2}/market_chart?vs_currency=${currentCurrency}&days=7`).then(r => r.json()),
        ]);

        const labels = chart1.prices.map(p => {
            const d = new Date(p[0]);
            return `${d.getMonth()+1}/${d.getDate()}`;
        });

        if (compareChartInstance) compareChartInstance.destroy();
        const ctx = document.getElementById('compareChart').getContext('2d');
        compareChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: r1.name,
                        data: chart1.prices.map(p => p[1]),
                        borderColor: '#00f2fe',
                        backgroundColor: 'rgba(0, 242, 254, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    },
                    {
                        label: r2.name,
                        data: chart2.prices.map(p => p[1]),
                        borderColor: '#b224ef',
                        backgroundColor: 'rgba(178, 36, 239, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y2'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#e6edf3' } } },
                scales: {
                    x: { ticks: { color: '#a0aec0', maxTicksLimit: 7 }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y1: { type: 'linear', position: 'left', ticks: { color: '#00f2fe' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y2: { type: 'linear', position: 'right', ticks: { color: '#b224ef' }, grid: { drawOnChartArea: false } }
                }
            }
        });

        loader.classList.add('hidden');
        result.classList.remove('hidden');
    } catch {
        loader.classList.add('hidden');
        showToast('Comparison Failed', 'Could not fetch data for one or both coins.', 'error');
    }
}

async function loadFavorites() {
    const list = document.getElementById('favoritesList');
    const noFav = document.getElementById('noFavorites');
    list.innerHTML = '';

    if (favorites.length === 0) {
        noFav.classList.remove('hidden');
        return;
    }

    noFav.classList.add('hidden');
    const sym = currencySymbols[currentCurrency];

    for (const id of favorites) {
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
            const data = await res.json();
            const change = data.market_data.price_change_percentage_24h.toFixed(2);

            const div = document.createElement('div');
            div.className = 'coin-list-item';
            div.innerHTML = `
                <img src="${data.image.large}" alt="">
                <div>
                    <div class="name">${data.name}</div>
                    <div class="symbol">${data.symbol}</div>
                </div>
                <div style="margin-left:auto;text-align:right">
                    <div class="price">${sym}${data.market_data.current_price[currentCurrency].toLocaleString()}</div>
                    <div class="${change >= 0 ? 'positive' : 'negative'}">${change > 0 ? '+' : ''}${change}%</div>
                </div>
            `;
            div.onclick = () => {
                document.getElementById('searchInput').value = id;
                switchTab('search');
                document.querySelectorAll('.tab')[0].classList.add('active');
                searchCoin();
            };
            list.appendChild(div);
        } catch {
            showToast('Load Error', `Failed to load favorite coin: ${id}`, 'error');
        }
    }
}

document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchCoin();
});

async function loadPortfolio() {
    const list = document.getElementById('portfolioList');
    const loader = document.getElementById('portfolioLoader');
    const totalEl = document.getElementById('portfolioTotal');
    
    list.innerHTML = '';
    totalEl.textContent = `${currencySymbols[currentCurrency]}0.00`;
    
    if (portfolio.length === 0) {
        list.innerHTML = '<div class="error">Your portfolio is empty. Add some coins!</div>';
        if (portfolioChartInstance) portfolioChartInstance.destroy();
        if (portfolioHistoryChartInstance) portfolioHistoryChartInstance.destroy();
        document.getElementById('portfolioTimeframes').style.display = 'none';
        document.getElementById('portfolioChange').textContent = '';
        return;
    }
    
    loader.classList.remove('hidden');
    let totalValue = 0;
    const sym = currencySymbols[currentCurrency];
    
    try {
        const coinIds = portfolio.map(p => p.id).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currentCurrency}&ids=${coinIds}`);
        const data = await res.json();
        
        let chartLabels = [];
        let chartData = [];
        let chartColors = ['#4facfe', '#00f2fe', '#667eea', '#b224ef', '#fbbf24', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];
        
        portfolio.forEach(item => {
            const coinData = data.find(c => c.id === item.id);
            if (!coinData) return;
            
            const value = item.amount * coinData.current_price;
            totalValue += value;
            
            chartLabels.push(coinData.name);
            chartData.push(value);
            
            const div = document.createElement('div');
            div.className = 'coin-list-item';
            div.innerHTML = `
                <img src="${coinData.image}" alt="">
                <div>
                    <div class="name">${coinData.name}</div>
                    <div class="symbol">${item.amount} ${coinData.symbol.toUpperCase()}</div>
                </div>
                <div style="margin-left:auto;text-align:right">
                    <div class="price">${sym}${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div style="color: #a0aec0; font-size: 0.85rem;">@ ${sym}${coinData.current_price.toLocaleString()}</div>
                </div>
                <button class="remove-btn" onclick="removeFromPortfolio(event, '${item.id}')">X</button>
            `;
            list.appendChild(div);
        });
        
        totalEl.textContent = `${sym}${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        if (portfolioChartInstance) portfolioChartInstance.destroy();
        if (chartData.length > 0) {
            const ctx = document.getElementById('portfolioChart').getContext('2d');
            portfolioChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        data: chartData,
                        backgroundColor: chartColors.slice(0, chartData.length),
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    cutout: '75%'
                }
            });
        }
    } catch (e) {
        showToast('API Rate Limit Exceeded', "CoinGecko allows ~15 requests/min. Please wait a minute before refreshing.", 'error');
        list.innerHTML = '<div class="error" style="color: #a0aec0;">Failed to load portfolio. API rate limit hit.</div>';
    }
    
    loader.classList.add('hidden');
    loadPortfolioHistory(currentPortfolioDays);
}

async function fetchCoinChart(id, currency, days) {
    const key = `${id}-${currency}-${days}`;
    if (chartCache[key] && (Date.now() - chartCache[key].timestamp < 3600000)) { 
        return chartCache[key].data;
    }
    await new Promise(r => setTimeout(r, 200)); 
    
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`);
    if (!res.ok) throw new Error('API limit');
    const data = await res.json();
    
    chartCache[key] = { timestamp: Date.now(), data: data };
    return data;
}

async function loadPortfolioHistory(days) {
    currentPortfolioDays = days;
    document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.time-btn[onclick="loadPortfolioHistory(${days})"]`);
    if (activeBtn) activeBtn.classList.add('active');

    if (portfolio.length === 0) return;

    try {
        const results = [];
        for (const item of portfolio) {
            results.push(await fetchCoinChart(item.id, currentCurrency, days));
        }

        let unifiedTimestamps = results[0].prices.map(p => p[0]);
        let aggregatedPrices = new Array(unifiedTimestamps.length).fill(0);

        for (let i = 0; i < portfolio.length; i++) {
            const amount = portfolio[i].amount;
            const coinPrices = results[i].prices;
            
            let coinIdx = 0;
            for (let t = 0; t < unifiedTimestamps.length; t++) {
                const targetTime = unifiedTimestamps[t];
                while (coinIdx < coinPrices.length - 1 && Math.abs(coinPrices[coinIdx + 1][0] - targetTime) < Math.abs(coinPrices[coinIdx][0] - targetTime)) {
                    coinIdx++;
                }
                aggregatedPrices[t] += amount * coinPrices[coinIdx][1];
            }
        }

        const labels = unifiedTimestamps.map(ts => {
            const d = new Date(ts);
            if (days === 1) return `${d.getHours().toString().padStart(2, '0')}:00`;
            if (days >= 365) return `${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}`;
        });

        const startPrice = aggregatedPrices[0];
        const endPrice = aggregatedPrices[aggregatedPrices.length - 1];
        const changeVal = endPrice - startPrice;
        const changePct = startPrice > 0 ? (changeVal / startPrice) * 100 : 0;
        
        const changeEl = document.getElementById('portfolioChange');
        const sym = currencySymbols[currentCurrency];
        changeEl.textContent = `${changeVal >= 0 ? '+' : '-'}${sym}${Math.abs(changeVal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%)`;
        changeEl.className = `portfolio-change ${changeVal >= 0 ? 'positive' : 'negative'}`;

        if (portfolioHistoryChartInstance) portfolioHistoryChartInstance.destroy();
        const ctx = document.getElementById('portfolioHistoryChart').getContext('2d');
        portfolioHistoryChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: aggregatedPrices,
                    borderColor: changeVal >= 0 ? '#10b981' : '#ef4444',
                    backgroundColor: changeVal >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#a0aec0', maxTicksLimit: 6 }, grid: { display: false } },
                    y: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
                }
            }
        });

        document.getElementById('portfolioTimeframes').style.display = 'flex';
    } catch (e) {
        console.error("Chart load error", e);
        showToast('Chart Load Failed', "API rate limit hit. Historical chart data is temporarily unavailable.", 'error');
        const changeEl = document.getElementById('portfolioChange');
        if (changeEl && !changeEl.textContent) {
            changeEl.textContent = 'Data Unavailable';
            changeEl.className = 'portfolio-change negative';
        }
    }
}

async function addToPortfolio() {
    const idInput = document.getElementById('portfolioInput').value.trim().toLowerCase();
    const amountInput = parseFloat(document.getElementById('portfolioAmount').value);
    
    if (!idInput || isNaN(amountInput) || amountInput <= 0) return;
    
    document.getElementById('portfolioLoader').classList.remove('hidden');
    
    // First check local cache to avoid API rate limits
    const coinExists = cachedCoins.find(c => c.id === idInput);
    
    if (!coinExists) {
        try {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idInput}&vs_currencies=usd`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            if (!data[idInput]) {
                showToast('Coin Not Found', 'Please enter a valid CoinGecko ID (e.g., bitcoin).', 'warning');
                document.getElementById('portfolioLoader').classList.add('hidden');
                return;
            }
        } catch {
            showToast('Verification Failed', 'Rate limit exceeded. Please select a coin from the dropdown list instead.', 'error');
            document.getElementById('portfolioLoader').classList.add('hidden');
            return;
        }
    }
    
    const existing = portfolio.find(p => p.id === idInput);
    if (existing) {
        existing.amount += amountInput;
    } else {
        portfolio.push({ id: idInput, amount: amountInput });
    }
    
    localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
        
    document.getElementById('portfolioInput').value = '';
    document.getElementById('portfolioAmount').value = '';
    showToast('Success', 'Coin added to your portfolio.', 'success');
    loadPortfolio();
}

function removeFromPortfolio(event, id) {
    event.stopPropagation();
    portfolio = portfolio.filter(p => p.id !== id);
    localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
    showToast('Removed', 'Coin removed from your portfolio.', 'warning');
    loadPortfolio();
}

// Initialize default tab
loadPortfolio();

// Splash Screen Logic
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) splash.classList.add('splash-hidden');
    }, 1500); // 1.5 seconds delay for the splash animation
});