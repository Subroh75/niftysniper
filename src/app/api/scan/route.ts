import { Redis } from '@upstash/redis'
import { getNifty500Symbols, fetchCandles, fetchMarketPulse } from '@/lib/data'
import { calculateMetrics, calcRegime, calcPositionSize } from '@/lib/engines/core'
import type { StockMetrics, ScanResult, Universe } from '@/types'
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
const LIMITS: Record<Universe, number> = { NIFTY100: 100, NIFTY500: 500, FULL_MARKET: 9999 }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const universe: Universe = body.universe ?? 'NIFTY500'
  const riskInr: number = body.riskInr ?? 5000
  const ck = 'scan:' + universe
  try { const c = await redis.get<string>(ck); if (c) return Response.json({ ...JSON.parse(c), fromCache: true }) } catch (_e) {}
  const enc = new TextEncoder()
  return new Response(new ReadableStream({ async start(ctrl) {
    const send = (d: object) => ctrl.enqueue(enc.encode('data: ' + JSON.stringify(d) + '

'))
    try {
      const { symbols, sectors } = await getNifty500Symbols()
      const tickers = symbols.slice(0, LIMITS[universe])
      send({ type: 'start', total: tickers.length })
      const stocks: StockMetrics[] = []
      for (let i = 0; i < tickers.length; i += 10) {
        const batch = tickers.slice(i, i + 10)
        const settled = await Promise.allSettled(batch.map(async t => { const c = await fetchCandles(t, '2y'); return calculateMetrics(c, t, sectors[t] ?? 'Misc') }))
        for (const r of settled) { if (r.status === 'fulfilled' && r.value) stocks.push(r.value) }
        send({ type: 'progress', done: Math.min(i + 10, tickers.length), total: tickers.length })
        if (i + 10 < tickers.length) await new Promise(r => setTimeout(r, 300))
      }
      const pr = await fetchMarketPulse()
      const vix = pr['^INDIAVIX'] ?? 22.81
      const stocksR = stocks.map(s => { const { stopLoss, qty } = calcPositionSize(s.price, s.atr, vix, riskInr); return { ...s, stopLoss, qty } })
      const { regime, breadthPct } = calcRegime(stocks)
      const nv = pr['^NSEI'] ?? 0, np = pr['^NSEI_prev'] ?? nv, bv = pr['^NSEBANK'] ?? 0, bp = pr['^NSEBANK_prev'] ?? bv
      const pulse = { date: new Date().toLocaleDateString('en-IN'), indiaVix: Math.round(vix*100)/100, fiiNetCr: -5518.39, nifty50: { value: Math.round(nv*100)/100, change: Math.round((nv-np)*100)/100, changePct: np?Math.round(((nv-np)/np)*10000)/100:0 }, niftyBank: { value: Math.round(bv*100)/100, change: Math.round((bv-bp)*100)/100, changePct: bp?Math.round(((bv-bp)/bp)*10000)/100:0 }, sensex: { value: Math.round((pr['^BSESN']??0)*100)/100, change: 0, changePct: 0 }, usdInr: Math.round((pr['USDINR=X']??83.42)*100)/100, regime, breadthPct }
      const result: ScanResult = { stocks: stocksR, pulse, scannedAt: Date.now(), universe, totalScanned: stocks.length }
      try { await redis.setex(ck, 600, JSON.stringify(result)) } catch (_e) {}
      send({ type: 'complete', result }); ctrl.close()
    } catch (err) { send({ type: 'error', message: String(err) }); ctrl.close() }
  }}), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}