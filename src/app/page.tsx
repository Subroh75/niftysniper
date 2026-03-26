'use client'
import { useState, useRef } from 'react'
import type { ScanResult, Universe } from '@/types'

const TABS = [
  { id: 'miro', label: '🎯 Miro Flow' },
  { id: 'trend', label: '📈 Trend & ADX' },
  { id: 'reversion', label: '🪃 Reversion' },
  { id: 'weekly', label: '💎 Weekly Sniper' },
  { id: 'filing', label: '🧬 Filing Audit' },
  { id: 'intelligence', label: '🧠 Intelligence Lab' },
]

const UNIVERSES = [
  { value: 'NIFTY100' as Universe, label: 'Nifty 100', sub: '~2 min' },
  { value: 'NIFTY500' as Universe, label: 'Nifty 500', sub: '~8 min' },
  { value: 'FULL_MARKET' as Universe, label: 'Full Market', sub: '~20 min' },
]

function Badge({ reco }: { reco: string }) {
  const cls = reco.includes('STRONG BUY') ? 'badge-buy' : reco.includes('STRONG SELL') ? 'badge-sell' : reco.includes('REVERSION') ? 'badge-reversion' : 'badge-neutral'
  return <span className={`${cls} px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap`}>{reco}</span>
}

function StocksTable({ stocks, sortKey }: { stocks: ScanResult['stocks']; sortKey: keyof ScanResult['stocks'][0] }) {
  const sorted = [...stocks].sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0f1520] z-10">
          <tr className="border-b border-[rgba(0,200,130,0.18)]">
            {['#','TICKER','SECTOR','PRICE','RECO','MIRO','VOL','CHG%','SL','QTY'].map(h => (
              <th key={h} className="text-left px-3 py-2 text-[8px] text-[#475569] tracking-wider font-normal whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.ticker} className="stock-row">
              <td className="px-3 py-2 text-[9px] text-[#334155]">{i+1}</td>
              <td className="px-3 py-2 text-[#00a8ff] font-bold text-[10px]">{s.ticker.replace('.NS','')}</td>
              <td className="px-3 py-2 text-[9px] text-[#475569] max-w-[80px] truncate">{s.sector}</td>
              <td className="px-3 py-2 text-[10px] font-mono">₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</td>
              <td className="px-3 py-2"><Badge reco={s.recommendation} /></td>
              <td className="px-3 py-2 text-[10px] font-bold" style={{color:s.miroScore>=8?'#00c882':s.miroScore>=5?'#f59e0b':'#ef4444'}}>{s.miroScore}</td>
              <td className="px-3 py-2 text-[10px] font-bold" style={{color:s.volSurge>=2?'#00c882':'#64748b'}}>{s.volSurge.toFixed(2)}x</td>
              <td className="px-3 py-2 text-[10px] font-mono" style={{color:s.pctChange>=0?'#00c882':'#ef4444'}}>{s.pctChange>=0?'+':''}{s.pctChange.toFixed(2)}%</td>
              <td className="px-3 py-2 text-[9px] text-[#64748b] font-mono">{s.stopLoss?'₹'+s.stopLoss.toFixed(2):'—'}</td>
              <td className="px-3 py-2 text-[9px] text-[#94a3b8] font-mono">{s.qty??'—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AITab({ tickers, pulse, mode }: { tickers: string[]; pulse: ScanResult['pulse']; mode: 'debate'|'filing' }) {
  const [ticker, setTicker] = useState(tickers[0]??'')
  const [streaming, setStreaming] = useState(false)
  const [content, setContent] = useState('')
  const abortRef = useRef<AbortController|null>(null)
  async function run() {
    if (streaming) { abortRef.current?.abort(); setStreaming(false); return }
    setContent(''); setStreaming(true)
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/intelligence', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ticker, vix:pulse.indiaVix, regime:pulse.regime, fiiNet:pulse.fiiNetCr, mode}),
        signal: abortRef.current.signal,
      })
      const reader = res.body!.getReader(), dec = new TextDecoder()
      while (true) {
        const {done, value} = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n').filter(l=>l.startsWith('data: '))) {
          const p = line.slice(6); if (p==='[DONE]') break
          try { const {text}=JSON.parse(p); setContent(prev=>prev+text) } catch (_e) { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name!=='AbortError') setContent(p=>p+'\n\n⚠️ Error')
    } finally { setStreaming(false) }
  }
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[rgba(0,200,130,0.18)]">
        <h2 className="text-[11px] font-bold text-[#e2e8f0]">{mode==='debate'?'🧠 INTELLIGENCE LAB — INVESTMENT COUNCIL':'🧬 FILING AUDIT — SEBI REG 30'}</h2>
      </div>
      <div className="px-4 py-3 border-b border-[rgba(0,200,130,0.1)] flex items-end gap-3">
        <select value={ticker} onChange={e=>{setTicker(e.target.value);setContent('')}} className="bg-[#141d2e] border border-[rgba(0,200,130,0.18)] text-[#e2e8f0] font-mono text-[10px] px-2 py-1.5 rounded w-48">
          {tickers.map(t=><option key={t} value={t}>{t.replace('.NS','')}</option>)}
        </select>
        <button onClick={run} className={`px-4 py-2 font-mono font-bold text-[10px] rounded border ${streaming?'text-[#ef4444] border-[rgba(239,68,68,0.3)]':mode==='debate'?'text-[#00c882] border-[rgba(0,200,130,0.3)]':'text-[#00a8ff] border-[rgba(0,168,255,0.3)]'}`}>
          {streaming?'⏹ STOP':mode==='debate'?'⚡ SUMMON COUNCIL':'🔍 RUN AUDIT'}
        </button>
      </div>
      <div className="flex-1 overflow-auto px-4 py-4">
        {(content||streaming)?<pre className="text-[10px] text-[#94a3b8] whitespace-pre-wrap leading-relaxed">{content}{streaming&&<span className="animate-pulse">▊</span>}</pre>:<p className="text-[#475569] text-xs p-8">Select a stock and {mode==='debate'?'summon the council':'run the audit'}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('miro')
  const [universe, setUniverse] = useState<Universe>('NIFTY500')
  const [riskInr, setRiskInr] = useState(5000)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState({done:0, total:0})
  const [result, setResult] = useState<ScanResult|null>(null)
  const [error, setError] = useState<string|null>(null)
  const abortRef = useRef<AbortController|null>(null)

  async function runScan() {
    if (scanning) { abortRef.current?.abort(); setScanning(false); return }
    setScanning(true); setError(null); setProgress({done:0,total:0})
    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/scan', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({universe, riskInr}), signal: abortRef.current.signal,
      })
      const reader = res.body!.getReader(), dec = new TextDecoder()
      while (true) {
        const {done,value} = await reader.read(); if (done) break
        for (const line of dec.decode(value).split('\n').filter(l=>l.startsWith('data: '))) {
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type==='start') setProgress({done:0,total:d.total})
            if (d.type==='progress') setProgress({done:d.done,total:d.total})
            if (d.type==='complete') { setResult(d.result); setScanning(false) }
            if (d.type==='error') { setError(d.message); setScanning(false) }
          } catch (_e) { /* skip */ }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name!=='AbortError') setError(String(e))
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0e17]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f1520] border-b border-[rgba(0,200,130,0.18)] shrink-0">
        <span className="font-mono font-bold text-[13px] text-[#00c882] tracking-[2px]">NIFTY<span className="text-[#00a8ff]">SNIPER</span></span>
        <span className="flex items-center gap-1 text-[10px] text-[#64748b] font-mono"><span className="live-dot" />NSE LIVE</span>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 flex-shrink-0 border-r border-[rgba(0,200,130,0.18)] bg-[#0f1520] flex flex-col overflow-y-auto p-3 space-y-3">
          <p className="text-[10px] text-[#64748b]">🏹 NIFTY SNIPER v1.0</p>
          {result?.pulse && (
            <div className="border border-[rgba(0,200,130,0.18)] rounded text-[10px]">
              <div className="flex justify-between p-1.5"><span className="text-[#94a3b8]">India VIX</span><span className={result.pulse.indiaVix>20?'text-[#ef4444] font-bold':'text-[#f59e0b] font-bold'}>{result.pulse.indiaVix.toFixed(2)}</span></div>
              <div className="flex justify-between p-1.5"><span className="text-[#94a3b8]">FII Net</span><span className={result.pulse.fiiNetCr<0?'text-[#ef4444] font-bold':'text-[#00c882] font-bold'}>₹{result.pulse.fiiNetCr.toLocaleString('en-IN')}</span></div>
            </div>
          )}
          <div>
            <p className="text-[9px] text-[#475569] tracking-wider mb-1.5">SCAN UNIVERSE</p>
            {UNIVERSES.map(u=>(
              <button key={u.value} onClick={()=>setUniverse(u.value)} className={`w-full flex justify-between items-center px-2 py-1.5 rounded text-[10px] font-mono border mb-1 ${universe===u.value?'bg-[rgba(0,200,130,0.15)] border-[rgba(0,200,130,0.3)] text-[#00c882]':'border-[rgba(255,255,255,0.06)] text-[#64748b]'}`}>
                <span>{u.label}</span><span className="text-[8px] opacity-60">{u.sub}</span>
              </button>
            ))}
          </div>
          <div>
            <p className="text-[9px] text-[#475569] tracking-wider mb-1.5">RISK CAPITAL (₹)</p>
            <input type="number" value={riskInr} onChange={e=>setRiskInr(Number(e.target.value))} className="w-full bg-[#141d2e] border border-[rgba(0,200,130,0.18)] text-[#e2e8f0] font-mono text-[11px] px-2 py-1.5 rounded focus:outline-none" />
          </div>
          <button onClick={runScan} className={`w-full py-2.5 font-mono font-bold text-[11px] rounded border ${scanning?'text-[#ef4444] border-[rgba(239,68,68,0.3)] animate-pulse':'text-[#00c882] border-[rgba(0,200,130,0.3)] hover:bg-[rgba(0,200,130,0.15)]'}`}>
            {scanning?`⏹ STOP (${progress.done}/${progress.total})`:'🚀 EXECUTE FULL MARKET AUDIT'}
          </button>
          {result?.pulse && (
            <div className="p-2 rounded text-[10px] font-bold text-center" style={{background:result.pulse.regime==='BULLISH'?'rgba(0,200,130,0.12)':result.pulse.regime==='BEARISH'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)',border:`1px solid ${result.pulse.regime==='BULLISH'?'rgba(0,200,130,0.3)':result.pulse.regime==='BEARISH'?'rgba(239,68,68,0.25)':'rgba(245,158,11,0.25)'}`,color:result.pulse.regime==='BULLISH'?'#00c882':result.pulse.regime==='BEARISH'?'#ef4444':'#f59e0b'}}>
              {result.pulse.regime} ({result.pulse.breadthPct}%)
            </div>
          )}
          {result && <div className="text-[8px] text-[#334155] space-y-0.5"><p>✅ {result.totalScanned} scanned</p><p>🚀 {result.stocks.filter(s=>s.recommendation==='STRONG BUY').length} Strong Buys</p></div>}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex border-b border-[rgba(0,200,130,0.18)] bg-[#0f1520] overflow-x-auto shrink-0">
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`px-4 py-2.5 text-[10px] font-mono tracking-wider whitespace-nowrap border-b-2 ${activeTab===tab.id?'border-[#00c882] text-[#00c882]':'border-transparent text-[#64748b]'}`}>{tab.label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-auto">
            {!result&&!scanning&&<div className="flex items-center justify-center h-64"><div className="text-center"><div className="text-[#00c882] text-4xl mb-4">🏹</div><p className="text-[#64748b] text-sm font-mono">Scanner Ready.</p><p className="text-[#475569] text-xs mt-1">Select universe and click EXECUTE</p></div></div>}
            {scanning&&<div className="flex items-center justify-center h-64"><div className="text-center"><div className="text-[#00c882] text-3xl mb-4 animate-pulse">⚡</div><p className="text-[#00c882] text-sm font-mono mb-2">Scanning {universe}...</p>{progress.total>0&&<><div className="w-64 h-1 bg-[#1e293b] rounded-full overflow-hidden mx-auto mb-2"><div className="h-full bg-[#00c882] transition-all" style={{width:`${(progress.done/progress.total)*100}%`}}/></div><p className="text-[#475569] text-xs">{progress.done}/{progress.total}</p></>}</div></div>}
            {error&&<div className="m-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono rounded">⚠️ {error}</div>}
            {result&&!scanning&&<>
              {activeTab==='miro'&&<><div className="px-4 py-3 border-b border-[rgba(0,200,130,0.18)]"><h2 className="text-[11px] font-bold text-[#e2e8f0]">🎯 MIRO MOMENTUM LEADERBOARD</h2></div><StocksTable stocks={result.stocks} sortKey="miroScore" /></>}
              {activeTab==='trend'&&<><div className="px-4 py-3 border-b border-[rgba(0,200,130,0.18)]"><h2 className="text-[11px] font-bold text-[#e2e8f0]">📈 STRUCTURAL TREND & ADX</h2></div><StocksTable stocks={result.stocks} sortKey="adxStrength" /></>}
              {activeTab==='reversion'&&<><div className="px-4 py-3 border-b border-[rgba(0,200,130,0.18)]"><h2 className="text-[11px] font-bold text-[#e2e8f0]">🪃 MEAN REVERSION — Z-Score &lt; -1.5</h2></div><StocksTable stocks={result.stocks.filter(s=>s.zScore<=-1.5)} sortKey="zScore" /></>}
              {activeTab==='weekly'&&<><div className="px-4 py-3 border-b border-[rgba(0,200,130,0.18)]"><h2 className="text-[11px] font-bold text-[#e2e8f0]">💎 WEEKLY INSTITUTIONAL FLOW</h2></div><StocksTable stocks={result.stocks} sortKey="volSurge" /></>}
              {activeTab==='filing'&&<AITab tickers={result.stocks.map(s=>s.ticker)} pulse={result.pulse} mode="filing" />}
              {activeTab==='intelligence'&&<AITab tickers={result.stocks.map(s=>s.ticker)} pulse={result.pulse} mode="debate" />}
            </>}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center px-3 py-1 bg-[#0f1520] border-t border-[rgba(0,200,130,0.18)] text-[9px] text-[#475569] font-mono shrink-0">
        <span>NIFTYSNIPER v1.0</span><span>NSE • YAHOO FINANCE • CLAUDE AI</span><span className="text-[#00c882]">● LIVE</span>
      </div>
    </div>
  )
}
