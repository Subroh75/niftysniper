'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { ScanResult, Universe } from '@/types'

// --- 1. CONSTANTS & THEME ---
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

const TABS = [
  { id: 'miro', label: 'Miro' },
  { id: 'trend', label: 'Trend' },
  { id: 'reversion', label: 'Reversion' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'filing', label: 'AI Lab' },
  { id: 'intelligence', label: 'AI Debate' },
]

// --- 2. SHARED UI COMPONENTS ---
const TH = ({ children }: { children: React.ReactNode }) => (
  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 10, color: C.orange, borderBottom: '1px solid #222', textTransform: 'uppercase', letterSpacing: 1 }}>{children}</th>
)

const TD = ({ children, col, bold }: { children: React.ReactNode; col?: string; bold?: boolean }) => (
  <td style={{ padding: '10px 8px', color: col ?? C.lgrey, fontWeight: bold ? 700 : 400, fontSize: 12, fontFamily: 'monospace', borderBottom: '1px solid #111', whiteSpace: 'nowrap' }}>{children}</td>
)

const PH = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
    <div style={{ fontFamily: 'monospace', fontSize: 12, color: C.orange, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', marginTop: 4 }}>{sub}</div>
  </div>
)

// --- 3. DASHBOARD MAIN COMPONENT ---
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

  // Sync AI Ticker selection when scan results arrive
  useEffect(() => {
    if (result?.stocks?.length && !aiTicker) {
      setAiTicker(result.stocks[0].ticker)
    }
  }, [result, aiTicker])

  // --- 4. DATA FETCHING LOGIC ---
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
        const chunk = dec.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'progress') setProgress({ done: d.done, total: d.total })
            if (d.type === 'complete') { setResult(d.result); setScanning(false); }
          } catch (e) { }
        }
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
        body: JSON.stringify({ ticker: aiTicker, mode, vix: result?.pulse.indiaVix, regime: result?.pulse.regime }),
        signal: abortRef.current.signal
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try { setAiContent(p => p + JSON.parse(json).text); } catch (e) { }
        }
      }
    } catch (e) { } finally { setAiStreaming(false) }
  }

  // --- 5. RENDERER ---
  const renderTabContent = () => {
    if (!result) return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🏹</div>
        <div style={{ fontSize: 11, letterSpacing: 2 }}>{scanning ? `SCANNING ${universe} (${progress.done}/${progress.total})` : "TERMINAL STANDBY // PRESS START SCAN"}</div>
      </div>
    );

    const stocks = [...result.stocks];

    switch (activeTab) {
      case 'miro':
        const miroSorted = stocks.sort((a, b) => b.miroScore - a.miroScore);
        return (
          <div key="miro-view" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="MIRO MOMENTUM LEADERBOARD" sub="Institutional Bot-Flow & Real-time Momentum" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>#</TH><TH>Ticker</TH><TH>Score</TH><TH>Vol Surge</TH><TH>Price</TH><TH>Chg%</TH><TH>Signal</TH></tr></thead>
              <tbody>
                {miroSorted.map((s, i) => (
                  <tr key={s.ticker}>
                    <TD col="#444">{i + 1}</TD>
                    <TD col={C.amber} bold>{s.ticker.replace('.NS', '')}</TD>
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
        );

      case 'trend':
        const trendSorted = stocks.sort((a, b) => b.adxStrength - a.adxStrength);
        return (
          <div key="trend-view" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="TREND STRENGTH & ALIGNMENT" sub="ADX Intensity | MA 50/200 Structural Status" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Ticker</TH><TH>ADX</TH><TH>MA 20</TH><TH>MA 50</TH><TH>MA 200</TH><TH>Status</TH></tr></thead>
              <tbody>
                {trendSorted.map(s => (
                  <tr key={s.ticker}>
                    <TD col={C.amber} bold>{s.ticker.replace('.NS', '')}</TD>
                    <TD col={s.adxStrength > 25 ? C.green : C.white}>{s.adxStrength.toFixed(1)}</TD>
                    <TD>₹{s.ma20.toFixed(1)}</TD>
                    <TD col={s.price > s.ma50 ? C.green : C.red}>₹{s.ma50.toFixed(1)}</TD>
                    <TD>₹{s.ma200.toFixed(1)}</TD>
                    <TD col={s.ma50 > s.ma200 ? C.green : C.red} bold>{s.ma50 > s.ma200 ? 'GOLDEN' : 'BEARISH'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'reversion':
        const zSorted = stocks.sort((a, b) => a.zScore - b.zScore);
        return (
          <div key="reversion-view" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="MEAN REVERSION SCANNER" sub="Z-Score Analysis for Snapback Setups" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Ticker</TH><TH>Z-Score</TH><TH>ATR</TH><TH>Price</TH><TH>Setup</TH></tr></thead>
              <tbody>
                {zSorted.filter(s => Math.abs(s.zScore) > 1.2).map(s => (
                  <tr key={s.ticker}>
                    <TD col={C.amber} bold>{s.ticker.replace('.NS', '')}</TD>
                    <TD col={s.zScore <= -2 ? C.green : s.zScore >= 2 ? C.red : C.white} bold>{s.zScore.toFixed(2)}</TD>
                    <TD>₹{s.atr.toFixed(2)}</TD>
                    <TD col={C.white}>₹{s.price.toFixed(2)}</TD>
                    <TD col={s.zScore < -2 ? C.green : C.red} bold>{s.zScore < -2 ? 'LONG REVERSION' : 'SHORT FADE'}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'weekly':
        const weekSorted = stocks.sort((a, b) => b.volSurge - a.volSurge);
        return (
          <div key="weekly-view" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="WEEKLY INSTITUTIONAL FLOW" sub="Silent Accumulation & Distribution Scans" />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><TH>Ticker</TH><TH>Vol Surge</TH><TH>Price Move</TH><TH>Pattern</TH></tr></thead>
              <tbody>
                {weekSorted.map(s => {
                  const accum = s.volSurge >= 3 && Math.abs(s.pctChange) < 1.5;
                  return (
                    <tr key={s.ticker}>
                      <TD col={C.amber} bold>{s.ticker.replace('.NS', '')}</TD>
                      <TD col={s.volSurge > 3 ? C.green : C.white}>{s.volSurge.toFixed(2)}x</TD>
                      <TD col={s.pctChange >= 0 ? C.green : C.red}>{s.pctChange.toFixed(2)}%</TD>
                      <TD col={accum ? C.green : C.lgrey}>{accum ? 'ACCUMULATION' : 'NORMAL'}</TD>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        );

      case 'filing':
      case 'intelligence':
        const mode = activeTab === 'filing' ? 'filing' : 'debate';
        return (
          <div key="ai-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505' }}>
            <PH title={mode === 'filing' ? 'AI LAB - SEBI FILING AUDIT' : 'AI DEBATE - INVESTMENT COUNCIL'} sub={`Neural Processing for ${aiTicker}`} />
            <div style={{ padding: '10px 15px', borderBottom: '1px solid #222', display: 'flex', gap: 10, background: '#0a0a0a' }}>
              <select value={aiTicker} onChange={e => { setAiTicker(e.target.value); setAiContent('') }} style={{ background: '#000', color: C.orange, border: '1px solid #444', padding: '5px 10px', fontSize: 11 }}>
                {result.stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker.replace('.NS', '')}</option>)}
              </select>
              <button onClick={() => runAI(mode)} style={{ background: C.orange, color: '#000', border: 'none', padding: '5px 15px', fontWeight: 900, cursor: 'pointer', fontSize: 11 }}>
                {aiStreaming ? 'STOPPING...' : 'EXECUTE AI AUDIT'}
              </button>
            </div>
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
              {aiContent || (aiStreaming ? "Initializing Neural Core..." : "Select ticker and press Execute.")}
              {aiStreaming && <span style={{ color: C.orange }}> ▊</span>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- 6. FINAL JSX ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>

      {/* HEADER */}
      <div style={{ height: 45, background: C.orange, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', flexShrink: 0 }}>
        <b style={{ color: '#000', fontSize: 18, letterSpacing: 3 }}>NIFTY 500 SNIPER</b>
        <div style={{ display: 'flex', gap: 20 }}>
          {result?.pulse && <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>VIX: {result.pulse.indiaVix.toFixed(2)}</span>}
          <button onClick={runScan} disabled={scanning} style={{ background: '#000', color: C.orange, border: 'none', padding: '6px 16px', fontWeight: 900, cursor: 'pointer', fontSize: 11 }}>
            {scanning ? 'SCANNING...' : 'START SCAN'}
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '2px solid ' + C.orange, flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '12px 24px', background: activeTab === t.id ? '#1a1a1a' : 'transparent',
            color: activeTab === t.id ? C.orange : '#666', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
            borderBottom: activeTab === t.id ? `3px solid ${C.orange}` : 'none'
          }}>{t.label.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <div style={{ width: 220, background: '#080808', borderRight: '1px solid #222', padding: 20, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, color: C.orange, marginBottom: 10, fontWeight: 700 }}>UNIVERSE</div>
          <select value={universe} onChange={e => setUniverse(e.target.value as Universe)} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #444', padding: 8, marginBottom: 20, fontSize: 11 }}>
            <option value="NIFTY50">NIFTY 50</option>
            <option value="NIFTY200">NIFTY 200</option>
            <option value="NIFTY500">NIFTY 500</option>
          </select>
          {result?.pulse && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 'auto', borderTop: '1px solid #222', paddingTop: 20 }}>
              <div style={{ marginBottom: 10 }}>REGIME: <span style={{ color: result.pulse.regime === 'BULLISH' ? C.green : C.red }}>{result.pulse.regime}</span></div>
              <div style={{ marginBottom: 10 }}>BREADTH: <span style={{ color: C.amber }}>{result.pulse.breadthPct}%</span></div>
              <div style={{ marginBottom: 10 }}>FII: <span style={{ color: result.pulse.fiiNetCr > 0 ? C.green : C.red }}>{result.pulse.fiiNetCr}Cr</span></div>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {renderTabContent()}
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: #000; }
        select { outline: none; }
      `}</style>
    </div>
  );
}
