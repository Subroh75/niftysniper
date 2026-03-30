'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { ScanResult, Universe } from '@/types'

// --- THEME CONSTANTS ---
const C = {
  bg: '#000000',
  panel: '#0a0a0a',
  border: '#1a1a1a',
  orange: '#ff6600',
  amber: '#ffaa00',
  green: '#00ff41',
  red: '#ff2222',
  blue: '#4488ff',
  white: '#ffffff',
  grey: '#888888',
  lgrey: '#aaaaaa',
}

// --- SHARED UI COMPONENTS ---
function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 10, color: C.orange, borderBottom: '1px solid #222', textTransform: 'uppercase', letterSpacing: 1 }}>{children}</th>
}

function TD({ children, col, bold }: { children: React.ReactNode; col?: string; bold?: boolean }) {
  return <td style={{ padding: '10px 8px', color: col ?? C.lgrey, fontWeight: bold ? 700 : 400, fontSize: 12, fontFamily: 'monospace', borderBottom: '1px solid #111' }}>{children}</td>
}

function PH({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.orange, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

// --- 1. MIRO TAB (Institutional Momentum) ---
function MiroTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.miroScore - a.miroScore), [stocks])
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <PH title="MIRO MOMENTUM LEADERBOARD" sub="Miro Score 0-10 | Institutional Flow | Volume Surge" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <TH>Ticker</TH><TH>Miro Score</TH><TH>Vol Surge</TH><TH>Price</TH><TH>Chg%</TH><TH>Signal</TH>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr key={s.ticker}>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.miroScore >= 8 ? C.green : C.white} bold>{s.miroScore}/10</TD>
              <TD col={s.volSurge >= 2 ? C.green : C.lgrey}>{s.volSurge.toFixed(2)}x</TD>
              <TD col={C.white}>₹{s.price.toLocaleString('en-IN')}</TD>
              <TD col={s.pctChange >= 0 ? C.green : C.red}>{s.pctChange.toFixed(2)}%</TD>
              <TD col={s.recommendation.includes('BUY') ? C.green : C.red} bold>{s.recommendation}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- 2. TREND TAB (Structural Alignment) ---
function TrendTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.adxStrength - a.adxStrength), [stocks])
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <PH title="STRUCTURAL TREND ANALYSIS" sub="ADX Strength | Moving Average Alignment | Trend Status" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <TH>Ticker</TH><TH>ADX Strength</TH><TH>MA 50</TH><TH>MA 200</TH><TH>Alignment</TH>
          </tr>
        </thead>
        <tbody>
          {sorted.map(s => (
            <tr key={s.ticker}>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.adxStrength > 25 ? C.green : C.white}>{s.adxStrength.toFixed(1)}</TD>
              <TD>₹{s.ma50.toFixed(1)}</TD>
              <TD>₹{s.ma200.toFixed(1)}</TD>
              <TD col={s.ma50 > s.ma200 ? C.green : C.red} bold>{s.ma50 > s.ma200 ? 'GOLDEN CROSS' : 'BEARISH ALIGN'}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- 3. REVERSION TAB (Mean Reversion) ---
function ReversionTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => a.zScore - b.zScore), [stocks])
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <PH title="MEAN REVERSION SCANNER" sub="Z-Score Analysis | Oversold Snapbacks | Overbought Fades" />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <TH>Ticker</TH><TH>Z-Score</TH><TH>Distance to MA20</TH><TH>Action</TH>
          </tr>
        </thead>
        <tbody>
          {sorted.filter(s => Math.abs(s.zScore) >= 1.5).map(s => (
            <tr key={s.ticker}>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.zScore <= -2 ? C.green : s.zScore >= 2 ? C.red : C.white} bold>{s.zScore.toFixed(2)}</TD>
              <TD>{((s.price / s.ma20 - 1) * 100).toFixed(2)}%</TD>
              <TD col={s.zScore < -2 ? C.green : C.red}>{s.zScore < -2 ? 'BUY REVERSION' : 'SELL FADE'}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- MAIN DASHBOARD ---
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('miro')
  const [universe, setUniverse] = useState<Universe>('NIFTY50')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  // AI State
  const [aiTicker, setAiTicker] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiStreaming, setAiStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Critical Fix: Sync AI ticker when results arrive
  useEffect(() => {
    if (result?.stocks?.length && !aiTicker) {
      setAiTicker(result.stocks[0].ticker)
    }
  }, [result, aiTicker])

  async function runScan() {
    setScanning(true); setResult(null); setProgress({ done: 0, total: 0 });
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, riskInr: 5000 }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        dec.decode(value).split('\n').filter(l => l.startsWith('data: ')).forEach(line => {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'progress') setProgress({ done: d.done, total: d.total })
            if (d.type === 'complete') { setResult(d.result); setScanning(false); }
          } catch(e) {}
        });
      }
    } catch (e) { setScanning(false) }
  }

  async function runAI(mode: 'debate' | 'filing') {
    if (!aiTicker || aiStreaming) return;
    setAiContent(''); setAiStreaming(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: aiTicker, mode, vix: result?.pulse.indiaVix }),
        signal: abortRef.current.signal
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        dec.decode(value).split('\n').filter(l => l.startsWith('data: ')).forEach(line => {
          const json = line.slice(6).trim();
          if (json !== '[DONE]') {
            try { setAiContent(p => p + JSON.parse(json).text); } catch(e) {}
          }
        });
      }
    } catch (e) {} finally { setAiStreaming(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ height: 45, background: C.orange, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', flexShrink: 0 }}>
        <b style={{ color: '#000', fontSize: 18, letterSpacing: 3 }}>NIFTY 500 SNIPER</b>
        <div style={{ display: 'flex', gap: 20 }}>
          {result?.pulse && <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>VIX: {result.pulse.indiaVix.toFixed(2)}</span>}
          <button onClick={runScan} disabled={scanning} style={{ background: '#000', color: C.orange, border: 'none', padding: '6px 16px', fontWeight: 900, cursor: 'pointer', fontSize: 11 }}>
            {scanning ? `SCANNING ${progress.done}/${progress.total}` : 'START SCAN'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '2px solid ' + C.orange, flexShrink: 0 }}>
        {['miro', 'trend', 'reversion', 'weekly', 'filing', 'intelligence'].map(id => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '12px 24px', background: activeTab === id ? '#1a1a1a' : 'transparent',
            color: activeTab === id ? C.orange : '#666', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
            borderBottom: activeTab === id ? `3px solid ${C.orange}` : 'none'
          }}>{id.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: 220, background: '#080808', borderRight: '1px solid #222', padding: 20, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: C.orange, marginBottom: 10, fontWeight: 700 }}>UNIVERSE SELECT</div>
          <select value={universe} onChange={e => setUniverse(e.target.value as Universe)} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #444', padding: 8, marginBottom: 20 }}>
            <option value="NIFTY50">NIFTY 50</option>
            <option value="NIFTY200">NIFTY 200</option>
            <option value="NIFTY500">NIFTY 500</option>
          </select>
          {result?.pulse && (
            <div style={{ fontSize: 11, color: '#666', borderTop: '1px solid #222', paddingTop: 15 }}>
              <div style={{ marginBottom: 8 }}>REGIME: <span style={{ color: C.green }}>{result.pulse.regime}</span></div>
              <div style={{ marginBottom: 8 }}>BREADTH: <span style={{ color: C.amber }}>{result.pulse.breadthPct}%</span></div>
            </div>
          )}
        </div>

        {/* MAIN DISPLAY AREA */}
        <div key={activeTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!result ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
              {scanning ? "COMMENCING SCAN..." : "TERMINAL STANDBY // SELECT UNIVERSE & START SCAN"}
            </div>
          ) : (
            <>
              {activeTab === 'miro' && <MiroTable stocks={result.stocks} />}
              {activeTab === 'trend' && <TrendTable stocks={result.stocks} />}
              {activeTab === 'reversion' && <ReversionTable stocks={result.stocks} />}
              {(activeTab === 'filing' || activeTab === 'intelligence') && (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0
