import { Redis } from '@upstash/redis'

let _r = null
function getRedis() {
  if (!_r) _r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  return _r
}

const AV = 'https://www.alphavantage.co/query'
const KEY = process.env.ALPHA_VANTAGE_API_KEY ?? ''

const BSE = {
  'RELIANCE.NS':'RELIANCE.BSE','TCS.NS':'TCS.BSE','HDFCBANK.NS':'HDFCBANK.BSE',
  'INFY.NS':'INFY.BSE','ICICIBANK.NS':'ICICIBANK.BSE','BHARTIARTL.NS':'BHARTIARTL.BSE',
  'KOTAKBANK.NS':'KOTAKBANK.BSE','SBIN.NS':'SBIN.BSE','HINDUNILVR.NS':'HINDUNILVR.BSE',
  'AXISBANK.NS':'AXISBANK.BSE','LT.NS':'LT.BSE','MARUTI.NS':'MARUTI.BSE',
  'HCLTECH.NS':'HCLTECH.BSE','BAJFINANCE.NS':'BAJFINANCE.BSE','WIPRO.NS':'WIPRO.BSE',
  'TITAN.NS':'TITAN.BSE','SUNPHARMA.NS':'SUNPHARMA.BSE','NTPC.NS':'NTPC.BSE',
  'TATAMOTORS.NS':'TATAMOTORS.BSE','TATASTEEL.NS':'TATASTEEL.BSE',
  'ITC.NS':'ITC.BSE','ZOMATO.NS':'ZOMATO.BSE','DLF.NS':'DLF.BSE',
  'ADANIENT.NS':'ADANIENT.BSE','ADANIPORTS.NS':'ADANIPORTS.BSE',
  'KAYNES.NS':'KAYNES.BSE','DIXON.NS':'DIXON.BSE','PFC.NS':'PFC.BSE',
  'RECLTD.NS':'RECLTD.BSE','IRFC.NS':'IRFC.BSE','TATAPOWER.NS':'TATAPOWER.BSE',
  'BANKBARODA.NS':'BANKBARODA.BSE','LUPIN.NS':'LUPIN.BSE','IPCALAB.NS':'IPCALAB.BSE',
  'DIVISLAB.NS':'DIVISLAB.BSE','EICHERMOT.NS':'EICHERMOT.BSE','BPCL.NS':'BPCL.BSE',
  'COALINDIA.NS':'COALINDIA.BSE','HEROMOTOCO.NS':'HEROMOTOCO.BSE',
  'HINDALCO.NS':'HINDALCO.BSE','NESTLEIND.NS':'NESTLEIND.BSE',
  'ASIANPAINT.NS':'ASIANPAINT.BSE','ULTRACEMCO.NS':'ULTRACEMCO.BSE',
  'ONGC.NS':'ONGC.BSE','LTIM.NS':'LTIM.BSE','PIDILITIND.NS':'PIDILITIND.BSE',
  'HAVELLS.NS':'HAVELLS.BSE','TRENT.NS':'TRENT.BSE','GODREJCP.NS':'GODREJCP.BSE',
  'MARICO.NS':'MARICO.BSE','SIEMENS.NS':'SIEMENS.BSE','ABB.NS':'ABB.BSE',
  'GRASIM.NS':'GRASIM.BSE','BRITANNIA.NS':'BRITANNIA.BSE',
  'CHOLAFIN.NS':'CHOLAFIN.BSE','MUTHOOTFIN.NS':'MUTHOOTFIN.BSE',
  'NAUKRI.NS':'NAUKRI.BSE','BAJAJFINSV.NS':'BAJAJFINSV.BSE',
  'LODHA.NS':'LODHA.BSE','360ONE.NS':'360ONE.BSE','POLYCAB.NS':'POLYCAB.BSE',
  'TATACONSUM.NS':'TATACONSUM.BSE','JSWSTEEL.NS':'JSWSTEEL.BSE',
  'TECHM.NS':'TECHM.BSE','CIPLA.NS':'CIPLA.BSE','DRREDDY.NS':'DRREDDY.BSE',
  'APOLLOHOSP.NS':'APOLLOHOSP.BSE','VOLTAS.NS':'VOLTAS.BSE',
  'BAJAJ-AUTO.NS':'BAJAJ-AUTO.BSE','INDUSINDBK.NS':'INDUSINDBK.BSE',
}

const PRICES = {
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
  'ASIANPAINT.NS':2680,'ULTRACEMCO.NS':11200,'ONGC.NS':268,
  'LTIM.NS':5400,'PIDILITIND.NS':2850,'HAVELLS.NS':1640,'TRENT.NS':5800,
}

export function generateSimulatedCandles(ticker) {
  const base = PRICES[ticker] ?? 1000
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng = (n) => Math.abs(Math.sin(seed * n * 9301 + 49297) % 1)
  const candles = []
  let price = base * (0.88 + rng(1) * 0.1)
  let d = 0
  for (let i = 99; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i)
    if (dt.getDay() === 0 || dt.getDay() === 6) continue
    const r = rng(d++)
    price = Math.max(base * 0.5, price + (r - 0.47) * price * 0.022)
    const o = Math.round(price * 100) / 100
    const c = Math.round(price * (1 + (rng(d) - 0.5) * 0.005) * 100) / 100
    const h = Math.round(Math.max(o,c) * (1 + rng(d+1) * 0.009) * 100) / 100
    const l = Math.round(Math.min(o,c) * (1 - rng(d+2) * 0.009) * 100) / 100
    candles.push({ time: dt.getTime(), open: o, high: h, low: l, close: c, volume: Math.floor(300000 + rng(d+3) * 8000000) })
  }
  return candles
}

export function getNifty500Symbols() { return Object.keys(BSE) }

export async function fetchCandles(nseTicker) {
  const redis = getRedis()
  const cacheKey = 'av:v5:' + nseTicker
  try { const c = await redis.get(cacheKey); if (c) return JSON.parse(c) } catch {}

  if (!KEY) return generateSimulatedCandles(nseTicker)
  const sym = BSE[nseTicker] ?? nseTicker.replace('.NS', '.BSE')
  try {
    const res = await fetch(AV + '?function=TIME_SERIES_DAILY&symbol=' + sym + '&outputsize=compact&apikey=' + KEY, {
      headers: { 'User-Agent': 'NiftySniper/1.0' }
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    if (json['Note'] || json['Information']) {
      const sim = generateSimulatedCandles(nseTicker)
      await redis.setex(cacheKey, 300, JSON.stringify(sim)).catch(() => {})
      return sim
    }
    const series = json['Time Series (Daily)']
    if (!series) return generateSimulatedCandles(nseTicker)
    const candles = Object.entries(series).slice(0,100).map(([date, v]) => ({
      time: new Date(date).getTime(),
      open: Math.round(parseFloat(v['1. open'])*100)/100,
      high: Math.round(parseFloat(v['2. high'])*100)/100,
      low: Math.round(parseFloat(v['3. low'])*100)/100,
      close: Math.round(parseFloat(v['4. close'])*100)/100,
      volume: parseInt(v['5. volume']),
    })).sort((a,b) => a.time - b.time)
    await redis.setex(cacheKey, 3600, JSON.stringify(candles)).catch(() => {})
    return candles
  } catch { return generateSimulatedCandles(nseTicker) }
}

export async function fetchMarketPulse() {
  const redis = getRedis()
  const key = 'av:pulse:v5'
  try { const c = await redis.get(key); if (c) return JSON.parse(c) } catch {}
  const defaults = {
    '^NSEI': 24117, '^NSEI_prev': 23934, '^NSEBANK': 51842,
    '^BSESN': 79486, '^INDIAVIX': 22.81, 'USDINR=X': 83.42,
  }
  if (KEY) {
    try {
      const r = await fetch(AV + '?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=INR&apikey=' + KEY)
      const j = await r.json()
      const rate = j?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']
      if (rate) defaults['USDINR=X'] = Math.round(parseFloat(rate)*100)/100
    } catch {}
  }
  await redis.setex(key, 60, JSON.stringify(defaults)).catch(() => {})
  return defaults
}
