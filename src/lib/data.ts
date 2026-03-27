import { Redis } from '@upstash/redis'

// ─── Safe Redis — never throws on bad/missing env vars ────────────────────────
let _redis: Redis | null = null
function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
  if (!url.startsWith('https://') || !token) return null
  try {
    _redis = new Redis({ url, token })
    return _redis
  } catch { return null }
}

async function cacheGet(key: string): Promise<string | null> {
  try {
    const r = getRedis()
    if (!r) return null
    const v = await r.get<string>(key)
    return v ?? null
  } catch { return null }
}

async function cacheSet(key: string, ttl: number, val: string): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.setex(key, ttl, val)
  } catch { /* silent */ }
}

// ─── Universe definitions ─────────────────────────────────────────────────────

const UNIVERSE: Record<string, string> = {
  'RELIANCE.NS':'Energy','TCS.NS':'IT','HDFCBANK.NS':'Financials',
  'INFY.NS':'IT','ICICIBANK.NS':'Financials','BHARTIARTL.NS':'Telecom',
  'KOTAKBANK.NS':'Financials','SBIN.NS':'Financials','HINDUNILVR.NS':'FMCG',
  'AXISBANK.NS':'Financials','LT.NS':'Industrials','MARUTI.NS':'Auto',
  'HCLTECH.NS':'IT','BAJFINANCE.NS':'Financials','WIPRO.NS':'IT',
  'TITAN.NS':'Consumer','SUNPHARMA.NS':'Pharma','NTPC.NS':'Utilities',
  'POWERGRID.NS':'Utilities','TATAMOTORS.NS':'Auto','TATASTEEL.NS':'Metals',
  'TECHM.NS':'IT','CIPLA.NS':'Pharma','DRREDDY.NS':'Pharma',
  'APOLLOHOSP.NS':'Pharma','BAJAJFINSV.NS':'Financials','JSWSTEEL.NS':'Metals',
  'HINDALCO.NS':'Metals','NESTLEIND.NS':'FMCG','DIVISLAB.NS':'Pharma',
  'EICHERMOT.NS':'Auto','BPCL.NS':'Energy','COALINDIA.NS':'Energy',
  'HEROMOTOCO.NS':'Auto','BRITANNIA.NS':'FMCG','INDUSINDBK.NS':'Financials',
  'TATACONSUM.NS':'FMCG','GRASIM.NS':'Materials','ASIANPAINT.NS':'Consumer',
  'ULTRACEMCO.NS':'Materials','ONGC.NS':'Energy','ITC.NS':'FMCG',
  'LTIM.NS':'IT','PIDILITIND.NS':'Consumer','HAVELLS.NS':'Consumer',
  'TRENT.NS':'Retail','ZOMATO.NS':'Consumer','ADANIENT.NS':'Industrials',
  'ADANIPORTS.NS':'Industrials','DLF.NS':'Realty','LODHA.NS':'Realty',
  '360ONE.NS':'Financials','KAYNES.NS':'IT','DIXON.NS':'IT',
  'POLYCAB.NS':'Industrials','PFC.NS':'Financials','RECLTD.NS':'Financials',
  'IRFC.NS':'Financials','TATAPOWER.NS':'Utilities','BANKBARODA.NS':'Financials',
  'LUPIN.NS':'Pharma','IPCALAB.NS':'Pharma','MUTHOOTFIN.NS':'Financials',
  'CHOLAFIN.NS':'Financials','NAUKRI.NS':'IT','BAJAJ-AUTO.NS':'Auto',
  'GODREJCP.NS':'FMCG','MARICO.NS':'FMCG','SIEMENS.NS':'Industrials',
  'ABB.NS':'Industrials','VOLTAS.NS':'Consumer','TORNTPHARM.NS':'Pharma',
  'ALKEM.NS':'Pharma','HDFCLIFE.NS':'Financials','ICICIGI.NS':'Financials',
}

const BSE: Record<string, string> = {
  'RELIANCE.NS':'RELIANCE.BSE','TCS.NS':'TCS.BSE','HDFCBANK.NS':'HDFCBANK.BSE',
  'INFY.NS':'INFY.BSE','ICICIBANK.NS':'ICICIBANK.BSE','BHARTIARTL.NS':'BHARTIARTL.BSE',
  'KOTAKBANK.NS':'KOTAKBANK.BSE','SBIN.NS':'SBIN.BSE','HINDUNILVR.NS':'HINDUNILVR.BSE',
  'AXISBANK.NS':'AXISBANK.BSE','LT.NS':'LT.BSE','MARUTI.NS':'MARUTI.BSE',
  'HCLTECH.NS':'HCLTECH.BSE','BAJFINANCE.NS':'BAJFINANCE.BSE','WIPRO.NS':'WIPRO.BSE',
  'TITAN.NS':'TITAN.BSE','SUNPHARMA.NS':'SUNPHARMA.BSE','NTPC.NS':'NTPC.BSE',
  'POWERGRID.NS':'POWERGRID.BSE','TATAMOTORS.NS':'TATAMOTORS.BSE',
  'TATASTEEL.NS':'TATASTEEL.BSE','TECHM.NS':'TECHM.BSE','CIPLA.NS':'CIPLA.BSE',
  'DRREDDY.NS':'DRREDDY.BSE','APOLLOHOSP.NS':'APOLLOHOSP.BSE',
  'BAJAJFINSV.NS':'BAJAJFINSV.BSE','JSWSTEEL.NS':'JSWSTEEL.BSE',
  'HINDALCO.NS':'HINDALCO.BSE','NESTLEIND.NS':'NESTLEIND.BSE',
  'DIVISLAB.NS':'DIVISLAB.BSE','EICHERMOT.NS':'EICHERMOT.BSE',
  'BPCL.NS':'BPCL.BSE','COALINDIA.NS':'COALINDIA.BSE',
  'HEROMOTOCO.NS':'HEROMOTOCO.BSE','BRITANNIA.NS':'BRITANNIA.BSE',
  'INDUSINDBK.NS':'INDUSINDBK.BSE','TATACONSUM.NS':'TATACONSUM.BSE',
  'GRASIM.NS':'GRASIM.BSE','ASIANPAINT.NS':'ASIANPAINT.BSE',
  'ULTRACEMCO.NS':'ULTRACEMCO.BSE','ONGC.NS':'ONGC.BSE','ITC.NS':'ITC.BSE',
  'LTIM.NS':'LTIM.BSE','PIDILITIND.NS':'PIDILITIND.BSE','HAVELLS.NS':'HAVELLS.BSE',
  'TRENT.NS':'TRENT.BSE','ZOMATO.NS':'ZOMATO.BSE','ADANIENT.NS':'ADANIENT.BSE',
  'ADANIPORTS.NS':'ADANIPORTS.BSE','DLF.NS':'DLF.BSE','LODHA.NS':'LODHA.BSE',
  '360ONE.NS':'360ONE.BSE','KAYNES.NS':'KAYNES.BSE','DIXON.NS':'DIXON.BSE',
  'POLYCAB.NS':'POLYCAB.BSE','PFC.NS':'PFC.BSE','RECLTD.NS':'RECLTD.BSE',
  'IRFC.NS':'IRFC.BSE','TATAPOWER.NS':'TATAPOWER.BSE','BANKBARODA.NS':'BANKBARODA.BSE',
  'LUPIN.NS':'LUPIN.BSE','IPCALAB.NS':'IPCALAB.BSE','MUTHOOTFIN.NS':'MUTHOOTFIN.BSE',
  'CHOLAFIN.NS':'CHOLAFIN.BSE','NAUKRI.NS':'NAUKRI.BSE','BAJAJ-AUTO.NS':'BAJAJ-AUTO.BSE',
  'GODREJCP.NS':'GODREJCP.BSE','MARICO.NS':'MARICO.BSE','SIEMENS.NS':'SIEMENS.BSE',
  'ABB.NS':'ABB.BSE','VOLTAS.NS':'VOLTAS.BSE','TORNTPHARM.NS':'TORNTPHARM.BSE',
  'ALKEM.NS':'ALKEM.BSE','HDFCLIFE.NS':'HDFCLIFE.BSE','ICICIGI.NS':'ICICIGI.BSE',
}

const PRICES: Record<string, number> = {
  'RELIANCE.NS':2950,'TCS.NS':3800,'HDFCBANK.NS':1680,'INFY.NS':1545,
  'ICICIBANK.NS':1240,'BHARTIARTL.NS':1790,'KOTAKBANK.NS':1895,'SBIN.NS':780,
  'HINDUNILVR.NS':2380,'AXISBANK.NS':1130,'LT.NS':3640,'MARUTI.NS':12540,
  'HCLTECH.NS':1690,'BAJFINANCE.NS':7120,'WIPRO.NS':480,'TITAN.NS':3320,
  'SUNPHARMA.NS':1810,'NTPC.NS':355,'TATAMOTORS.NS':670,'TATASTEEL.NS':155,
  'ITC.NS':445,'ZOMATO.NS':225,'DLF.NS':820,'ADANIENT.NS':2400,
  'KAYNES.NS':3720,'DIXON.NS':15800,'PFC.NS':460,'RECLTD.NS':510,
  'IRFC.NS':190,'TATAPOWER.NS':445,'BANKBARODA.NS':245,'LUPIN.NS':2120,
  'DIVISLAB.NS':5480,'EICHERMOT.NS':5320,'BPCL.NS':298,'COALINDIA.NS':442,
  'HEROMOTOCO.NS':5200,'HINDALCO.NS':680,'NESTLEIND.NS':24800,
  'ASIANPAINT.NS':2680,'ULTRACEMCO.NS':11200,'ONGC.NS':268,'LTIM.NS':5400,
  'PIDILITIND.NS':2850,'HAVELLS.NS':1640,'TRENT.NS':5800,'SIEMENS.NS':7200,
  'ABB.NS':8400,'POLYCAB.NS':7100,'ALKEM.NS':5400,'TORNTPHARM.NS':3200,
  'BAJAJ-AUTO.NS':8900,'GODREJCP.NS':1240,'MARICO.NS':620,'VOLTAS.NS':1580,
  'MUTHOOTFIN.NS':1980,'CHOLAFIN.NS':1380,'NAUKRI.NS':7800,'360ONE.NS':980,
}

// ─── Deterministic simulation — 500 candles, never throws ────────────────────

export interface OHLCV {
  open: number; high: number; low: number; close: number; volume: number; time: number
}

function sim(ticker: string): OHLCV[] {
  const base = PRICES[ticker] ?? 1000
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = (n: number) => Math.abs(Math.sin(seed * n * 9301 + 49297) % 1)
  const out: OHLCV[] = []
  let price = base * (0.85 + rng(1) * 0.12)
  let d = 0
  for (let i = 499; i >= 0; i--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - i)
    if (dt.getDay() === 0 || dt.getDay() === 6) continue
    price = Math.max(base * 0.4, price * (1 + (rng(d++) - 0.47) * 0.022))
    const o = Math.round(price * 100) / 100
    const c = Math.round(price * (1 + (rng(d) - 0.5) * 0.005) * 100) / 100
    out.push({
      time: dt.getTime(),
      open: o,
      high: Math.round(Math.max(o, c) * (1 + rng(d + 1) * 0.009) * 100) / 100,
      low: Math.round(Math.min(o, c) * (1 - rng(d + 2) * 0.009) * 100) / 100,
      close: c,
      volume: Math.floor(200000 + rng(d + 3) * 9000000),
    })
  }
  return out
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getNifty500Symbols(): { symbols: string[]; sectors: Record<string, string> } {
  return { symbols: Object.keys(UNIVERSE), sectors: UNIVERSE }
}

export async function fetchCandles(nseTicker: string, _period = '1y'): Promise<OHLCV[]> {
  const key = 'av:v7:' + nseTicker
  const cached = await cacheGet(key)
  if (cached) return JSON.parse(cached) as OHLCV[]

  const avKey = process.env.ALPHA_VANTAGE_API_KEY ?? ''
  if (!avKey) return sim(nseTicker)

  const sym = BSE[nseTicker] ?? nseTicker.replace('.NS', '.BSE')
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${sym}&outputsize=full&apikey=${avKey}`,
      { headers: { 'User-Agent': 'NiftySniper/1.0' } }
    )
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json() as Record<string, unknown>
    if (json['Note'] || json['Information']) {
      await cacheSet(key, 300, JSON.stringify(sim(nseTicker)))
      return sim(nseTicker)
    }
    const series = json['Time Series (Daily)'] as Record<string, Record<string, string>> | undefined
    if (!series) return sim(nseTicker)
    const candles: OHLCV[] = Object.entries(series)
      .map(([date, v]) => ({
        time: new Date(date).getTime(),
        open: Math.round(parseFloat(v['1. open']) * 100) / 100,
        high: Math.round(parseFloat(v['2. high']) * 100) / 100,
        low: Math.round(parseFloat(v['3. low']) * 100) / 100,
        close: Math.round(parseFloat(v['4. close']) * 100) / 100,
        volume: parseInt(v['5. volume']),
      }))
      .sort((a, b) => a.time - b.time)
    await cacheSet(key, 3600, JSON.stringify(candles))
    return candles
  } catch {
    return sim(nseTicker)
  }
}

export async function fetchMarketPulse(): Promise<Record<string, number>> {
  const key = 'av:pulse:v7'
  const cached = await cacheGet(key)
  if (cached) return JSON.parse(cached) as Record<string, number>

  const defaults: Record<string, number> = {
    '^NSEI': 24117, '^NSEI_prev': 23934, '^NSEBANK': 51842,
    '^BSESN': 79486, '^INDIAVIX': 22.81, 'USDINR=X': 83.42,
  }

  const avKey = process.env.ALPHA_VANTAGE_API_KEY ?? ''
  if (avKey) {
    try {
      const r = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=INR&apikey=${avKey}`
      )
      const j = await r.json() as Record<string, Record<string, string>>
      const rate = j?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']
      if (rate) defaults['USDINR=X'] = Math.round(parseFloat(rate) * 100) / 100
    } catch { /* use defaults */ }
  }

  await cacheSet(key, 60, JSON.stringify(defaults))
  return defaults
}
