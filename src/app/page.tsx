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

// --- ORIGINAL COMPONENT STYLES ---
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

// --- THE FIX: TAB-SPECIFIC TABLES ---
function MiroTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.miroScore - a.miroScore), [stocks]);
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <PH title="MIRO MOMENTUM LEADERBOARD" sub="Institutional Flow Score (0-10) | Vol Surge" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}><TH>#</TH><TH>TICKER</TH><TH>MIRO SCORE</TH><TH>VOL SURGE</TH><TH>PRICE</TH><TH>SIGNAL</TH></tr></thead>
        <tbody>
          {sorted.map((s, i) => (
            <Row key={s.ticker} i={i}>
              <TD col="#444">{i+1}</TD><TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.miroScore >= 8 ? C.green : C.white} bold>{s.miroScore}/10</TD>
              <TD col={s.volSurge >= 2 ? C.green : C.lgrey}>{s.volSurge.toFixed(2)}x</TD>
              <TD col={C.white}>₹{s.price.toLocaleString('en-IN')}</TD><TD col={s.recommendation.includes('BUY') ? C.green : C.red}>{s.recommendation}</TD>
            </Row>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrendTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.adxStrength - a.adxStrength), [stocks]);
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <PH title="STRUCTURAL TREND ANALYSIS" sub="ADX Strength | Moving Average Alignment" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}><TH>#</TH><TH>TICKER</TH><TH>ADX</TH><TH>MA 50</TH><TH>MA 200</TH><TH>STATUS</TH></tr></thead>
        <tbody>
          {sorted.map((s, i) => (
            <Row key={s.ticker} i={i}>
              <TD col="#444">{i+1}</TD><TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.adxStrength > 25 ? C.green : C.white}>{s.adxStrength.toFixed(1)}</TD>
              <TD>₹{s.ma50.toFixed(1)}</TD><TD>₹{s.ma200.toFixed(1)}</TD>
              <TD col={s.ma50 > s.ma200 ? C.green : C.red}>{s.ma50 > s.ma200 ? 'GOLDEN' : 'BEARISH'}</TD>
            </Row>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- THE AI FIX ---
function AIPanel({ tickers, pulse, mode }: { tickers: string[]; pulse: any; mode: string }) {
  const [ticker, setTicker] = useState('')
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController|null>(null)

  useEffect(() => { if (!ticker && tickers.length > 0) setTicker(tickers[0]) }, [tickers, ticker])

  async function runAI() {
    if (!ticker) return;
    if (streaming) { abortRef.current?.abort(); setStreaming(false); return }
    setContent(''); setStreaming(true); abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, vix: pulse?.indiaVix, mode }),
        signal: abortRef.current.signal,
      })
      const reader = res.body?.getReader(); const dec = new TextDecoder();
      if (!reader) return
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += dec.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim(); if (data === '[DONE]') break
            try { setContent(prev => prev + JSON.parse(data).text) } catch(e) {}
          }
        }
      }
    } catch (e) {} finally { setStreaming(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PH title={mode === 'filing' ? 'AI LAB AUDIT' : 'AI DEBATE'} sub={`Interrogating ${ticker}`} />
      <div style={{ padding: 10, display: 'flex', gap: 10, background: '#080808', borderBottom: '1px solid #1a1a1a' }}>
        <select value={ticker} onChange={e => {setTicker(e.target.value); setContent('')}} style={{ background: '#000', color: C.orange, border: '1px solid #333' }}>
          {tickers.map(t => <option key={t} value={t}>{t.replace('.NS','')}</option>)}
        </select>
        <button onClick={runAI} style={{ background: 'transparent', border: '1px solid ' + C.orange, color: C.orange, cursor: 'pointer', padding: '4px 12px' }}>
          {streaming ? 'STOP' : 'EXECUTE'}
        </button>
      </div>
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#ccc', fontSize: 11, fontFamily: 'monospace' }}>
        {content || (streaming ? "Initializing AI..." : "Press Execute.")}
      </div>
    </div>
  )
}

// --- MAIN DASHBOARD (Original Version Restored) ---
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('miro')
  const [universe, setUniverse] = useState<Universe>('NIFTY50')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  async function startScan() {
    setScanning(true); setResult(null); setProgress({ done: 0, total: 0 })
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, riskInr: 5000 })
      })
      const reader = res.body?.getReader(); const dec = new TextDecoder()
      if (!reader) return
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buffer += dec.decode(value, { stream: true })
        const lines = buffer.split('\n'); buffer = lines.pop() || ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6))
              if (d.type === 'progress') setProgress({ done: d.done, total: d.total })
              if (d.type === 'complete') { setResult(d.result); setScanning(false) }
            } catch(e) {}
          }
        }
      }
    } catch (e) { setScanning(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 36, background: C.orange, flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: 15, color: '#000', letterSpacing: 3 }}>NIFTY 500 SNIPER</span>
        {result?.pulse && <div style={{ fontSize: 10, color: '#000', fontWeight: 700 }}>VIX {result.pulse.indiaVix.toFixed(2)} | {result.pulse.regime}</div>}
      </div>

      {/*
