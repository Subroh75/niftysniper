import { Redis } from '@upstash/redis'

// ─── Redis cache helpers ──────────────────────────────────────────────────────
let _redis: Redis | null = null
async function getRedis() {
  if (_redis) return _redis
  const url   = process.env.UPSTASH_REDIS_REST_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
  if (!url.startsWith('https://') || !token) return null
  try { _redis = new Redis({ url, token }); return _redis } catch { return null }
}
async function cacheGet(key: string): Promise<string | null> {
  try { const r = await getRedis(); if (!r) return null; const v = await r.get<string>(key); return v ?? null } catch { return null }
}
async function cacheSet(key: string, ttl: number, val: string): Promise<void> {
  try { const r = await getRedis(); if (!r) return; await r.setex(key, ttl, val) } catch {}
}

export interface OHLCV {
  time: number; open: number; high: number; low: number; close: number; volume: number
}

// ─── Nifty 50 — exact index constituents ─────────────────────────────────────
const NIFTY50: Record<string, string> = {
  'RELIANCE.NS':'Energy',     'TCS.NS':'IT',              'HDFCBANK.NS':'Financials',
  'INFY.NS':'IT',             'ICICIBANK.NS':'Financials', 'BHARTIARTL.NS':'Telecom',
  'KOTAKBANK.NS':'Financials','SBIN.NS':'Financials',     'HINDUNILVR.NS':'FMCG',
  'AXISBANK.NS':'Financials', 'LT.NS':'Industrials',      'MARUTI.NS':'Auto',
  'HCLTECH.NS':'IT',          'BAJFINANCE.NS':'Financials','WIPRO.NS':'IT',
  'TITAN.NS':'Consumer',      'SUNPHARMA.NS':'Pharma',    'NTPC.NS':'Utilities',
  'POWERGRID.NS':'Utilities', 'TATAMOTORS.NS':'Auto',     'TATASTEEL.NS':'Metals',
  'TECHM.NS':'IT',            'CIPLA.NS':'Pharma',        'DRREDDY.NS':'Pharma',
  'APOLLOHOSP.NS':'Pharma',   'BAJAJFINSV.NS':'Financials','JSWSTEEL.NS':'Metals',
  'HINDALCO.NS':'Metals',     'NESTLEIND.NS':'FMCG',      'DIVISLAB.NS':'Pharma',
  'EICHERMOT.NS':'Auto',      'BPCL.NS':'Energy',         'COALINDIA.NS':'Energy',
  'HEROMOTOCO.NS':'Auto',     'BRITANNIA.NS':'FMCG',      'INDUSINDBK.NS':'Financials',
  'TATACONSUM.NS':'FMCG',     'GRASIM.NS':'Materials',    'ASIANPAINT.NS':'Consumer',
  'ULTRACEMCO.NS':'Materials','ONGC.NS':'Energy',         'ITC.NS':'FMCG',
  'LTIM.NS':'IT',             'ADANIENT.NS':'Industrials', 'ADANIPORTS.NS':'Industrials',
  'TRENT.NS':'Retail',        'ZOMATO.NS':'Consumer',     'BAJAJ-AUTO.NS':'Auto',
  'SHRIRAMFIN.NS':'Financials','BEL.NS':'Industrials',
}

// ─── Extra for Nifty 200 ──────────────────────────────────────────────────────
const NIFTY200_EXTRA: Record<string, string> = {
  'PIDILITIND.NS':'Consumer', 'HAVELLS.NS':'Consumer',    'SIEMENS.NS':'Industrials',
  'ABB.NS':'Industrials',     'POLYCAB.NS':'Industrials', 'DLF.NS':'Realty',
  'LODHA.NS':'Realty',        'GODREJCP.NS':'FMCG',       'MARICO.NS':'FMCG',
  'VOLTAS.NS':'Consumer',     'TORNTPHARM.NS':'Pharma',   'ALKEM.NS':'Pharma',
  'HDFCLIFE.NS':'Financials', 'ICICIGI.NS':'Financials',  '360ONE.NS':'Financials',
  'KAYNES.NS':'IT',           'DIXON.NS':'IT',            'PFC.NS':'Financials',
  'RECLTD.NS':'Financials',   'IRFC.NS':'Financials',     'TATAPOWER.NS':'Utilities',
  'BANKBARODA.NS':'Financials','LUPIN.NS':'Pharma',       'IPCALAB.NS':'Pharma',
  'MUTHOOTFIN.NS':'Financials','CHOLAFIN.NS':'Financials','NAUKRI.NS':'IT',
  'BOSCHLTD.NS':'Auto',       'MOTHERSON.NS':'Auto',      'BALKRISIND.NS':'Auto',
  'CEATLTD.NS':'Auto',        'APOLLOTYRE.NS':'Auto',     'MRF.NS':'Auto',
  'EXIDEIND.NS':'Auto',       'ESCORTS.NS':'Auto',        'TVSMOTORS.NS':'Auto',
  'AUROPHARMA.NS':'Pharma',   'BIOCON.NS':'Pharma',       'MANKIND.NS':'Pharma',
  'LALPATHLAB.NS':'Pharma',   'MAXHEALTH.NS':'Pharma',    'FORTIS.NS':'Pharma',
  'MPHASIS.NS':'IT',          'PERSISTENT.NS':'IT',       'COFORGE.NS':'IT',
  'LTTS.NS':'IT',             'OFSS.NS':'IT',             'TATAELXSI.NS':'IT',
  'KPIT.NS':'IT',             'SBICARD.NS':'Financials',  'HDFCAMC.NS':'Financials',
  'ANGELONE.NS':'Financials', 'CDSL.NS':'Financials',     'IDFCFIRSTB.NS':'Financials',
  'BANDHANBNK.NS':'Financials','FEDERALBNK.NS':'Financials','RBLBANK.NS':'Financials',
  'GODREJPROP.NS':'Realty',   'PRESTIGE.NS':'Realty',     'OBEROIRLTY.NS':'Realty',
  'PHOENIXLTD.NS':'Realty',   'COLPAL.NS':'FMCG',         'DABUR.NS':'FMCG',
  'EMAMILTD.NS':'FMCG',       'MARICO.NS':'FMCG',        'GAIL.NS':'Energy',
  'IGL.NS':'Energy',          'PETRONET.NS':'Energy',     'HINDPETRO.NS':'Energy',
  'IOC.NS':'Energy',          'HPCL.NS':'Energy',         'NMDC.NS':'Metals',
  'VEDL.NS':'Metals',         'SAIL.NS':'Metals',         'NATIONALUM.NS':'Metals',
  'HINDZINC.NS':'Metals',     'NHPC.NS':'Utilities',      'CESC.NS':'Utilities',
  'TORNTPOWER.NS':'Utilities','ADANIGREEN.NS':'Utilities', 'JSWENERGY.NS':'Utilities',
  'SUZLON.NS':'Utilities',    'HAL.NS':'Industrials',     'BHEL.NS':'Industrials',
  'PERSISTENT.NS':'IT',       'MPHASIS.NS':'IT',
}

// ─── Extra for Nifty 500 ──────────────────────────────────────────────────────
const NIFTY500_EXTRA: Record<string, string> = {
  'KALYANKJIL.NS':'Consumer', 'TBOTEK.NS':'IT',           'MEDANTA.NS':'Pharma',
  'THELEELA.NS':'Consumer',   'AAVAS.NS':'Financials',    'HOMEFIRST.NS':'Financials',
  'RBLBANK.NS':'Financials',  'DCBBANK.NS':'Financials',  'TVSMOTORS.NS':'Auto',
  'ESCORTS.NS':'Auto',        'MAHINDCIE.NS':'Auto',      'SUNDRMFAST.NS':'Auto',
  'AARTIDRUGS.NS':'Pharma',   'GRANULES.NS':'Pharma',     'LAURUSLABS.NS':'Pharma',
  'NATCOPHARM.NS':'Pharma',   'STAR.NS':'Pharma',         'SEQUENT.NS':'Pharma',
  'METROPOLIS.NS':'Pharma',   'THYROCARE.NS':'Pharma',    'RAINBOW.NS':'Pharma',
  'DEEPAKNI.NS':'Materials',  'TATACHEM.NS':'Materials',  'AARTI.NS':'Materials',
  'GALAXYSURF.NS':'Materials','FINEORG.NS':'Materials',   'VINATI.NS':'Materials',
  'NUVAMA.NS':'Financials',   'CAMS.NS':'Financials',     'KFINTECH.NS':'Financials',
  'SPANDANA.NS':'Financials', 'CREDITACC.NS':'Financials','FIVESTAR.NS':'Financials',
  'MANAPPURAM.NS':'Financials','SUNDARMFIN.NS':'Financials','HEROFINCO.NS':'Financials',
  'INDIAMART.NS':'IT',        'JUSTDIAL.NS':'IT',         'TANLA.NS':'IT',
  'RATEGAIN.NS':'IT',         'INTELLECT.NS':'IT',        'CYIENT.NS':'IT',
  'NYKAA.NS':'Consumer',      'PVRINOX.NS':'Consumer',    'NAZARA.NS':'Consumer',
  'SUNTV.NS':'Consumer',      'ZEEL.NS':'Consumer',       'HAL.NS':'Industrials',
  'BDL.NS':'Industrials',     'BEML.NS':'Industrials',    'GRSE.NS':'Industrials',
  'MAZAGON.NS':'Industrials', 'DATAPATTNS.NS':'IT',       'KEC.NS':'Industrials',
  'KALPATPOWR.NS':'Industrials','GMRINFRA.NS':'Industrials','JSWINFRA.NS':'Industrials',
  'ATGL.NS':'Energy',         'CASTROLIND.NS':'Energy',   'MRPL.NS':'Energy',
  'HPCL.NS':'Energy',         'DELHIVERY.NS':'Industrials','PAYTM.NS':'Financials',
  'POLICYBZR.NS':'Financials','NYKAA.NS':'Consumer',
}

// ─── Merged universes ─────────────────────────────────────────────────────────
const NIFTY200 = { ...NIFTY50, ...NIFTY200_EXTRA }
const NIFTY500 = { ...NIFTY200, ...NIFTY500_EXTRA }

// ─── Seed prices for simulation fallback ─────────────────────────────────────
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
  'MUTHOOTFIN.NS':1980,'CHOLAFIN.NS':1380,'NAUKRI.NS':7800,'MRF.NS':145000,
  'BOSCHLTD.NS':32000,'HAL.NS':4200,'BEL.NS':290,'PERSISTENT.NS':5800,
}

// ─── Simulation fallback — deterministic, never throws ───────────────────────
function sim(ticker: string): OHLCV[] {
  const base = PRICES[ticker] ?? 1000
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rng  = (n: number) => Math.abs(Math.sin(seed * n * 9301 + 49297) % 1)
  const out: OHLCV[] = []
  let price = base * (0.85 + rng(1) * 0.12)
  let d = 0
  for (let i = 499; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i)
    if (dt.getDay() === 0 || dt.getDay() === 6) continue
    price = Math.max(base * 0.4, price * (1 + (rng(d++) - 0.47) * 0.022))
    const o = Math.round(price * 100) / 100
    const c = Math.round(price * (1 + (rng(d) - 0.5) * 0.005) * 100) / 100
    out.push({
      time:   dt.getTime(),
      open:   o,
      high:   Math.round(Math.max(o, c) * (1 + rng(d + 1) * 0.009) * 100) / 100,
      low:    Math.round(Math.min(o, c) * (1 - rng(d + 2) * 0.009) * 100) / 100,
      close:  c,
      volume: Math.floor(200000 + rng(d + 3) * 9000000),
    })
  }
  return out
}

// ─── Public: return symbol list for requested universe ────────────────────────
export function getNifty500Symbols(universe: 'NIFTY50' | 'NIFTY200' | 'NIFTY500' = 'NIFTY50'): {
  symbols: string[]; sectors: Record<string, string>
} {
  const map = universe === 'NIFTY50' ? NIFTY50 : universe === 'NIFTY200' ? NIFTY200 : NIFTY500
  const deduped = Object.fromEntries(Object.entries(map))
  return { symbols: Object.keys(deduped), sectors: deduped }
}

// ─── fetchCandles — direct Yahoo Finance v8 API, zero npm dependencies ────────
// This is the same HTTP endpoint yahoo-finance2 uses internally.
// No package = no webpack issues. Falls back to sim() on any error.
export async function fetchCandles(nseTicker: string, _period = '2y'): Promise<OHLCV[]> {
  const cacheKey = 'yf:v3:' + nseTicker
  const cached   = await cacheGet(cacheKey)
  if (cached) return JSON.parse(cached) as OHLCV[]

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${nseTicker}?interval=1d&range=2y`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NiftySniper/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return sim(nseTicker)
    const json = await res.json() as Record<string, unknown>
    const result = (json as any)?.chart?.result?.[0]
    if (!result) return sim(nseTicker)

    const timestamps = result.timestamp as number[]
    const q = result.indicators.quote[0]

    const candles: OHLCV[] = timestamps
      .map((t: number, i: number) => ({
        time:   t * 1000,
        open:   Math.round((q.open[i]   ?? q.close[i]) * 100) / 100,
        high:   Math.round((q.high[i]   ?? q.close[i]) * 100) / 100,
        low:    Math.round((q.low[i]    ?? q.close[i]) * 100) / 100,
        close:  Math.round((q.close[i]  ?? 0)          * 100) / 100,
        volume: q.volume[i] ?? 0,
      }))
      .filter((c: OHLCV) => c.close > 0)

    if (candles.length < 20) return sim(nseTicker)
    await cacheSet(cacheKey, 3600, JSON.stringify(candles))
    return candles
  } catch {
    return sim(nseTicker)
  }
}

// ─── fetchMarketPulse — direct Yahoo Finance, zero npm dependencies ───────────
export async function fetchMarketPulse(): Promise<Record<string, number>> {
  const cacheKey = 'yf:pulse:v3'
  const cached   = await cacheGet(cacheKey)
  if (cached) return JSON.parse(cached) as Record<string, number>

  const defaults: Record<string, number> = {
    '^NSEI': 24117, '^NSEI_prev': 23934, '^NSEBANK': 51842,
    '^BSESN': 79486, '^INDIAVIX': 22.81, 'USDINR=X': 83.42,
  }

  const symbols = ['^NSEI', '^NSEBANK', '^BSESN', '^INDIAVIX', 'USDINR=X']
  await Promise.allSettled(symbols.map(async (sym) => {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=5d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
      )
      if (!res.ok) return
      const json = await res.json() as Record<string, unknown>
      const result = (json as any)?.chart?.result?.[0]
      if (!result) return
      const closes: number[] = result.indicators.quote[0].close.filter(Boolean)
      if (!closes.length) return
      defaults[sym] = Math.round(closes[closes.length - 1] * 100) / 100
      if (sym === '^NSEI' && closes.length >= 2) {
        defaults['^NSEI_prev'] = Math.round(closes[closes.length - 2] * 100) / 100
      }
    } catch { /* keep default */ }
  }))

  await cacheSet(cacheKey, 60, JSON.stringify(defaults))
  return defaults
}
