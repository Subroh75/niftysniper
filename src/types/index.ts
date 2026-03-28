export type Recommendation = 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL'
export type Regime = 'BULLISH' | 'NEUTRAL' | 'BEARISH'
export type Universe = 'NIFTY50' | 'NIFTY200' | 'NIFTY500' | 'NIFTY100' | 'FULL_MARKET'

export interface StockMetrics {
  ticker:         string
  sector:         string
  price:          number
  recommendation: Recommendation
  miroScore:      number
  zScore:         number
  adxStrength:    number
  volSurge:       number
  ma20:           number
  ma50:           number
  ma200:          number
  atr:            number
  pctChange:      number
  stopLoss?:      number
  qty?:           number
}

export interface MarketPulse {
  date:       string
  indiaVix:   number
  fiiNetCr:   number
  nifty50:    { value: number; change: number; changePct: number }
  niftyBank:  { value: number; change: number; changePct: number }
  sensex:     { value: number; change: number; changePct: number }
  usdInr:     number
  regime:     Regime
  breadthPct: number
}

export interface ScanResult {
  stocks:       StockMetrics[]
  pulse:        MarketPulse
  scannedAt:    number
  universe:     Universe
  totalScanned: number
}
