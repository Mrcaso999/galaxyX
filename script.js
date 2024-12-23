let lastFetchTime = 0;
const FETCH_COOLDOWN = 10000; // 10 giây

// Cache data
const CACHE_KEY = 'galaxy_x_crypto_data';
const CACHE_DURATION = 60000; // 1 phút

// Lazy load functions
const lazyLoadData = async () => {
    // Kiểm tra cache trước
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
            displayCryptos(data);
            return;
        }
    }

    // Nếu không có cache hoặc cache hết hạn, fetch mới
    await fetchCryptoData();
};

// Tối ưu fetch function
async function fetchCryptoData() {
    try {
        const now = Date.now();
        if (now - lastFetchTime < FETCH_COOLDOWN) {
            return;
        }
        lastFetchTime = now;

        showLoading();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(
            'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false', 
            { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Cache data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));

        displayCryptos(data);
    } catch (error) {
        if (error.name === 'AbortError') {
            showError('Kết nối quá chậm. Vui lòng thử lại.');
        } else {
            console.error('Lỗi:', error);
            showError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        }
    }
}

function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toLocaleString();
}

// Tối ưu hiển thị
function displayCryptos(cryptos) {
    const fragment = document.createDocumentFragment();
    const cryptoGrid = document.querySelector('.crypto-grid');
    cryptoGrid.innerHTML = '';

    if (!cryptos.length) {
        const noResult = document.createElement('div');
        noResult.style.cssText = `
            grid-column: 1/-1;
            text-align: center;
            color: #fff;
            padding: 2rem;
        `;
        noResult.textContent = 'Không tìm thấy kết quả';
        fragment.appendChild(noResult);
    } else {
        cryptos.forEach(crypto => {
            const card = createCryptoCard(crypto);
            fragment.appendChild(card);
        });
    }

    cryptoGrid.appendChild(fragment);
}

// Tách hàm tạo card để tối ưu
function createCryptoCard(crypto) {
    const card = document.createElement('div');
    card.className = 'crypto-card';
    
    const priceChange = crypto.price_change_percentage_24h;
    const changeClass = priceChange >= 0 ? 'positive' : 'negative';
    const changeIcon = priceChange >= 0 ? '↗' : '↘';
    
    card.innerHTML = `
        <h2>
            <img src="${crypto.image}" alt="${crypto.name}" loading="lazy">
            ${crypto.name}
            <span style="color: #666; font-size: 0.8em">${crypto.symbol.toUpperCase()}</span>
        </h2>
        <div class="price">$${crypto.current_price.toLocaleString()}</div>
        <div class="change ${changeClass}">
            ${changeIcon} ${Math.abs(priceChange).toFixed(2)}%
        </div>
        <div class="crypto-info">
            <div>Volume 24h: $${formatNumber(crypto.total_volume)}</div>
            <div>Market Cap: $${formatNumber(crypto.market_cap)}</div>
        </div>
    `;
    
    return card;
}

function showError(message) {
    const cryptoGrid = document.querySelector('.crypto-grid');
    cryptoGrid.innerHTML = `
        <div style="
            grid-column: 1/-1;
            text-align: center;
            color: #f87171;
            padding: 2rem;
            background: rgba(255,0,0,0.1);
            border-radius: 12px;
        ">
            ${message}
        </div>
    `;
}

function showLoading() {
    const cryptoGrid = document.querySelector('.crypto-grid');
    cryptoGrid.innerHTML = '';
    
    for (let i = 0; i < 12; i++) {
        const loadingCard = document.createElement('div');
        loadingCard.className = 'crypto-card loading';
        loadingCard.innerHTML = `
            <div style="height: 24px; background: rgba(255,255,255,0.1); border-radius: 4px;"></div>
            <div style="height: 32px; background: rgba(255,255,255,0.1); border-radius: 4px;"></div>
            <div style="height: 24px; width: 60%; background: rgba(255,255,255,0.1); border-radius: 4px;"></div>
        `;
        cryptoGrid.appendChild(loadingCard);
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tìm kiếm crypto với debounce
document.getElementById('searchInput').addEventListener('input', 
    debounce(async (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
            fetchCryptoData();
            return;
        }

        showLoading();
        
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
            const data = await response.json();
            
            const filteredCryptos = data.filter(crypto => 
                crypto.name.toLowerCase().includes(searchTerm) || 
                crypto.symbol.toLowerCase().includes(searchTerm)
            );
            
            displayCryptos(filteredCryptos);
        } catch (error) {
            showError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
        }
    }, 300)
);

// Khởi tạo với lazy loading
document.addEventListener('DOMContentLoaded', lazyLoadData);

// Tối ưu interval update
let updateInterval;

function startUpdateInterval() {
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(fetchCryptoData, 60000);
}

// Thêm visibility change listener
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(updateInterval);
    } else {
        fetchCryptoData();
        startUpdateInterval();
    }
});

// Khởi động interval
startUpdateInterval(); 
