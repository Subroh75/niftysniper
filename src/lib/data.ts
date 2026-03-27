import { Redis } from '@upstash/redis'
import type { OHLCV } from './engines/core'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

export async function getNifty500Symbols(): Promise<{ symbols: string[]; sectors: Record<string, string> }> {
  const ck = 'nse:nifty500:symbols'
  try {
    const c = await redis.get<string>(ck)
    if (c) return JSON.parse(c)
  } catch (_e) { /* skip */ }
  try {
    const res = await fetch('https://archives.nseindia.com/content/indices/ind_nifty500list.csv', { headers: { 'User-Agent': UA } })
    const rows = (await res.text()).trim().split('\n').slice(1)
    const symbols: string[] = [], sectors: Record<string, string> = {}
    for (const row of rows) {
      const cols = row.split(',')
      if (cols[2]) { const s = cols[2].trim() + '.NS'; symbols.push(s); sectors[s] = cols[1]?.trim() ?? 'Misc' }
    }
    const result = { symbols, sectors }
    await redis.setex(ck, 86400, JSON.stringify(result))
    return result
  } catch (_e) {
    const core = ['RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS','BHARTIARTL.NS','KOTAKBANK.NS','LT.NS','SBIN.NS','AXISBANK.NS','BAJFINANCE.NS','HINDUNILVR.NS','MARUTI.NS','TATAMOTORS.NS','WIPRO.NS','HCLTECH.NS','TITAN.NS','ONGC.NS','ADANIENT.NS','NTPC.NS']
    return { symbols: core, sectors: Object.fromEntries(core.map(s => [s, 'Core Market'])) }
  }
}

export async function fetchCandles(ticker: string, period = '2y'): Promise<OHLCV[]> {
  const ck = 'yf:candles:' + ticker + ':' + period
  try {
    const c = await redis.get<string>(ck)
    if (c) return JSON.parse(c)
  } catch (_e) { /* skip */ }
  try {
    const ps: Record<string, number> = { '1mo': 2592000, '3mo': 7776000, '6mo': 15552000, '1y': 31536000, '2y': 63072000 }
    const now = Math.floor(Date.now() / 1000)
    const from = now - (ps[period] ?? ps['2y'])
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(ticker) + '?period1=' + from + '&period2=' + now + '&interval=1d&includePrePost=false'
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) return []
    const json = await res.json()
    const r = json?.chart?.result?.[0]
    if (!r) return []
    const ts: number[] = r.timestamp ?? []
    const q = r.indicators?.quote?.[0] ?? {}
    const candles: OHLCV[] = ts.map((t: number, i: number) => ({
      time: t * 1000,
      open: q.open?.[i] ?? 0,
      high: q.high?.[i] ?? 0,
      low: q.low?.[i] ?? 0,
      close: q.close?.[i] ?? 0,
      volume: q.volume?.[i] ?? 0,
    })).filter((c: OHLCV) => c.close > 0)
    if (candles.length > 0) {
      await redis.setex(ck, 3600, JSON.stringify(candles))
    }
    return candles
  } catch (_e) {
    return []
  }
}

export async function fetchMarketPulse(): Promise<Record<string, number>> {
  const ck = 'nse:pulse'
  try {
    const c = await redis.get<string>(ck)
    if (c) return JSON.parse(c)
  } catch (_e) { /* skip */ }
  const indices = ['^NSEI', '^BSESN', '^NSEBANK', '^INDIAVIX', 'USDINR=X']
  const results: Record<string, number> = {}
  await Promise.allSettled(indices.map(async (idx) => {
    try {
      const now = Math.floor(Date.now() / 1000), from = now - 7 * 86400
      const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(idx) + '?period1=' + from + '&period2=' + now + '&interval=1d'
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      const json = await res.json()
      const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []
      const valid = closes.filter(Boolean)
      results[idx] = valid.at(-1) ?? 0
      results[idx + '_prev'] = valid.at(-2) ?? 0
    } catch (_e) { /* skip */ }
  }))
  try { await redis.setex(ck, 60, JSON.stringify(results)) } catch (_e) { /* skip */ }
  return results
}
