export interface IndexQuote {
  close: number;
  change: number;
  change_percent: number;
  date?: string;
}

export interface MarketBreadth {
  advanced: number;
  declined: number;
  unchanged: number;
  total_volume?: number;
  total_value_mn: number;
  total_trades?: number;
}

export interface StockMarketData {
  indices: {
    DSEX?: IndexQuote;
    DS30?: IndexQuote;
    DSES?: IndexQuote;
    CDSET?: IndexQuote;
  };
  breadth: MarketBreadth;
  as_of?: string;
}

const CACHE_KEY = 'dorpon_stock_market_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

// Default fallback data matching live baseline in case of offline/network block
const FALLBACK_DATA: StockMarketData = {
  indices: {
    DSEX: { close: 5450.62, change: 27.95, change_percent: 0.52 },
    DS30: { close: 2103.40, change: 17.43, change_percent: 0.84 },
    DSES: { close: 1070.40, change: 1.74, change_percent: 0.16 },
  },
  breadth: {
    advanced: 187,
    declined: 136,
    unchanged: 58,
    total_value_mn: 5026.32,
  },
  as_of: new Date().toISOString().split('T')[0],
};

export async function fetchDseMarketData(): Promise<StockMarketData> {
  // 1. Check memory / session cache
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
        return parsed.data;
      }
    }
  } catch {
    // sessionStorage not available
  }

  // 2. Fetch from stockchartbd API
  try {
    const res = await fetch('https://stockchartbd.com/api/v1.php?endpoint=market');
    if (!res.ok) {
      throw new Error(`Stock API status ${res.status}`);
    }
    const json = await res.json();
    if (json.ok && json.indices) {
      const marketData: StockMarketData = {
        indices: json.indices,
        breadth: json.breadth || FALLBACK_DATA.breadth,
        as_of: json.meta?.as_of || json.breadth?.date,
      };

      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: marketData })
        );
      } catch {}

      return marketData;
    }
  } catch (err) {
    console.warn('Unable to load live DSE market data, using fallback register:', err);
  }

  return FALLBACK_DATA;
}
