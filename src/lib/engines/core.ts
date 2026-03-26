import type { StockMetrics, Recommendation } from '@/types'

export interface OHLCV {
  open: number; high: number; low: number; close: number; volume: number; time: number
}

export function sma(values: number[], period: number): number {
  const slice = values.slice(-period)
  if (slice.length < period) return 0
  return slice.reduce((a, b) => a + b, 0) / period
}

export function calcATR(candles: OHLCV[], period = 14): number {
  if (candles.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / period
}

export function calcADX(candles: OHLCV[], period = 14): number {
  if (candles.length < period * 2) return 0
  const trs: number[] = [], plusDMs: number[] = [], minusDMs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low
    const ph = candles[i - 1].high, pl = candles[i - 1].low, pc = candles[i - 1].close
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
    const upMove = h - ph, downMove = pl - l
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0)
  }
  let smTR = trs.slice(0, period).reduce((a, b) => a + b, 0)
  let smPlus = plusDMs.slice(0, period).reduce((a, b) => a + b, 0)
  let smMinus = minusDMs.slice(0, period).reduce((a, b) => a + b, 0)
  const dxArr: number[] = []
  for (let i = period; i < trs.length; i++) {
    smTR = smTR - smTR / period + trs[i]
    smPlus = smPlus - smPlus / period + plusDMs[i]
    smMinus = smMinus - smMinus / period + minusDMs[i]
    const pdi = (smPlus / smTR) * 100, mdi = (smMinus / smTR) * 100
    const sum = pdi + mdi
    dxArr.push(sum > 0 ? (Math.abs(pdi - mdi) / sum) * 100 : 0)
  }
  const slice = dxArr.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / Math.min(period, slice.length)
}

export function calcZScore(closes: number[], period = 20): number {
  const slice = closes.slice(-period)
  if (slice.length < period) return 0
  const mean = slice.reduce((a, b) => a + b, 0) / period
  const std = Math.sqrt(slice.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / period)
  return std > 0 ? (closes[closes.length - 1] - mean) / std : 0
}

export function calcMiroScore(volSurge: number, pctChange: number): number {
  return 2 + (volSurge > 2.0 ? 5 : 0) + (pctChange > 0.01 ? 3 : 0)
}

export function getRecommendation(pctChange: number, volSurge: number, zScore: number): Recommendation {
  if (pctChange > 0.02 && volSurge > 2.2) return 'STRONG BUY'
  if (pctChange < -0.02 && volSurge > 2.2) return 'STRONG SELL'
  if (zScore < -2.2) return 'REVERSION BUY'
  return 'NEUTRAL'
}

export function calculateMetrics(candles: OHLCV[], ticker: string, sector: string): StockMetrics | null {
  try {
    if (candles.length < 200) return null
    const closes = candles.map(c => c.close)
    const volumes = candles.map(c => c.volume)
    const cp = closes[closes.length - 1]
    const prevClose = closes[closes.length - 2]
    const ma20 = sma(closes, 20), ma50 = sma(closes, 50), ma200 = sma(closes, 200)
    const adx = calcADX(candles)
    const zScore = calcZScore(closes)
    const currentVol = volumes[volumes.length - 1]
    const avgVol20 = sma(volumes, 20)
    const volSurge = avgVol20 > 0 ? currentVol / avgVol20 : 0
    const pctChange = prevClose > 0 ? (cp - prevClose) / prevClose : 0
    const atr = calcATR(candles)
    return {
      ticker, sector,
      price: Math.round(cp * 100) / 100,
      recommendation: getRecommendation(pctChange, volSurge, zScore),
      miroScore: calcMiroScore(volSurge, pctChange),
      zScore: Math.round(zScore * 100) / 100,
      adxStrength: Math.round(adx * 10) / 10,
      volSurge: Math.round(volSurge * 100) / 100,
      ma20: Math.round(ma20 * 100) / 100,
      ma50: Math.round(ma50 * 100) / 100,
      ma200: Math.round(ma200 * 100) / 100,
      atr: Math.round(atr * 100) / 100,
      pctChange: Math.round(pctChange * 10000) / 100,
    }
  } catch (_e) { return null }
}

export function calcPositionSize(price: number, atr: number, vix: number, riskInr: number) {
  const slMult = vix > 20 ? 3.0 : 2.0
  const stopLoss = price - slMult * atr
  const riskPerShare = price - stopLoss
  return { stopLoss: Math.round(stopLoss * 100) / 100, qty: riskPerShare > 0 ? Math.floor(riskInr / riskPerShare) : 0 }
}

export function calcRegime(stocks: StockMetrics[]) {
  if (!stocks.length) return { regime: 'NEUTRAL' as const, breadthPct: 50 }
  const above200 = stocks.filter(s => s.ma200 < s.price).length
  const b = Math.round((above200 / stocks.length) * 1000) / 10
  return { regime: (b > 60 ? 'BULLISH' : b < 40 ? 'BEARISH' : 'NEUTRAL') as 'BULLISH'|'NEUTRAL'|'BEARISH', breadthPct: b }
}
