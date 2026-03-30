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

// --- SHARED UI COMPONENTS ---
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

// --- TAB SPECIFIC TABLES ---
function MiroTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.miroScore - a.miroScore), [stocks])
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>PRICE</TH><TH>MIRO SCORE</TH><TH>VOL SURGE</TH><TH>CHG%</TH><TH>SIGNAL</TH>
        </tr></thead>
        <tbody>
          {sorted.map((s, i) => (
            <Row key={s.ticker} i={i}>
              <TD col="#444">{i+1}</TD>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={C.white}>₹{s.price.toFixed(2)}</TD>
              <TD col={s.miroScore >= 8 ? C.green : C.amber} bold>{s.miroScore}/10</TD>
              <TD col={s.volSurge >= 2 ? C.green : C.grey}>{s.volSurge.toFixed(2)}x</TD>
              <TD col={s.pctChange >= 0 ? C.green : C.red}>{s.pctChange.toFixed(2)}%</TD>
              <TD><Reco reco={s.recommendation} /></TD>
            </Row>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrendTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.adxStrength - a.adxStrength), [stocks])
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>ADX</TH><TH>MA50</TH><TH>MA200</TH><TH>ALIGNMENT</TH>
        </tr></thead>
        <tbody>
          {sorted.map((s, i) => {
            const golden = s.ma50 > s.ma200;
            return (
              <Row key={s.ticker} i={i}>
                <TD col="#444">{i+1}</TD>
                <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
                <TD col={s.adxStrength > 25 ? C.green : C.grey}>{s.adxStrength.toFixed(1)}</TD>
                <TD>₹{s.ma50.toFixed(1)}</TD>
                <TD>₹{s.ma200.toFixed(1)}</TD>
                <TD col={golden ? C.green : C.red}>{golden ? 'GOLDEN' : 'BEARISH'}</TD>
              </Row>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// --- AI PANEL (FIXED) ---
function AIPanel({ tickers, pulse, mode }: { tickers: string[]; pulse: any; mode: string }) {
  const [ticker, setTicker] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [content, setContent] = useState('')
  const abortRef = useRef<AbortController|null>(null)

  // CRITICAL FIX: Update ticker selection when results load
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
        body: JSON.stringify({ ticker, vix: pulse.indiaVix, regime: pulse.regime, mode }),
        signal: abortRef.current.signal,
      })
      const reader = res.body?.getReader()
      if (!reader) return
      const dec = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += dec.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try { 
              const { text } = JSON.parse(data)
              setContent(prev => prev + text)
            } catch(e) {}
          }
        }
      }
    } catch (e) {} finally { setStreaming(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #222', display: 'flex', gap: 10 }}>
        <select value={ticker} onChange={e => setTicker(e.target.value)} style={{ background: '#111', color: C.orange, border: '1px solid #333', fontFamily: 'monospace' }}>
          {tickers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={run} style={{ background: C.orange, color: '#000', border: 'none', padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }}>
          {streaming ? 'STOP' : 'EXECUTE'}
        </button>
      </div>
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12, color: C.lgrey, whiteSpace: 'pre-wrap' }}>
        {content || (streaming ? 'Initializing AI...' : 'Select ticker and press Execute.')}
      </div>
    </div>
  )
}

// --- MAIN DASHBOARD ---
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('miro')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [universe, setUniverse] = useState<Universe>('NIFTY50')

  async function runScan() {
    setScanning(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, riskInr: 5000 })
      })
      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = dec.decode(value).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const d = JSON.parse(line.slice(6))
            if (d.type === 'complete') setResult(d.result)
          }
        }
      }
    } catch (e) {} finally { setScanning(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.white, fontFamily: 'monospace' }}>
      {/* HEADER */}
      <div style={{ height: 40, background: C.orange, display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between' }}>
        <b style={{ color: '#000', letterSpacing: 2 }}>NIFTY 500 SNIPER</b>
        <button onClick={runScan} disabled={scanning} style={{ background: '#000', color: C.orange, border: 'none', padding: '4px 10px', cursor: 'pointer' }}>
          {scanning ? 'SCANNING...' : 'START SCAN'}
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '1px solid #333' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ 
            padding: '10px 20px', background: activeTab === t.id ? '#222' : 'transparent', 
            color: activeTab === t.id ? C.orange : C.grey, border: 'none', cursor: 'pointer' 
          }}>{t.label}</button>
        ))}
      </div>

      {/* CONTENT AREA - The "key" here fixes the data-refresh issue */}
      <div key={activeTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!result ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
            NO DATA. PRESS START SCAN.
          </div>
        ) : (
          <>
            {activeTab === 'miro' && <><PH title="MIRO MOMENTUM" sub="Volume surge leaderboards" /><MiroTable stocks={result.stocks} /></>}
            {activeTab === 'trend' && <><PH title="TREND ANALYSIS" sub="ADX & Moving Average alignment" /><TrendTable stocks={result.stocks} /></>}
            {activeTab === 'filing' && <AIPanel tickers={result.stocks.map(s => s.ticker)} pulse={result.pulse} mode="filing" />}
            {activeTab === 'intelligence' && <AIPanel tickers={result.stocks.map(s => s.ticker)} pulse={result.pulse} mode="debate" />}
            {/* Add Weekly and Reversion similarly */}
          </>
        )}
      </div>
    </div>
  )
}
