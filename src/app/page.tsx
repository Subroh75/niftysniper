'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { ScanResult, Universe } from '@/types'

const C = {
  bg: '#000000',
  orange: '#ff6600',
  amber: '#ffaa00',
  green: '#00ff41',
  red: '#ff2222',
  grey: '#888888',
  lgrey: '#aaaaaa',
}

// --- SUB-COMPONENTS ---
const PH = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
    <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', marginTop: 2 }}>{sub}</div>
  </div>
)

// --- THE FIXED DASHBOARD ---
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('miro')
  const [universe, setUniverse] = useState<Universe>('NIFTY50')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  
  // AI Panel State
  const [aiTicker, setAiTicker] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [aiStreaming, setAiStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 1. SYNC AI TICKER: When scan finishes, pick the first stock automatically
  useEffect(() => {
    if (result?.stocks?.length && !aiTicker) {
      setAiTicker(result.stocks[0].ticker);
    }
  }, [result, aiTicker]);

  // 2. SCAN EXECUTION
  async function runScan() {
    setScanning(true);
    setResult(null); // Wipe data to force UI reset
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, riskInr: 5000 }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const d = JSON.parse(line.slice(6));
          if (d.type === 'complete') setResult(d.result);
        }
      }
    } catch (e) {
      console.error("Scan Error", e);
    } finally {
      setScanning(false);
    }
  }

  // 3. AI EXECUTION (Fixed Streaming & Mode)
  async function runAI(mode: 'debate' | 'filing') {
    if (!aiTicker) return;
    if (aiStreaming) { abortRef.current?.abort(); setAiStreaming(false); return; }

    setAiContent('');
    setAiStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: aiTicker, mode, vix: result?.pulse.indiaVix }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const json = line.slice(6).trim();
            if (json === '[DONE]') break;
            const { text } = JSON.parse(json);
            setAiContent(prev => prev + text);
          }
        }
      }
    } catch (e) {} finally { setAiStreaming(false); }
  }

  // 4. TAB CONTENT GENERATOR (THE KEY FIX)
  // This uses useMemo to recalculate sorting ONLY when the activeTab changes.
  const renderTabContent = () => {
    if (!result) return <div style={{ padding: 40, color: '#333' }}>STANDBY... PRESS START SCAN</div>;

    const stocks = [...result.stocks];

    switch (activeTab) {
      case 'miro':
        stocks.sort((a, b) => b.miroScore - a.miroScore);
        return (
          <div key="miro-view" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="MIRO MOMENTUM" sub="Sorted by Bot-Flow Score" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace' }}>
              <thead style={{ borderBottom: '1px solid ' + C.orange }}>
                <tr><th style={{ textAlign: 'left', padding: 8 }}>TICKER</th><th style={{ textAlign: 'left' }}>MIRO</th><th style={{ textAlign: 'left' }}>SURGE</th></tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.ticker} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: 8, color: C.amber }}>{s.ticker.replace('.NS','')}</td>
                    <td style={{ color: s.miroScore > 7 ? C.green : C.white }}>{s.miroScore}/10</td>
                    <td>{s.volSurge.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'trend':
        stocks.sort((a, b) => b.adxStrength - a.adxStrength);
        return (
          <div key="trend-view" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="TREND INTENSITY" sub="Sorted by ADX Strength" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace' }}>
              <thead style={{ borderBottom: '1px solid ' + C.orange }}>
                <tr><th style={{ textAlign: 'left', padding: 8 }}>TICKER</th><th style={{ textAlign: 'left' }}>ADX</th><th style={{ textAlign: 'left' }}>MA ALIGN</th></tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.ticker} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: 8, color: C.amber }}>{s.ticker.replace('.NS','')}</td>
                    <td style={{ color: s.adxStrength > 25 ? C.green : C.white }}>{s.adxStrength.toFixed(1)}</td>
                    <td style={{ color: s.ma50 > s.ma200 ? C.green : C.red }}>{s.ma50 > s.ma200 ? 'BULL' : 'BEAR'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'filing':
      case 'intelligence':
        const mode = activeTab === 'filing' ? 'filing' : 'debate';
        return (
          <div key="ai-view" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505' }}>
            <PH title={mode.toUpperCase()} sub={`Analysing ${aiTicker}`} />
            <div style={{ padding: 10, display: 'flex', gap: 10, borderBottom: '1px solid #222' }}>
              <select value={aiTicker} onChange={e => {setAiTicker(e.target.value); setAiContent('')}} style={{ background: '#000', color: C.orange, border: '1px solid #444' }}>
                {result.stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker}</option>)}
              </select>
              <button onClick={() => runAI(mode)} style={{ background: C.orange, border: 'none', padding: '4px 12px', fontWeight: 900, cursor: 'pointer' }}>
                {aiStreaming ? 'STOP' : 'EXECUTE'}
              </button>
            </div>
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#ccc', fontSize: 12 }}>
              {aiContent || (aiStreaming ? "Connecting to LLM..." : "Select ticker and press Execute.")}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace' }}>
      {/* HEADER */}
      <div style={{ height: 40, background: C.orange, display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between', flexShrink: 0 }}>
        <b style={{ color: '#000' }}>NIFTY 500 SNIPER</b>
        <button onClick={runScan} disabled={scanning} style={{ background: '#000', color: C.orange, border: 'none', padding: '5px 15px', cursor: 'pointer', fontWeight: 900 }}>
          {scanning ? 'SCANNING...' : 'START SCAN'}
        </button>
      </div>

      {/* TAB BAR */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '1px solid #333', flexShrink: 0 }}>
        {['miro', 'trend', 'reversion', 'weekly', 'filing', 'intelligence'].map(id => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '12px 20px', background: activeTab === id ? '#222' : 'transparent',
            color: activeTab === id ? C.orange : '#666', border: 'none', cursor: 'pointer'
          }}>{id.toUpperCase()}</button>
        ))}
      </div>

      {/* CONTENT (KEYED) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
