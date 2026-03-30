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

// --- REUSABLE UI COMPONENTS ---
const PH = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
    <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', marginTop: 2 }}>{sub}</div>
  </div>
)

const TH = ({ children }: { children: React.ReactNode }) => (
  <th style={{ textAlign: 'left', padding: '4px 8px', fontSize: 9, color: C.orange, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>{children}</th>
)

const TD = ({ children, col, bold }: { children: React.ReactNode; col?: string; bold?: boolean }) => (
  <td style={{ padding: '3px 8px', color: col ?? C.lgrey, fontWeight: bold ? 700 : 400, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{children}</td>
)

// --- INDIVIDUAL TAB TABLES ---
// Each table now handles its own sorting internally so they don't look identical.

function MiroTable({ stocks }: { stocks: any[] }) {
  const sorted = useMemo(() => [...stocks].sort((a, b) => b.miroScore - a.miroScore), [stocks]);
  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange }}><TH>TICKER</TH><TH>MIRO SCORE</TH><TH>VOL SURGE</TH><TH>SIGNAL</TH></tr></thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.ticker} style={{ background: i % 2 === 0 ? '#000' : '#050505' }}>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.miroScore >= 8 ? C.green : C.amber}>{s.miroScore}/10</TD>
              <TD>{s.volSurge.toFixed(2)}x</TD>
              <TD>{s.recommendation}</TD>
            </tr>
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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr style={{ borderBottom: '1px solid ' + C.orange }}><TH>TICKER</TH><TH>ADX</TH><TH>MA50/200</TH><TH>STATUS</TH></tr></thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.ticker} style={{ background: i % 2 === 0 ? '#000' : '#050505' }}>
              <TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
              <TD col={s.adxStrength > 25 ? C.green : C.grey}>{s.adxStrength.toFixed(1)}</TD>
              <TD>₹{s.ma50.toFixed(0)} / ₹{s.ma200.toFixed(0)}</TD>
              <TD col={s.ma50 > s.ma200 ? C.green : C.red}>{s.ma50 > s.ma200 ? 'BULLISH' : 'BEARISH'}</TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- AI PANEL (THE FIXED VERSION) ---
function AIPanel({ tickers, pulse, mode }: { tickers: string[]; pulse: any; mode: string }) {
  const [ticker, setTicker] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [content, setContent] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  // FIX 1: This hook ensures that when the scan results arrive, the AI Panel 
  // actually selects a ticker instead of staying on an empty/undefined state.
  useEffect(() => {
    if (tickers.length > 0 && !ticker) {
      setTicker(tickers[0]);
    }
  }, [tickers, ticker]);

  async function runAI() {
    if (!ticker) return;
    if (streaming) { abortRef.current?.abort(); setStreaming(false); return; }
    
    setContent('');
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, vix: pulse?.indiaVix, regime: pulse?.regime, mode }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const { text } = JSON.parse(jsonStr);
              setContent(prev => prev + text);
            } catch (e) {}
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setContent("AI Error: Check backend connectivity.");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505' }}>
      <div style={{ padding: '10px 15px', borderBottom: '1px solid #222', display: 'flex', gap: 10, alignItems: 'center' }}>
        <select 
          value={ticker} 
          onChange={(e) => { setTicker(e.target.value); setContent(''); }}
          style={{ background: '#111', color: C.orange, border: '1px solid #444', padding: '4px', fontFamily: 'monospace' }}
        >
          {tickers.map(t => <option key={t} value={t}>{t.replace('.NS','')}</option>)}
        </select>
        <button 
          onClick={runAI} 
          style={{ background: streaming ? C.red : C.orange, color: '#000', border: 'none', padding: '5px 15px', fontWeight: 900, cursor: 'pointer' }}
        >
          {streaming ? 'STOP' : mode === 'debate' ? 'SUMMON COUNCIL' : 'RUN AUDIT'}
        </button>
      </div>
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', color: C.lgrey, fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {content || (streaming ? "Initializing Neural Link..." : "Select a ticker and execute audit.")}
        {streaming && <span style={{ color: C.orange }}> ▊</span>}
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

  async function startScan() {
    setScanning(true);
    setResult(null); // Clear old data to force a UI refresh
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, riskInr: 5000 })
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'complete') setResult(data.result);
          }
        }
      }
    } catch (e) {
      console.error("Scan Failed", e);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.white, fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ height: 38, background: C.orange, display: 'flex', alignItems: 'center', padding: '0 12px', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#000', letterSpacing: 2 }}>NIFTY 500 SNIPER</span>
        <button 
          onClick={startScan} 
          disabled={scanning}
          style={{ background: '#000', color: C.orange, border: 'none', padding: '5px 12px', fontWeight: 900, cursor: 'pointer' }}
        >
          {scanning ? 'SCANNING...' : 'START SCAN'}
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '2px solid ' + C.orange, flexShrink: 0 }}>
        {TABS.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            style={{ 
              padding: '10px 20px', 
              background: activeTab === t.id ? C.orange : 'transparent', 
              color: activeTab === t.id ? '#000' : C.grey, 
              border: 'none', 
              fontWeight: 700,
              cursor: 'pointer' 
            }}
          >
            {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!result && !scanning ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: 12 }}>
            TERMINAL STANDBY // PRESS START SCAN TO BEGIN
          </div>
        ) : !result && scanning ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.orange, fontSize: 12 }}>
            INTERROGATING NSE DATA...
          </div>
        ) : (
          // FIX 2: We use a wrapper with key={activeTab}. 
          // This forces React to destroy and rebuild the component 
          // every time you change tabs, ensuring the sorting/logic is fresh.
          <div key={activeTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'miro' && (
              <><PH title="MIRO MOMENTUM" sub="Sorted by Miro Score (Hot Money Flow)" /><MiroTable stocks={result!.stocks} /></>
            )}
            {activeTab === 'trend' && (
              <><PH title="TREND STRENGTH" sub="Sorted by ADX (Trend Intensity)" /><TrendTable stocks={result!.stocks} /></>
            )}
            {activeTab === 'filing' && (
              <AIPanel tickers={result!.stocks.map(s => s.ticker)} pulse={result!.pulse} mode="filing" />
            )}
            {activeTab === 'intelligence' && (
              <AIPanel tickers={result!.stocks.map(s => s.ticker)} pulse={result!.pulse} mode="debate" />
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ height: 20, background: '#0d0d0d', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 9, color: '#555' }}>
        <span style={{ color: C.green }}>● SYSTEM LIVE</span>
        <span style={{ marginLeft: 20 }}>NIFTY 500 SNIPER V1.4</span>
      </div>
    </div>
  )
}
