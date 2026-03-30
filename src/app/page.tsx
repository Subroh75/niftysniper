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
  white: '#ffffff', // Added missing color to fix build error
}

const PH = ({ title, sub }: { title: string; sub: string }) => (
  <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
    <div style={{ fontFamily: 'monospace', fontSize: 11, color: C.orange, fontWeight: 700, letterSpacing: 2 }}>{title}</div>
    <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', marginTop: 2 }}>{sub}</div>
  </div>
)

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

  // Sync AI Ticker selection when results arrive
  useEffect(() => {
    if (result?.stocks?.length && !aiTicker) {
      setAiTicker(result.stocks[0].ticker);
    }
  }, [result, aiTicker]);

  async function runScan() {
    setScanning(true);
    setResult(null);
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
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'complete') setResult(d.result);
          } catch(e) {}
        }
      }
    } catch (e) {
      console.error("Scan Error", e);
    } finally {
      setScanning(false);
    }
  }

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
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const { text } = JSON.parse(json);
            setAiContent(prev => prev + text);
          } catch(e) {}
        }
      }
    } catch (e) {} finally { setAiStreaming(false); }
  }

  const renderTabContent = () => {
    if (!result) return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
        {scanning ? "SCAN IN PROGRESS..." : "TERMINAL IDLE // START SCAN"}
      </div>
    );

    const stocks = [...result.stocks];

    // --- TAB LOGIC ---
    switch (activeTab) {
      case 'miro':
        stocks.sort((a, b) => b.miroScore - a.miroScore);
        return (
          <div key="miro" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="MIRO MOMENTUM" sub="Sorted by Institutional Bot-Flow" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12 }}>
              <thead style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
                <tr><th style={{ textAlign: 'left', padding: 10 }}>TICKER</th><th>SCORE</th><th>SURGE</th><th>SIGNAL</th></tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.ticker} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: 10, color: C.amber }}>{s.ticker.replace('.NS','')}</td>
                    <td style={{ textAlign: 'center', color: s.miroScore > 7 ? C.green : C.white }}>{s.miroScore}/10</td>
                    <td style={{ textAlign: 'center' }}>{s.volSurge.toFixed(2)}x</td>
                    <td style={{ textAlign: 'center', color: s.recommendation.includes('BUY') ? C.green : C.red }}>{s.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'trend':
        stocks.sort((a, b) => b.adxStrength - a.adxStrength);
        return (
          <div key="trend" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="TREND STRENGTH" sub="Sorted by ADX Intensity" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12 }}>
              <thead style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
                <tr><th style={{ textAlign: 'left', padding: 10 }}>TICKER</th><th>ADX</th><th>MA ALIGNMENT</th></tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.ticker} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: 10, color: C.amber }}>{s.ticker.replace('.NS','')}</td>
                    <td style={{ textAlign: 'center', color: s.adxStrength > 25 ? C.green : C.white }}>{s.adxStrength.toFixed(1)}</td>
                    <td style={{ textAlign: 'center', color: s.ma50 > s.ma200 ? C.green : C.red }}>{s.ma50 > s.ma200 ? 'GOLDEN' : 'BEARISH'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'reversion':
        stocks.sort((a, b) => a.zScore - b.zScore);
        return (
          <div key="reversion" style={{ flex: 1, overflow: 'auto' }}>
            <PH title="MEAN REVERSION" sub="Sorted by Z-Score Oversold/Overbought" />
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 12 }}>
              <thead style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
                <tr><th style={{ textAlign: 'left', padding: 10 }}>TICKER</th><th>Z-SCORE</th><th>ACTION</th></tr>
              </thead>
              <tbody>
                {stocks.map(s => (
                  <tr key={s.ticker} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: 10, color: C.amber }}>{s.ticker.replace('.NS','')}</td>
                    <td style={{ textAlign: 'center', color: Math.abs(s.zScore) > 2 ? C.orange : C.white }}>{s.zScore.toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{s.zScore < -2 ? 'BUY SNAPBACK' : s.zScore > 2 ? 'SELL FADE' : 'NEUTRAL'}</td>
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
          <div key="ai-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050505' }}>
            <PH title={mode === 'filing' ? "AI LAB AUDIT" : "AI DEBATE"} sub={`Neural Audit for ${aiTicker}`} />
            <div style={{ padding: 10, display: 'flex', gap: 10, borderBottom: '1px solid #222' }}>
              <select value={aiTicker} onChange={e => {setAiTicker(e.target.value); setAiContent('')}} style={{ background: '#000', color: C.orange, border: '1px solid #444', padding: '4px' }}>
                {result.stocks.map(s => <option key={s.ticker} value={s.ticker}>{s.ticker.replace('.NS','')}</option>)}
              </select>
              <button onClick={() => runAI(mode)} style={{ background: C.orange, color: '#000', border: 'none', padding: '5px 15px', fontWeight: 900, cursor: 'pointer' }}>
                {aiStreaming ? 'STOP' : 'EXECUTE'}
              </button>
            </div>
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#ccc', fontSize: 12, lineHeight: 1.6 }}>
              {aiContent || (aiStreaming ? "Connecting to AI..." : "Select ticker and press Execute.")}
              {aiStreaming && <span style={{ color: C.orange }}> ▊</span>}
            </div>
          </div>
        );

      default:
        return <div style={{ padding: 20 }}>TAB IN DEVELOPMENT</div>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      <div style={{ height: 40, background: C.orange, display: 'flex', alignItems: 'center', padding: '0 15px', justifyContent: 'space-between', flexShrink: 0 }}>
        <b style={{ color: '#000', letterSpacing: 2 }}>NIFTY 500 SNIPER</b>
        <button onClick={runScan} disabled={scanning} style={{ background: '#000', color: C.orange, border: 'none', padding: '6px 15px', cursor: 'pointer', fontWeight: 900 }}>
          {scanning ? 'SCANNING...' : 'START SCAN'}
        </button>
      </div>

      <div style={{ display: 'flex', background: '#111', borderBottom: '2px solid ' + C.orange, flexShrink: 0 }}>
        {['miro', 'trend', 'reversion', 'weekly', 'filing', 'intelligence'].map(id => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            padding: '12px 20px', background: activeTab === id ? C.orange : 'transparent',
            color: activeTab === id ? '#000' : '#666', border: 'none', cursor: 'pointer', fontWeight: 700
          }}>{id.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
