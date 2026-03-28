'use client'
import { useState, useRef } from 'react'
import type { ScanResult, Universe } from '@/types'

// ─── Bloomberg colour tokens ──────────────────────────────────────────────────
const C = {
  bg:     '#000000',
  panel:  '#0a0a0a',
  border: '#1a1a1a',
  orange: '#ff6600',
  amber:  '#ffaa00',
  green:  '#00ff41',
  red:    '#ff2222',
  blue:   '#4488ff',
  white:  '#ffffff',
  grey:   '#888888',
  lgrey:  '#aaaaaa',
}

const TABS = [
  { id: 'miro',         label: 'Miro'      },
  { id: 'trend',        label: 'Trend'     },
  { id: 'reversion',   label: 'Reversion' },
  { id: 'weekly',       label: 'Weekly'    },
  { id: 'filing',       label: 'AI Lab'    },
  { id: 'intelligence', label: 'AI Debate' },
]

const UNIVERSES = [
  { value: 'NIFTY100'   as Universe, label: 'NIFTY 100',   sub: '~2 MIN'  },
  { value: 'NIFTY500'   as Universe, label: 'NIFTY 500',   sub: '~8 MIN'  },
  { value: 'FULL_MARKET' as Universe, label: 'FULL MARKET', sub: '~20 MIN' },
]

function BB(style: React.CSSProperties = {}, children?: React.ReactNode) {
  return <span style={{ fontFamily: 'monospace', fontSize: 11, ...style }}>{children}</span>
}

function RecoBadge({ reco }: { reco: string }) {
  const col =
    reco === 'STRONG BUY'  ? C.green  :
    reco === 'STRONG SELL' ? C.red    :
    reco === 'BUY'         ? '#00cc66' :
    reco === 'SELL'        ? '#ff8800' :
    C.grey
  return (
    <span style={{
      fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
      color: col, letterSpacing: 1,
    }}>{reco}</span>
  )
}

function StocksTable({ stocks, sortKey }: { stocks: ScanResult['stocks']; sortKey: keyof ScanResult['stocks'][0] }) {
  const sorted = [...stocks].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
  const COLS = ['#','TICKER','SECTOR','PRICE','SIGNAL','MIRO','SURGE','CHG%','S/L','QTY']
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>
            {COLS.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontSize: 9, color: C.orange, fontWeight: 700, letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.ticker} style={{ borderBottom: '1px solid #111', background: i % 2 === 0 ? C.bg : '#050505' }}>
              <td style={{ padding: '3px 8px', color: '#333', fontSize: 9 }}>{i+1}</td>
              <td style={{ padding: '3px 8px', color: C.amber, fontWeight: 700 }}>{s.ticker.replace('.NS','')}</td>
              <td style={{ padding: '3px 8px', color: C.grey, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.sector}</td>
              <td style={{ padding: '3px 8px', color: C.white }}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</td>
              <td style={{ padding: '3px 8px' }}><RecoBadge reco={s.recommendation} /></td>
              <td style={{ padding: '3px 8px', color: s.miroScore >= 8 ? C.green : s.miroScore >= 5 ? C.amber : C.grey, fontWeight: 700 }}>{s.miroScore}</td>
              <td style={{ padding: '3px 8px', color: s.volSurge >= 2 ? C.green : C.grey }}>{s.volSurge.toFixed(2)}x</td>
              <td style={{ padding: '3px 8px', color: s.pctChange >= 0 ? C.green : C.red }}>{s.pctChange >= 0 ? '+' : ''}{s.pctChange.toFixed(2)}%</td>
              <td style={{ padding: '3px 8px', color: C.grey }}>{s.stopLoss ? '₹'+s.stopLoss.toFixed(2) : '—'}</td>
              <td style={{ padding: '3px 8px', color: C.lgrey }}>{s.qty ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: C.grey, fontFamily: 'monospace', fontSize: 11 }}>
          NO SIGNALS — RUN AUDIT TO POPULATE
        </div>
      )}
    </div>
  )
}

function AIPanel({ tickers, pulse, mode }: { tickers: string[]; pulse: ScanResult['pulse']; mode: 'debate'|'filing' }) {
  const [ticker, setTicker] = useState(tickers[0] ?? '')
  const [streaming, setStreaming] = useState(false)
  const [content, setContent] = useState('')
  const abortRef = useRef<AbortController|null>(null)

  const bufRef = useRef('')
  async function run() {
    if (streaming) { abortRef.current?.abort(); setStreaming(false); return }
    bufRef.current = ''
    setContent('')
    setStreaming(true)
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, vix: pulse.indiaVix, regime: pulse.regime, fiiNet: pulse.fiiNetCr, mode }),
        signal: abortRef.current.signal,
      })
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          if (line.slice(6) === '[DONE]') break
          try {
            const { text } = JSON.parse(line.slice(6))
            bufRef.current += text
            setContent(bufRef.current)
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        bufRef.current += '\n\n[ERROR] ' + String(e)
        setContent(bufRef.current)
      }
    } finally { setStreaming(false) }
  }

  const label = mode === 'debate' ? 'AI DEBATE — INVESTMENT COUNCIL' : 'AI LAB — SEBI REG-30 FILING AUDIT'
  const btnLabel = streaming ? 'STOP' : mode === 'debate' ? 'SUMMON COUNCIL' : 'RUN AUDIT'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid ' + C.orange, background: '#0d0400' }}>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.orange, letterSpacing: 2, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ padding: '6px 12px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 12, background: '#060606' }}>
        <select
          value={ticker}
          onChange={e => { setTicker(e.target.value); setContent('') }}
          style={{ background: '#111', border: '1px solid #333', color: C.amber, fontFamily: 'monospace', fontSize: 10, padding: '3px 6px', width: 160 }}
        >
          {tickers.map(t => <option key={t} value={t}>{t.replace('.NS','')}</option>)}
        </select>
        <button
          onClick={run}
          style={{
            background: 'transparent', border: '1px solid ' + (streaming ? C.red : C.orange),
            color: streaming ? C.red : C.orange, fontFamily: 'monospace', fontSize: 10,
            padding: '3px 12px', cursor: 'pointer', letterSpacing: 1, fontWeight: 700,
          }}
        >{btnLabel}</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: C.bg }}>
        {content || streaming ? (
          <pre style={{ fontFamily: 'monospace', fontSize: 10, color: C.lgrey, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
            {content}{streaming && <span style={{ color: C.orange }}>▊</span>}
          </pre>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', fontSize: 10, color: '#333' }}>
            SELECT STOCK → PRESS {mode === 'debate' ? 'SUMMON COUNCIL' : 'RUN AUDIT'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab]   = useState('miro')
  const [universe, setUniverse]     = useState<Universe>('NIFTY100')
  const [riskInr, setRiskInr]       = useState(5000)
  const [scanning, setScanning]     = useState(false)
  const [progress, setProgress]     = useState({ done: 0, total: 0 })
  const [result, setResult]         = useState<ScanResult|null>(null)
  const [error, setError]           = useState<string|null>(null)
  const abortRef = useRef<AbortController|null>(null)

  async function runScan() {
    if (scanning) { abortRef.current?.abort(); setScanning(false); return }
    setScanning(true); setError(null); setProgress({ done: 0, total: 0 })
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ universe, riskInr }),
        signal: abortRef.current.signal,
      })
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type === 'start')    setProgress({ done: 0, total: d.total })
            if (d.type === 'progress') setProgress({ done: d.done, total: d.total })
            if (d.type === 'complete') { setResult(d.result); setScanning(false) }
            if (d.type === 'error')    { setError(d.message); setScanning(false) }
          } catch {}
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setError(String(e))
      setScanning(false)
    }
  }

  const pulse = result?.pulse
  const tickers = result?.stocks.map(s => s.ticker) ?? []
  const strongBuys = result?.stocks.filter(s => s.recommendation === 'STRONG BUY').length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.white, fontFamily: 'monospace', overflow: 'hidden' }}>

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 36, background: C.orange, flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: 15, color: '#000', letterSpacing: 3 }}>NIFTYSNIPER  TERMINAL</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 10, color: '#000', fontWeight: 700 }}>
          {pulse && <>
            <span>NIFTY {pulse.nifty50.value.toLocaleString('en-IN')} <span style={{ color: pulse.nifty50.changePct >= 0 ? '#004400' : '#660000' }}>{pulse.nifty50.changePct >= 0 ? '▲' : '▼'}{Math.abs(pulse.nifty50.changePct).toFixed(2)}%</span></span>
            <span>VIX {pulse.indiaVix.toFixed(2)}</span>
            <span>USD/INR {pulse.usdInr.toFixed(2)}</span>
            <span style={{ color: pulse.fiiNetCr >= 0 ? '#004400' : '#660000' }}>FII ₹{pulse.fiiNetCr.toLocaleString('en-IN')}Cr</span>
          </>}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#000', display: 'inline-block', animation: 'blink 1s infinite' }} />
            NSE LIVE
          </span>
        </div>
      </div>

      {/* ── FUNCTION KEY TABS ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', background: '#111', borderBottom: '2px solid ' + C.orange, flexShrink: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 20px', fontSize: 10, fontFamily: 'monospace',
              fontWeight: 700, letterSpacing: 2, cursor: 'pointer', border: 'none',
              borderRight: '1px solid #222',
              background: activeTab === tab.id ? C.orange : 'transparent',
              color: activeTab === tab.id ? '#000' : C.grey,
            }}
          >{tab.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingRight: 16, fontSize: 10, color: C.grey }}>
            <span style={{ color: C.green }}>{strongBuys} STRONG BUY</span>
            <span>{result.totalScanned} SCANNED</span>
            <span style={{ color: pulse?.regime === 'BULLISH' ? C.green : pulse?.regime === 'BEARISH' ? C.red : C.amber }}>
              {pulse?.regime} {pulse?.breadthPct}%
            </span>
          </div>
        )}
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid ' + C.border, background: '#080808', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Universe */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>SCAN UNIVERSE</div>
            {UNIVERSES.map(u => (
              <button
                key={u.value}
                onClick={() => setUniverse(u.value)}
                style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 8px', marginBottom: 3, cursor: 'pointer', fontFamily: 'monospace',
                  fontSize: 10, border: '1px solid ' + (universe === u.value ? C.orange : '#222'),
                  background: universe === u.value ? '#1a0a00' : 'transparent',
                  color: universe === u.value ? C.orange : C.grey,
                }}
              >
                <span>{u.label}</span>
                <span style={{ fontSize: 8, opacity: 0.6 }}>{u.sub}</span>
              </button>
            ))}
          </div>

          {/* Risk capital */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>RISK CAPITAL ₹</div>
            <input
              type="number"
              value={riskInr}
              onChange={e => setRiskInr(Number(e.target.value))}
              style={{ width: '100%', background: '#111', border: '1px solid #333', color: C.amber, fontFamily: 'monospace', fontSize: 11, padding: '4px 8px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Execute */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>
            <button
              onClick={runScan}
              style={{
                width: '100%', padding: '8px 0', fontFamily: 'monospace', fontSize: 11,
                fontWeight: 700, letterSpacing: 2, cursor: 'pointer',
                border: '2px solid ' + (scanning ? C.red : C.orange),
                background: scanning ? '#1a0000' : '#1a0800',
                color: scanning ? C.red : C.orange,
              }}
            >
              {scanning ? `STOP (${progress.done}/${progress.total})` : 'EXECUTE AUDIT'}
            </button>
            {scanning && progress.total > 0 && (
              <div style={{ marginTop: 8, height: 3, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.orange, width: `${(progress.done/progress.total)*100}%`, transition: 'width 0.3s' }} />
              </div>
            )}
          </div>

          {/* Pulse stats */}
          {pulse && (
            <div style={{ padding: '10px 12px', fontSize: 10 }}>
              <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>MARKET PULSE</div>
              {[
                ['VIX',   pulse.indiaVix.toFixed(2),          pulse.indiaVix > 20 ? C.red : C.amber],
                ['NIFTY', pulse.nifty50.value.toLocaleString('en-IN'), pulse.nifty50.changePct >= 0 ? C.green : C.red],
                ['BNKNI', pulse.niftyBank.value.toLocaleString('en-IN'), pulse.niftyBank.changePct >= 0 ? C.green : C.red],
                ['REGIME', pulse.regime,                        pulse.regime === 'BULLISH' ? C.green : pulse.regime === 'BEARISH' ? C.red : C.amber],
              ].map(([k, v, col]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: C.grey }}>{k}</span>
                  <span style={{ color: col as string, fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Error */}
          {error && (
            <div style={{ padding: '6px 12px', background: '#1a0000', borderBottom: '1px solid ' + C.red, color: C.red, fontFamily: 'monospace', fontSize: 10 }}>
              ERROR: {error}
              <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontFamily: 'monospace' }}>✕</button>
            </div>
          )}

          {/* Idle */}
          {!result && !scanning && !error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 48, opacity: 0.15, userSelect: 'none' }}>🏹</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.orange, letterSpacing: 4 }}>TERMINAL READY</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.grey }}>SELECT UNIVERSE → PRESS EXECUTE AUDIT</div>
            </div>
          )}

          {/* Scanning */}
          {scanning && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.orange, letterSpacing: 3 }}>SCANNING {universe}...</div>
              {progress.total > 0 && (
                <>
                  <div style={{ width: 320, height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: C.orange, width: `${(progress.done/progress.total)*100}%`, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.grey }}>{progress.done} / {progress.total} STOCKS</div>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {result && !scanning && (
            <>
              {activeTab === 'miro'         && <><PanelHeader title="MIRO MOMENTUM LEADERBOARD" sub="Hot money detection — Vol Surge × Price Velocity" /><StocksTable stocks={result.stocks} sortKey="miroScore" /></>}
              {activeTab === 'trend'        && <><PanelHeader title="STRUCTURAL TREND & ADX" sub="Golden Alignment: Price > MA50 > MA200 | ADX > 25 confirms trend" /><StocksTable stocks={result.stocks} sortKey="adxStrength" /></>}
              {activeTab === 'reversion'    && <><PanelHeader title="MEAN REVERSION — Z-SCORE" sub="Oversold Z < -2.5 = STRONG BUY · Overbought Z > +2.5 = STRONG SELL · Snap-back expected 1-3 sessions" /><StocksTable stocks={result.stocks.filter(s => s.zScore <= -2.5 || s.zScore >= 2.5)} sortKey="zScore" /></>}
              {activeTab === 'weekly'       && <><PanelHeader title="WEEKLY INSTITUTIONAL FLOW" sub="Vol Surge > 2x with minimal price move = institutional accumulation" /><StocksTable stocks={result.stocks} sortKey="volSurge" /></>}
              {activeTab === 'filing'       && <AIPanel tickers={tickers} pulse={result.pulse} mode="filing" />}
              {activeTab === 'intelligence' && <AIPanel tickers={tickers} pulse={result.pulse} mode="debate" />}
            </>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 12px', background: '#0d0d0d', borderTop: '1px solid #1a1a1a', fontSize: 9, fontFamily: 'monospace', color: C.grey, flexShrink: 0 }}>
        <span style={{ color: C.orange }}>NIFTYSNIPER v1.2</span>
        <span>NSE · ALPHA VANTAGE · CLAUDE AI</span>
        <span style={{ color: C.green }}>● LIVE</span>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #333; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
        select option { background: #111; color: #ffaa00; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}

function PanelHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a1a1a', background: '#0d0400', flexShrink: 0 }}>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#ff6600', fontWeight: 700, letterSpacing: 2 }}>{title}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#555', marginTop: 2 }}>{sub}</div>
    </div>
  )
}
