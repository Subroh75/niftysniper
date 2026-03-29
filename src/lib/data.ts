// ─── Safe Redis ───────────────────────────────────────────────────────────────
let _redis: import('@upstash/redis').Redis | null = null
async function getRedis() {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL ?? ''
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
  if (!url.startsWith('https://') || !token) return null
  try {
    const { Redis } = await import('@upstash/redis')
    _redis = new Redis({ url, token })
    return _redis
  } catch { return null }
}
async function cacheGet(key: string): Promise<string | null> {
  try { const r = await getRedis(); if (!r) return null; const v = await r.get<string>(key); return v ?? null } catch { return null }
}
async function cacheSet(key: string, ttl: number, val: string): Promise<void> {
  try { const r = await getRedis(); if (!r) return; await r.setex(key, ttl, val) } catch {}
}

// ─── OHLCV type ───────────────────────────────────────────────────────────────
export interface OHLCV { open: number; high: number; low: number; close: number; volume: number; time: number }

// ─── Nifty 50 ─────────────────────────────────────────────────────────────────
const NIFTY50: Record<string, string> = {
  'RELIANCE.NS':'Energy', 'TCS.NS':'IT', 'HDFCBANK.NS':'Financials', 'INFY.NS':'IT',
  'ICICIBANK.NS':'Financials','BHARTIARTL.NS':'Telecom', 'KOTAKBANK.NS':'Financials','SBIN.NS':'Financials',
  'HINDUNILVR.NS':'FMCG', 'AXISBANK.NS':'Financials', 'LT.NS':'Industrials', 'MARUTI.NS':'Auto',
  'HCLTECH.NS':'IT', 'BAJFINANCE.NS':'Financials','WIPRO.NS':'IT', 'TITAN.NS':'Consumer',
  'SUNPHARMA.NS':'Pharma', 'NTPC.NS':'Utilities', 'POWERGRID.NS':'Utilities', 'TATAMOTORS.NS':'Auto',
  'TATASTEEL.NS':'Metals', 'TECHM.NS':'IT', 'CIPLA.NS':'Pharma', 'DRREDDY.NS':'Pharma',
  'APOLLOHOSP.NS':'Pharma', 'BAJAJFINSV.NS':'Financials','JSWSTEEL.NS':'Metals', 'HINDALCO.NS':'Metals',
  'NESTLEIND.NS':'FMCG', 'DIVISLAB.NS':'Pharma', 'EICHERMOT.NS':'Auto', 'BPCL.NS':'Energy',
  'COALINDIA.NS':'Energy', 'HEROMOTOCO.NS':'Auto', 'BRITANNIA.NS':'FMCG', 'INDUSINDBK.NS':'Financials',
  'TATACONSUM.NS':'FMCG', 'GRASIM.NS':'Materials', 'ASIANPAINT.NS':'Consumer', 'ULTRACEMCO.NS':'Materials',
  'ONGC.NS':'Energy', 'ITC.NS':'FMCG', 'LTIM.NS':'IT', 'ADANIENT.NS':'Industrials',
  'ADANIPORTS.NS':'Industrials', 'TRENT.NS':'Retail', 'ZOMATO.NS':'Consumer', 'BAJAJ-AUTO.NS':'Auto',
  'SHRIRAMFIN.NS':'Financials','BEL.NS':'Industrials',
}

// ─── Additional Nifty 200 constituents ────────────────────────────────────────
const NIFTY200_EXTRA: Record<string, string> = {
  'PIDILITIND.NS':'Consumer', 'HAVELLS.NS':'Consumer', 'SIEMENS.NS':'Industrials', 'ABB.NS':'Industrials',
  'POLYCAB.NS':'Industrials','DLF.NS':'Realty', 'LODHA.NS':'Realty', 'GODREJCP.NS':'FMCG', 'MARICO.NS':'FMCG',
  'VOLTAS.NS':'Consumer', 'TORNTPHARM.NS':'Pharma', 'ALKEM.NS':'Pharma', 'HDFCLIFE.NS':'Financials',
  'ICICIGI.NS':'Financials', '360ONE.NS':'Financials', 'KAYNES.NS':'IT', 'DIXON.NS':'IT',
  'PFC.NS':'Financials', 'RECLTD.NS':'Financials', 'IRFC.NS':'Financials', 'TATAPOWER.NS':'Utilities',
  'BANKBARODA.NS':'Financials','LUPIN.NS':'Pharma', 'IPCALAB.NS':'Pharma', 'MUTHOOTFIN.NS':'Financials',
  'CHOLAFIN.NS':'Financials','NAUKRI.NS':'IT', 'BOSCHLTD.NS':'Auto', 'CUMMINSIND.NS':'Industrials',
  'LLOYDSME.NS':'Consumer', 'AUROPHARMA.NS':'Pharma', 'BIOCON.NS':'Pharma', 'ABBOTINDIA.NS':'Pharma',
  'MANKIND.NS':'Pharma', 'LALPATHLAB.NS':'Pharma', 'MAXHEALTH.NS':'Pharma', 'FORTIS.NS':'Pharma',
  'MPHASIS.NS':'IT', 'PERSISTENT.NS':'IT', 'COFORGE.NS':'IT', 'LTTS.NS':'IT', 'OFSS.NS':'IT',
  'TATAELXSI.NS':'IT', 'KPIT.NS':'IT', 'ZENSARTECH.NS':'IT', 'HAPPSTMNDS.NS':'IT',
  'SBICARD.NS':'Financials', 'ABCAPITAL.NS':'Financials','LICIHSGFIN.NS':'Financials',
  'MANAPPURAM.NS':'Financials','SUNDARMFIN.NS':'Financials','BAJAJHFL.NS':'Financials',
  'PNBHOUSING.NS':'Financials','CANFINHOME.NS':'Financials','HDFCAMC.NS':'Financials',
  'NIPPONLMF.NS':'Financials', 'ANANDRATHI.NS':'Financials','MOTILALOFS.NS':'Financials',
  'ANGELONE.NS':'Financials', 'CDSL.NS':'Financials', 'BSE.NS':'Financials',
  'PAGEIND.NS':'Consumer', 'RELAXO.NS':'Consumer', 'BATA.NS':'Consumer', 'CROMPTON.NS':'Consumer',
  'ORIENTELEC.NS':'Consumer', 'BLUESTARCO.NS':'Consumer', 'AMBER.NS':'Consumer', 'WHIRLPOOL.NS':'Consumer',
  'KANSAINER.NS':'Consumer', 'BERGERPAINTS.NS':'Consumer','AKZONOBEL.NS':'Consumer',
  'SULA.NS':'FMCG', 'UNITDSPR.NS':'FMCG', 'MCDOWELL-N.NS':'FMCG', 'RADICO.NS':'FMCG',
  'VSTIND.NS':'FMCG', 'COLPAL.NS':'FMCG', 'DABUR.NS':'FMCG', 'EMAMILTD.NS':'FMCG',
  'JYOTHYLAB.NS':'FMCG', 'BAJAJCON.NS':'FMCG',
  'GUJGASLTD.NS':'Energy', 'IGL.NS':'Energy', 'MGL.NS':'Energy', 'PETRONET.NS':'Energy',
  'GAIL.NS':'Energy', 'HINDPETRO.NS':'Energy', 'MRPL.NS':'Energy', 'IOC.NS':'Energy',
  'ATGL.NS':'Energy', 'OIL.NS':'Energy',
  'NHPC.NS':'Utilities', 'CESC.NS':'Utilities', 'TORNTPOWER.NS':'Utilities',
  'ADANIGREEN.NS':'Utilities','ADANIENSOL.NS':'Utilities','JSWENERGY.NS':'Utilities',
  'INOXWIND.NS':'Utilities', 'SUZLON.NS':'Utilities',
  'GPIL.NS':'Metals', 'NATIONALUM.NS':'Metals', 'NMDC.NS':'Metals', 'VEDL.NS':'Metals',
  'SAIL.NS':'Metals', 'APLAPOLLO.NS':'Metals', 'JINDALSTEL.NS':'Metals',
  'WELSPUNLIV.NS':'Industrials','RKFORGE.NS':'Industrials', 'GRINDWELL.NS':'Industrials',
  'SCHAEFFLER.NS':'Industrials','TIMKEN.NS':'Industrials', 'SKFINDIA.NS':'Industrials',
  'ASTRAL.NS':'Industrials', 'SUPREMEIND.NS':'Industrials', 'FINOLEX.NS':'Industrials',
  'KEI.NS':'Industrials', 'RRKABEL.NS':'Industrials', 'INDIAGRID.NS':'Financials',
  'POWMECH.NS':'Industrials','KEC.NS':'Industrials', 'KALPATPOWR.NS':'Industrials',
  'BHEL.NS':'Industrials', 'THERMAXLTD.NS':'Industrials', 'GMRINFRA.NS':'Industrials',
  'IRB.NS':'Industrials', 'NHAI.NS':'Industrials',
  'GODREJPROP.NS':'Realty', 'PRESTIGE.NS':'Realty', 'OBEROIRLTY.NS':'Realty',
  'PHOENIXLTD.NS':'Realty', 'SOBHA.NS':'Realty', 'BRIGADE.NS':'Realty', 'SUNTECK.NS':'Realty',
  'MAHINDCIE.NS':'Auto', 'MOTHERSON.NS':'Auto', 'BALKRISIND.NS':'Auto', 'CEATLTD.NS':'Auto',
  'APOLLOTYRE.NS':'Auto', 'MRF.NS':'Auto', 'EXIDEIND.NS':'Auto', 'AMARAJABAT.NS':'Auto',
  'SUNDRMFAST.NS':'Auto', 'HAPPYFORGE.NS':'Industrials',
}

// ─── Additional Nifty 500 constituents ────────────────────────────────────────
const NIFTY500_EXTRA: Record<string, string> = {
  'TBOTEK.NS':'IT', 'GODFRYPHLP.NS':'FMCG', 'BLS.NS':'IT', 'MEDANTA.NS':'Pharma',
  'THELEELA.NS':'Consumer', 'KALYANKJIL.NS':'Consumer', 'AAVAS.NS':'Financials',
  'HOMEFIRST.NS':'Financials','APTUS.NS':'Financials', 'RBLBANK.NS':'Financials',
  'FEDERALBNK.NS':'Financials','CSBBANK.NS':'Financials', 'DCBBANK.NS':'Financials',
  'UJJIVANSFB.NS':'Financials','EQUITASBNK.NS':'Financials',
  'SURYAROSNI.NS':'Consumer', 'KIRLOSKAR.NS':'Industrials','ELGIEQUIP.NS':'Industrials',
  'ESCORTS.NS':'Auto', 'TVSMOTORS.NS':'Auto', 'HEROFINCO.NS':'Financials',
  'TATACHEM.NS':'Materials', 'GHCL.NS':'Materials', 'DEEPAKNI.NS':'Materials',
  'AARTI.NS':'Materials', 'GALAXYSURF.NS':'Materials', 'AARTIDRUGS.NS':'Pharma',
  'JB.NS':'Pharma', 'GRANULES.NS':'Pharma', 'ALKYLAMINE.NS':'Materials',
  'FINEORG.NS':'Materials', 'NOCIL.NS':'Materials', 'VINATI.NS':'Materials',
  'NACLIND.NS':'Materials', 'NUVAMA.NS':'Financials', 'CAMS.NS':'Financials',
  'KFINTECH.NS':'Financials', 'MASFIN.NS':'Financials', 'SPANDANA.NS':'Financials',
  'CREDITACC.NS':'Financials', 'ARMANFIN.NS':'Financials', 'UGROCAP.NS':'Financials',
  'FIVESTAR.NS':'Financials', 'IDFCFIRSTB.NS':'Financials','BANDHANBNK.NS':'Financials',
  'SURYODAY.NS':'Financials', 'MASTECH.NS':'IT', 'CYIENT.NS':'IT', 'NIITTECH.NS':'IT',
  'RATEGAIN.NS':'IT', 'CARTRADE.NS':'Consumer', 'NYKAA.NS':'Consumer',
  'POLICYBZR.NS':'Financials','PAYTM.NS':'Financials', 'DELHIVERY.NS':'Industrials',
  'INDIGRID.NS':'Utilities', 'STLTECH.NS':'IT', 'ZEEL.NS':'Consumer', 'PVRINOX.NS':'Consumer',
  'INOXLEISUR.NS':'Consumer','NAZARA.NS':'Consumer', 'HATHWAY.NS':'Consumer', 'DEN.NS':'Consumer',
  'NETWORK18.NS':'Consumer', 'TV18BRDCST.NS':'Consumer', 'SUNTV.NS':'Consumer',
  'JAGRAN.NS':'Consumer', 'HINDMOTORS.NS':'Auto', 'SWANENERGY.NS':'Energy',
  'CASTROLIND.NS':'Energy', 'GULFOILLUB.NS':'Energy', 'SAVITA.NS':'Energy',
  'HPCL.NS':'Energy', 'CHENNPETRO.NS':'Energy',
  'GESHIP.NS':'Industrials', 'SCI.NS':'Industrials', 'COCHINSHIP.NS':'Industrials',
  'GRSE.NS':'Industrials', 'MAZAGON.NS':'Industrials','HAL.NS':'Industrials',
  'BDL.NS':'Industrials', 'BEML.NS':'Industrials', 'DATAPATTNS.NS':'IT',
  'CENTUM.NS':'IT', 'IDEAFORGE.NS':'IT', 'PARAS.NS':'Pharma', 'IOLCP.NS':'Pharma',
  'SUVEN.NS':'Pharma', 'HESTER.NS':'Pharma', 'LAURUSLABS.NS':'Pharma',
  'NATCOPHARM.NS':'Pharma', 'SOLARA.NS':'Pharma', 'SEQUENT.NS':'Pharma',
  'SHILPAMED.NS':'Pharma', 'RAINBOW.NS':'Pharma', 'KRSNAA.NS':'Pharma',
  'METROPOLIS.NS':'Pharma', 'THYROCARE.NS':'Pharma',
  'INDIAMART.NS':'IT', 'JUSTDIAL.NS':'IT', 'MAPMYINDIA.NS':'IT', 'ROUTE.NS':'IT',
  'TANLA.NS':'IT', 'ONMOBILE.NS':'IT', 'INTELLECT.NS':'IT', 'NUCLEUS.NS':'IT', 'MASTEK.NS':'IT',
}

// ─── Merged universe objects ──────────────────────────────────────────────────
const NIFTY200 = { ...NIFTY50, ...NIFTY200_EXTRA }
const NIFTY500 = { ...NIFTY200, ...NIFTY500_EXTRA }

// ─── Seed prices for simulation fallback ──────────────────────────────────────
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
  'TBOTEK.NS':1090,'GODFRYPHLP.NS':2054,'IPCALAB.NS':1570,'GPIL.NS':277,
  'BLS.NS':264,'MEDANTA.NS':1011,'THELEELA.NS':414,'KALYANKJIL.NS':391,
}

// ─── Deterministic simulation fallback ───────────────────────────────────────
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
      low:  Math.round(Math.min(o, c) * (1 - rng(d + 2) * 0.009) * 100) / 100,
      close: c,
      volume: Math.floor(200000 + rng(d + 3) * 9000000),
    })
  }
  return out
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getNifty500Symbols(universe: 'NIFTY50' | 'NIFTY200' | 'NIFTY500' = 'NIFTY50'): { symbols: string[]; sectors: Record<string, string> } {
  const map = universe === 'NIFTY50' ? NIFTY50 : universe === 'NIFTY200' ? NIFTY200 : NIFTY500
  return { symbols: Object.keys(map), sectors: map }
}

// ─── fetchCandles via yahoo-finance2 (dynamic import — fixes Vercel build) ───
export async function fetchCandles(nseTicker: string, _period = '1y'): Promise<OHLCV[]> {
  const key = 'yf:v1:' + nseTicker
  const cached = await cacheGet(key)
  if (cached) return JSON.parse(cached) as OHLCV[]
  try {
    const yahooFinance = (await import('yahoo-finance2')).default
    const result = await yahooFinance.historical(nseTicker, {
      period1: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
      period2: new Date(),
      interval: '1d',
    })
    if (!result || result.length < 20) return sim(nseTicker)
    const candles: OHLCV[] = result
      .filter(r => r.open && r.close && r.volume)
      .map(r => ({
        time:   r.date.getTime(),
        open:   Math.round(r.open! * 100) / 100,
        high:   Math.round(r.high * 100) / 100,
        low:    Math.round(r.low * 100) / 100,
        close:  Math.round(r.close * 100) / 100,
        volume: r.volume ?? 0,
      }))
      .sort((a, b) => a.time - b.time)
    await cacheSet(key, 3600, JSON.stringify(candles))
    return candles
  } catch {
    return sim(nseTicker)
  }
}

// ─── fetchMarketPulse via yahoo-finance2 (dynamic import) ─────────────────────
export async function fetchMarketPulse(): Promise<Record<string, number>> {
  const key = 'yf:pulse:v1'
  const cached = await cacheGet(key)
  if (cached) return JSON.parse(cached) as Record<string, number>
  const defaults: Record<string, number> = {
    '^NSEI': 24117, '^NSEI_prev': 23934, '^NSEBANK': 51842,
    '^BSESN': 79486, '^INDIAVIX': 22.81, 'USDINR=X': 83.42,
  }
  try {
    const yahooFinance = (await import('yahoo-finance2')).default
    const quotes = await yahooFinance.quote(['^NSEI', '^NSEBANK', '^BSESN', '^INDIAVIX', 'USDINR=X'])
    for (const q of quotes) {
      if (q.regularMarketPrice) {
        defaults[q.symbol] = Math.round(q.regularMarketPrice * 100) / 100
      }
      if (q.symbol === '^NSEI' && q.regularMarketPreviousClose) {
        defaults['^NSEI_prev'] = Math.round(q.regularMarketPreviousClose * 100) / 100
      }
    }
  } catch { /* use defaults */ }
  await cacheSet(key, 60, JSON.stringify(defaults))
  return defaults
}