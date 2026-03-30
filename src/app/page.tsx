'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { ScanResult, Universe } from '@/types'

const C = {
  bg:'#000000', panel:'#0a0a0a', border:'#1a1a1a',
  orange:'#ff6600', amber:'#ffaa00', green:'#00ff41',
  red:'#ff2222', blue:'#4488ff', white:'#ffffff',
  grey:'#888888', lgrey:'#aaaaaa',
}

const TABS = [
  { id: 'miro',         label: 'Miro'      },
  { id: 'trend',        label: 'Trend'     },
  { id: 'reversion',    label: 'Reversion' },
  { id: 'weekly',       label: 'Weekly'    },
  { id: 'filing',       label: 'AI Lab'    },
  { id: 'intelligence', label: 'AI Debate' },
]

const UNIVERSES = [
  { value: 'NIFTY50'  as Universe, label: 'NIFTY 50',  sub: '~1 MIN', tier: 'free' },
  { value: 'NIFTY200' as Universe, label: 'NIFTY 200', sub: '~4 MIN', tier: 'pro'  },
  { value: 'NIFTY500' as Universe, label: 'NIFTY 500', sub: '~8 MIN', tier: 'pro'  },
]

// --- UI COMPONENTS ---
function PH({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 9, color: C.orange, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>{children}</th>
}

function TD({ children, col, bold }: { children: React.ReactNode; col?: string; bold?: boolean }) {
  return <td style={{ padding: '3px 8px', color: col ?? C.lgrey, fontWeight: bold ? 700 : 400, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{children}</td>
}

function Row({ i, children }: { i: number; children: React.ReactNode }) {
  return <tr style={{ borderBottom: '1px solid #111', background: i % 2 === 0 ? C.bg : '#050505' }}>{children}</tr>
}

function Reco({ reco }: { reco: string }) {
  const col = reco === 'STRONG BUY' ? C.green : reco === 'STRONG SELL' ? C.red : reco === 'BUY' ? '#00cc66' : reco === 'SELL' ? '#ff8800' : C.grey
  return <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: col, letterSpacing: 1 }}>{reco}</span>
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontFamily: 'monospace', fontSize: 11 }}>{msg}</div>
}

// --- TABLES ---
function MiroTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.miroScore - a.miroScore), [stocks])
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH>
          <TH>MIRO SCORE</TH><TH>VOL SURGE</TH><TH>CHG%</TH><TH>SIGNAL</TH><TH>S/L</TH><TH>QTY</TH>
        </tr></thead>
        <tbody>
          {sorted.map((s, i) => (
            <Row key={s.ticker} i={i}>
              <TD col="#444">{i+1}</TD>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <td style={{ padding: '3px 8px', color: C.grey, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector}</td>
              <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
              <td style={{ padding: '3px 8px' }}>
                <span style={{ color: s.miroScore >= 8 ? C.green : s.miroScore >= 5 ? C.amber : C.grey, fontWeight: 700, fontSize: 15 }}>{s.miroScore}</span>
                <span style={{ color: '#333', fontSize: 9 }}>/10</span>
              </td>
              <TD col={s.volSurge >= 3 ? C.green : s.volSurge >= 2 ? C.amber : C.grey}>{s.volSurge.toFixed(2)}x</TD>
              <TD col={s.pctChange >= 0 ? C.green : C.red}>{s.pctChange >= 0 ? '+' : ''}{s.pctChange.toFixed(2)}%</TD>
              <td style={{ padding: '3px 8px' }}><Reco reco={s.recommendation} /></td>
              <TD>{s.stopLoss ? '₹'+s.stopLoss.toFixed(2) : '—'}</TD>
              <TD>{s.qty ?? '—'}</TD>
            </Row>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <Empty msg="NO DATA — RUN AUDIT" />}
    </div>
  )
}

function TrendTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.adxStrength - a.adxStrength), [stocks])
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH>
          <TH>ADX</TH><TH>MA20</TH><TH>MA50</TH><TH>MA200</TH><TH>ALIGNMENT</TH><TH>ATR</TH><TH>S/L</TH>
        </tr></thead>
        <tbody>
          {sorted.map((s, i) => {
            const golden = s.ma50 > s.ma200
            const priceAbove = s.price > s.ma50
            const align = (golden && priceAbove) ? 'GOLDEN' : (golden || priceAbove) ? 'PARTIAL' : 'BROKEN'
            const alignCol = align === 'GOLDEN' ? C.green : align === 'PARTIAL' ? C.amber : C.red
            return (
              <Row key={s.ticker} i={i}>
                <TD col="#444">{i+1}</TD>
                <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
                <td style={{ padding: '3px 8px', color: C.grey, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector}</td>
                <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
                <td style={{ padding: '3px 8px', color: s.adxStrength > 25 ? C.green : s.adxStrength > 15 ? C.amber : C.grey, fontWeight: 700, fontSize: 13 }}>{s.adxStrength.toFixed(1)}</td>
                <TD col="#555">₹{s.ma20.toFixed(1)}</TD>
                <TD col={s.price > s.ma50 ? C.green : C.red}>₹{s.ma50.toFixed(1)}</TD>
                <TD col={s.price > s.ma200 ? C.green : C.red}>₹{s.ma200.toFixed(1)}</TD>
                <TD col={alignCol} bold>{align}</TD>
                <TD>₹{s.atr.toFixed(2)}</TD>
                <TD>{s.stopLoss ? '₹'+s.stopLoss.toFixed(2) : '—'}</TD>
              </Row>
            )
          })}
        </tbody>
      </table>
      {sorted.length === 0 && <Empty msg="NO DATA — RUN AUDIT" />}
    </div>
  )
}

function ReversionTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const filtered = useMemo(() => [...stocks].filter(s => Math.abs(s.zScore) >= 1.5).sort((a, b) => a.zScore - b.zScore), [stocks])
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH>
          <TH>Z-SCORE</TH><TH>MA20</TH><TH>CHG%</TH><TH>SETUP</TH><TH>ATR</TH><TH>S/L</TH><TH>QTY</TH>
        </tr></thead>
        <tbody>
          {filtered.map((s, i) => {
            const setup = s.zScore <= -2.5 ? 'STRONG BUY' : s.zScore <= -1.5 ? 'OVERSOLD' : s.zScore >= 2.5 ? 'STRONG SELL' : 'OVERBOUGHT'
            const setupCol = s.zScore <= -2.5 ? C.green : s.zScore <= -1.5 ? C.amber : s.zScore >= 2.5 ? C.red : '#ff8800'
            return (
              <Row key={s.ticker} i={i}>
                <TD col="#444">{i+1}</TD>
                <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
                <td style={{ padding: '3px 8px', color: C.grey, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector}</td>
                <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
                <td style={{ padding: '3px 8px', color: s.zScore <= -2 ? C.green : s.zScore >= 2 ? C.red : C.amber, fontWeight: 700, fontSize: 13 }}>{s.zScore.toFixed(2)}</td>
                <TD col="#555">₹{s.ma20.toFixed(1)}</TD>
                <TD col={s.pctChange >= 0 ? C.green : C.red}>{s.pctChange >= 0 ? '+' : ''}{s.pctChange.toFixed(2)}%</TD>
                <TD col={setupCol} bold>{setup}</TD>
                <TD>₹{s.atr.toFixed(2)}</TD>
                <TD>{s.stopLoss ? '₹'+s.stopLoss.toFixed(2) : '—'}</TD>
                <TD>{s.qty ?? '—'}</TD>
              </Row>
            )
          })}
        </tbody>
      </table>
      {filtered.length === 0 && <Empty msg="NO REVERSION SETUPS — ALL STOCKS WITHIN NORMAL RANGE" />}
    </div>
  )
}

function WeeklyTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.volSurge - a.volSurge), [stocks])
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH>
          <TH>VOL SURGE</TH><TH>MIRO</TH><TH>CHG%</TH><TH>ATR</TH><TH>PATTERN</TH><TH>S/L</TH><TH>QTY</TH>
        </tr></thead>
        <tbody>
          {sorted.map((s, i) => {
            const accum = s.volSurge >= 3 && Math.abs(s.pctChange) < 1.5
            const pattern = accum ? 'ACCUMULATION' : s.volSurge >= 2 ? 'ELEVATED' : 'NORMAL'
            const patCol  = accum ? C.green : s.volSurge >= 2 ? C.amber : C.grey
            return (
              <Row key={s.ticker} i={i}>
                <TD col="#444">{i+1}</TD>
                <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
                <td style={{ padding: '3px 8px', color: C.grey, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector}</td>
                <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
                <td style={{ padding: '3px 8px', color: s.volSurge >= 3 ? C.green : s.volSurge >= 2 ? C.amber : C.grey, fontWeight: 700, fontSize: 13 }}>{s.volSurge.toFixed(2)}x</td>
                <TD col={s.miroScore >= 8 ? C.green : s.miroScore >= 5 ? C.amber : C.grey} bold>{s.miroScore}</TD>
                <TD col={s.pctChange >= 0 ? C.green : C.red}>{s.pctChange >= 0 ? '+' : ''}{s.pctChange.toFixed(2)}%</TD>
                <TD>₹{s.atr.toFixed(2)}</TD>
                <TD col={patCol} bold>{pattern}</TD>
                <TD>{s.stopLoss ? '₹'+s.stopLoss.toFixed(2) : '—'}</TD>
                <TD>{s.qty ?? '—'}</TD>
              </Row>
            )
          })}
        </tbody>
      </table>
      {sorted.length === 0 && <Empty msg="NO DATA — RUN AUDIT" />}
    </div>
  )
}

// --- AI PANEL ---
function AIPanel({ tickers, pulse, mode }: { tickers: string[]; pulse: ScanResult['pulse']; mode: 'debate'|'filing' }) {
  const [ticker, setTicker] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [content, setContent] = useState('')
  const abortRef = useRef<AbortController|null>(null)

  // FIX: Sync selection when ticker list populates after a scan
  useEffect(() => {
    if (!ticker && tickers.length > 0) setTicker(tickers[0])
  }, [tickers, ticker])

  async function run() {
    if (streaming) { abortRef.current?.abort(); setStreaming(false); return }
    setContent(''); setStreaming(true)
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, vix: pulse.indiaVix, regime: pulse.regime, fiiNet: pulse.fiiNetCr, mode }),
        signal: abortRef.current.signal,
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let streamBuffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        streamBuffer += dec.decode(value, { stream: true })
        const lines = streamBuffer.split('\n')
        streamBuffer = lines.pop() || '' 

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') break
          try {
            const { text } = JSON.parse(dataStr)
            setContent(prev => prev + text)
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') { setContent(p => p + '\n\n[ERROR] ' + e.message) }
    } finally { setStreaming(false) }
  }

  const label    = mode === 'debate' ? 'AI DEBATE — INVESTMENT COUNCIL' : 'AI LAB — SEBI FILING AUDIT'
  const btnLabel = streaming ? 'STOP' : mode === 'debate' ? 'SUMMON COUNCIL' : 'RUN AUDIT'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid ' + C.orange, background: '#0d0400' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.orange, letterSpacing: 2, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12, background: '#060606' }}>
        <select value={ticker} onChange={e => { setTicker(e.target.value); setContent('') }}
          style={{ background: '#111', border: '1px solid #333', color: C.amber, fontFamily: 'monospace', fontSize: 10, padding: '3px 6px', width: 160 }}>
          {tickers.map(t => <option key={t} value={t}>{t.replace('.NS','')}</option>)}
        </select>
        <button onClick={run} style
