import type { StockMetrics, Recommendation } from '@/types'

export interface OHLCV {
  open: number; high: number; low: number; close: number; volume: number; time: number
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

export function sma(values: number[], period: number): number {
  if (values.length < period) return 0
  const sl = values.slice(-period)
  return sl.reduce((a, b) => a + b, 0) / period
}

export function calcATR(candles: OHLCV[], period = 14): number {
  if (candles.length < period + 1) return 0
  const trs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const { high: h, low: l } = candles[i]
    const pc = candles[i - 1].close
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
  }
  const slice = trs.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

export function calcADX(candles: OHLCV[], period = 14): number {
  if (candles.length < period * 2) return 0
  const trs: number[] = [], plusDMs: number[] = [], minusDMs: number[] = []
  for (let i = 1; i < candles.length; i++) {
    const { high: h, low: l } = candles[i]
    const { high: ph, low: pl, close: pc } = candles[i - 1]
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)))
    const up = h - ph, down = pl - l
    plusDMs.push(up > down && up > 0 ? up : 0)
    minusDMs.push(down > up && down > 0 ? down : 0)
  }
  let smTR = trs.slice(0, period).reduce((a, b) => a + b, 0)
  let smP  = plusDMs.slice(0, period).reduce((a, b) => a + b, 0)
  let smM  = minusDMs.slice(0, period).reduce((a, b) => a + b, 0)
  const dxArr: number[] = []
  for (let i = period; i < trs.length; i++) {
    smTR = smTR - smTR / period + trs[i]
    smP  = smP  - smP  / period + plusDMs[i]
    smM  = smM  - smM  / period + minusDMs[i]
    const pdi = smTR > 0 ? (smP / smTR) * 100 : 0
    const mdi = smTR > 0 ? (smM / smTR) * 100 : 0
    const sum = pdi + mdi
    dxArr.push(sum > 0 ? (Math.abs(pdi - mdi) / sum) * 100 : 0)
  }
  const sl = dxArr.slice(-period)
  return sl.reduce((a, b) => a + b, 0) / Math.min(period, sl.length)
}

export function calcZScore(closes: number[], period = 20): number {
  if (closes.length < period) return 0
  const sl = closes.slice(-period)
  const mean = sl.reduce((a, b) => a + b, 0) / period
  const std  = Math.sqrt(sl.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / period)
  return std > 0 ? (closes[closes.length - 1] - mean) / std : 0
}

// ─── Miro Score (0–10) ────────────────────────────────────────────────────────
// Detects institutional hot money: price move ≥2% AND vol surge ≥2×

export function calcMiroScore(volSurge: number, pctChange: number): number {
  let score = 0

  // Volume component (0–5)
  if      (volSurge >= 5)   score += 5
  else if (volSurge >= 4)   score += 4
  else if (volSurge >= 3)   score += 3
  else if (volSurge >= 2.5) score += 2.5
  else if (volSurge >= 2)   score += 2
  else if (volSurge >= 1.5) score += 1

  // Price velocity component (0–5)
  const absPct = Math.abs(pctChange)
  if      (absPct >= 0.05)  score += 5
  else if (absPct >= 0.04)  score += 4
  else if (absPct >= 0.03)  score += 3
  else if (absPct >= 0.02)  score += 2
  else if (absPct >= 0.01)  score += 1

  // Penalise negative price moves
  if (pctChange < -0.01) score = Math.max(0, score - 2)
  if (pctChange < -0.03) score = Math.max(0, score - 2)

  return Math.min(10, Math.round(score * 10) / 10)
}

// ─── Recommendation ───────────────────────────────────────────────────────────
// Z-score signals fire at ±2.5 as requested

export function getRecommendation(
  pctChange: number,
  volSurge: number,
  zScore: number
): Recommendation {
  // Mean reversion signals — fire at ±2.5
  if (zScore <= -2.5) return 'STRONG BUY'   // extremely oversold
  if (zScore >= 2.5)  return 'STRONG SELL'  // extremely overbought

  // Momentum signals
  if (pctChange > 0.02 && volSurge > 2.2) return 'STRONG BUY'
  if (pctChange > 0.01 && volSurge > 1.8) return 'BUY'
  if (pctChange < -0.02 && volSurge > 2.2) return 'STRONG SELL'
  if (pctChange < -0.01 && volSurge > 1.8) return 'SELL'

  return 'NEUTRAL'
}

// ─── Full metrics ─────────────────────────────────────────────────────────────

export function calculateMetrics(
  candles: OHLCV[],
  ticker: string,
  sector: string
): StockMetrics | null {
  try {
    if (candles.length < 30) return null

    const closes  = candles.map(c => c.close)
    const volumes = candles.map(c => c.volume)
    const cp      = closes[closes.length - 1]
    const prevClose = closes[closes.length - 2] ?? cp

    const ma20  = sma(closes, 20)
    const ma50  = sma(closes, Math.min(50, candles.length))
    const ma200 = sma(closes, Math.min(200, candles.length))
    const adx   = calcADX(candles)

    const zScore = calcZScore(closes, 20)

    const currentVol = volumes[volumes.length - 1]
    const avgVol20   = sma(volumes, 20)
    const volSurge   = avgVol20 > 0 ? currentVol / avgVol20 : 0
    const pctChange  = prevClose > 0 ? (cp - prevClose) / prevClose : 0
    const atr        = calcATR(candles)

    return {
      ticker,
      sector,
      price:          Math.round(cp * 100) / 100,
      recommendation: getRecommendation(pctChange, volSurge, zScore),
      miroScore:      calcMiroScore(volSurge, pctChange),
      zScore:         Math.round(zScore * 100) / 100,
      adxStrength:    Math.round(adx * 10) / 10,
      volSurge:       Math.round(volSurge * 100) / 100,
      ma20:           Math.round(ma20 * 100) / 100,
      ma50:           Math.round(ma50 * 100) / 100,
      ma200:          Math.round(ma200 * 100) / 100,
      atr:            Math.round(atr * 100) / 100,
      pctChange:      Math.round(pctChange * 10000) / 100,
    }
  } catch { return null }
}

// ─── Position sizing ──────────────────────────────────────────────────────────

export function calcPositionSize(
  price: number,
  atr: number,
  vix: number,
  riskInr: number
): { stopLoss: number; qty: number } {
  // Wider stop in high-VIX environments
  const slMult    = vix > 25 ? 3.0 : vix > 20 ? 2.5 : 2.0
  const rawStop   = price - slMult * (atr || price * 0.02)
  const stopLoss  = Math.max(rawStop, price * 0.92) // never more than 8% away
  const riskPer   = Math.max(price - stopLoss, 1)
  return {
    stopLoss: Math.round(stopLoss * 100) / 100,
    qty: Math.floor(riskInr / riskPer),
  }
}

// ─── Market regime (breadth) ──────────────────────────────────────────────────

export function calcRegime(stocks: StockMetrics[]): {
  regime: 'BULLISH' | 'NEUTRAL' | 'BEARISH'
  breadthPct: number
} {
  if (!stocks.length) return { regime: 'NEUTRAL', breadthPct: 50 }
  const above200 = stocks.filter(s => s.ma200 > 0 && s.price > s.ma200).length
  const b = Math.round((above200 / stocks.length) * 1000) / 10
  return {
    regime: b > 60 ? 'BULLISH' : b < 40 ? 'BEARISH' : 'NEUTRAL',
    breadthPct: b,
  }
}
