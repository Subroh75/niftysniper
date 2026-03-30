'use client'

import { useState, useRef } from 'react'

import type { ScanResult, Universe } from '@/types'



const C = {

  bg:'#000000', panel:'#0a0a0a', border:'#1a1a1a',

  orange:'#ff6600', amber:'#ffaa00', green:'#00ff41',

  red:'#ff2222', blue:'#4488ff', white:'#ffffff',

  grey:'#888888', lgrey:'#aaaaaa',

}



const TABS = [
  { id: 'miro',         label: 'Miro'      },
  { id: 'momentum',     label: 'Momentum'  },
  { id: 'lowvol',       label: 'Low-Vol'   },
  { id: 'macd',         label: 'MA Cross'  },
  { id: 'multifactor',  label: 'Alpha'     },
  { id: 'reversion',    label: 'Reversion' },
  { id: 'weekly',       label: 'Weekly'    },
  { id: 'filing',       label: 'AI Lab'    },
  { id: 'intelligence', label: 'AI Debate' },
]



const UNIVERSES = [
  { value: 'NIFTY50'  as Universe, label: 'NIFTY 50',  sub: '~1 MIN' },
  { value: 'NIFTY200' as Universe, label: 'NIFTY 200', sub: '~4 MIN' },
  { value: 'NIFTY500' as Universe, label: 'NIFTY 500', sub: '~8 MIN' },
]



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



// ─── MIRO TAB — Hot money: miroScore, volSurge, pctChange ────────────────────

function MiroTable({ stocks }: { stocks: ScanResult['stocks'] }) {

  const sorted = [...stocks].sort((a, b) => b.miroScore - a.miroScore)

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



// ─── TREND TAB — ADX strength, MA alignment ──────────────────────────────────

function TrendTable({ stocks }: { stocks: ScanResult['stocks'] }) {

  const sorted = [...stocks].sort((a, b) => b.adxStrength - a.adxStrength)

  return (

    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'monospace' }}>

        <thead><tr style={{ borderBottom: '1px solid ' + C.orange, background: '#0d0d00' }}>

          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH>

          <TH>ADX</TH><TH>MA20</TH><TH>MA50</TH><TH>MA200</TH><TH>ALIGNMENT</TH><TH>ATR</TH><TH>S/L</TH>

        </tr></thead>

        <tbody>

          {sorted.map((s, i) => {

            const golden = s.price > s.ma50 && s.ma50 > s.ma200

            const partial = s.price > s.ma50 && s.ma50 <= s.ma200

            const align = golden ? 'GOLDEN' : partial ? 'PARTIAL' : 'BROKEN'

            const alignCol = golden ? C.green : partial ? C.amber : C.red

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



// ─── REVERSION TAB — Z-score overextended stocks ─────────────────────────────

function ReversionTable({ stocks }: { stocks: ScanResult['stocks'] }) {

  const filtered = [...stocks].filter(s => Math.abs(s.zScore) >= 1.5).sort((a, b) => a.zScore - b.zScore)

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



// ─── WEEKLY TAB — Institutional accumulation signals ─────────────────────────

function WeeklyTable({ stocks }: { stocks: ScanResult['stocks'] }) {

  const sorted = [...stocks].sort((a, b) => b.volSurge - a.volSurge)

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



// ─── AI PANEL ────────────────────────────────────────────────────────────────

function AIPanel({ tickers, pulse, mode }: { tickers: string[]; pulse: ScanResult['pulse']; mode: 'debate'|'filing' }) {

  const [ticker, setTicker] = useState(tickers[0] ?? '')

  const [streaming, setStreaming] = useState(false)

  const [content, setContent] = useState('')

  const abortRef = useRef<AbortController|null>(null)

  const bufRef = useRef('')

  async function run() {

    if (streaming) { abortRef.current?.abort(); setStreaming(false); return }

    bufRef.current = ''; setContent(''); setStreaming(true)

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

          try { const { text } = JSON.parse(line.slice(6)); bufRef.current += text; setContent(bufRef.current) } catch {}

        }

      }

    } catch (e: unknown) {

      if (e instanceof Error && e.name !== 'AbortError') { bufRef.current += '\n\n[ERROR] ' + String(e); setContent(bufRef.current) }

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

        <button onClick={run} style={{ background: 'transparent', border: '1px solid ' + (streaming ? C.red : C.orange), color: streaming ? C.red : C.orange, fontFamily: 'monospace', fontSize: 10, padding: '3px 12px', cursor: 'pointer', letterSpacing: 1, fontWeight: 700 }}>{btnLabel}</button>

      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: C.bg }}>

        {content || streaming ? (

          <pre style={{ fontFamily: 'monospace', fontSize: 10, color: C.lgrey, whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>

            {content}{streaming && <span style={{ color: C.orange }}>▊</span>}

          </pre>

        ) : (

          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', fontSize: 10, color: '#333' }}>

            SELECT STOCK → PRESS {btnLabel}

          </div>

        )}

      </div>

    </div>

  )

}



// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────


// ─── STRATEGY TABLES (from Kakushadze & Serur "151 Trading Strategies") ──────

function MomentumTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const sorted = [...stocks].sort((a, b) => b.pctChange - a.pctChange)
  const n = sorted.length
  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:'monospace' }}>
        <thead><tr style={{ borderBottom:'1px solid '+C.orange, background:'#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH><TH>MOM%</TH><TH>MIRO</TH><TH>SURGE</TH><TH>DECILE</TH><TH>SIGNAL</TH><TH>S/L</TH>
        </tr></thead>
        <tbody>{sorted.map((s, i) => {
          const d = Math.ceil(((i+1)/n)*10)
          const sig = d<=2?'BUY WINNER':d>=9?'AVOID LOSER':'HOLD'
          const col = d<=2?C.green:d>=9?C.red:C.grey
          return (<Row key={s.ticker} i={i}>
            <TD col="#444">{i+1}</TD><TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
            <td style={{padding:'3px 8px',color:C.grey,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.sector}</td>
            <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
            <td style={{padding:'3px 8px',color:s.pctChange>=0?C.green:C.red,fontWeight:700,fontSize:13}}>{s.pctChange>=0?'+':''}{s.pctChange.toFixed(2)}%</td>
            <TD col={s.miroScore>=8?C.green:s.miroScore>=5?C.amber:C.grey} bold>{s.miroScore}</TD>
            <TD col={s.volSurge>=2?C.green:C.grey}>{s.volSurge.toFixed(2)}x</TD>
            <td style={{padding:'3px 8px',color:d<=2?C.green:d>=9?C.red:C.grey,fontWeight:700}}>D{d}</td>
            <TD col={col} bold>{sig}</TD>
            <TD>{s.stopLoss?'₹'+s.stopLoss.toFixed(2):'—'}</TD>
          </Row>)
        })}</tbody>
      </table>
    </div>
  )
}

function LowVolTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const sorted = [...stocks].sort((a,b) => (a.atr/Math.max(a.price,1)) - (b.atr/Math.max(b.price,1)))
  const n = sorted.length
  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:'monospace' }}>
        <thead><tr style={{ borderBottom:'1px solid '+C.orange, background:'#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH><TH>ATR</TH><TH>ATR%</TH><TH>VOL DECILE</TH><TH>SIGNAL</TH><TH>MIRO</TH><TH>S/L</TH><TH>QTY</TH>
        </tr></thead>
        <tbody>{sorted.map((s,i) => {
          const atrPct = s.price>0?(s.atr/s.price*100):0
          const d = Math.ceil(((i+1)/n)*10)
          const sig = d<=2?'LOW-VOL BUY':d>=9?'HIGH-VOL AVOID':'NEUTRAL'
          const col = d<=2?C.green:d>=9?C.red:C.grey
          return (<Row key={s.ticker} i={i}>
            <TD col="#444">{i+1}</TD><TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
            <td style={{padding:'3px 8px',color:C.grey,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.sector}</td>
            <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
            <TD>₹{s.atr.toFixed(2)}</TD>
            <td style={{padding:'3px 8px',color:atrPct<1.5?C.green:atrPct>3?C.red:C.amber,fontWeight:700,fontSize:13}}>{atrPct.toFixed(2)}%</td>
            <td style={{padding:'3px 8px',color:d<=2?C.green:d>=9?C.red:C.grey,fontWeight:700}}>D{d}</td>
            <TD col={col} bold>{sig}</TD>
            <TD col={s.miroScore>=8?C.green:s.miroScore>=5?C.amber:C.grey} bold>{s.miroScore}</TD>
            <TD>{s.stopLoss?'₹'+s.stopLoss.toFixed(2):'—'}</TD>
            <TD>{s.qty??'—'}</TD>
          </Row>)
        })}</tbody>
      </table>
    </div>
  )
}

function MACrossTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const withSig = stocks.map(s => {
    const golden = s.ma20>s.ma50 && s.ma50>s.ma200
    const death  = s.ma20<s.ma50
    const bull   = s.price>s.ma20
    const signal = golden?'GOLDEN CROSS':death?'DEATH CROSS':bull?'ABOVE MA20':'BELOW MA20'
    const rank   = golden?4:bull?3:death?1:2
    const col    = golden?C.green:death?C.red:bull?C.amber:C.grey
    return { ...s, signal, rank, col }
  }).sort((a,b)=>b.rank-a.rank)
  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:'monospace' }}>
        <thead><tr style={{ borderBottom:'1px solid '+C.orange, background:'#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH><TH>MA20</TH><TH>MA50</TH><TH>MA200</TH><TH>SIGNAL</TH><TH>ADX</TH><TH>CHG%</TH><TH>S/L</TH>
        </tr></thead>
        <tbody>{withSig.map((s,i) => (
          <Row key={s.ticker} i={i}>
            <TD col="#444">{i+1}</TD><TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
            <td style={{padding:'3px 8px',color:C.grey,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.sector}</td>
            <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
            <TD col={s.price>s.ma20?C.green:C.red}>₹{s.ma20.toFixed(1)}</TD>
            <TD col={s.price>s.ma50?C.green:C.red}>₹{s.ma50.toFixed(1)}</TD>
            <TD col={s.price>s.ma200?C.green:C.red}>₹{s.ma200.toFixed(1)}</TD>
            <TD col={s.col} bold>{s.signal}</TD>
            <TD col={s.adxStrength>25?C.green:C.grey}>{s.adxStrength.toFixed(1)}</TD>
            <TD col={s.pctChange>=0?C.green:C.red}>{s.pctChange>=0?'+':''}{s.pctChange.toFixed(2)}%</TD>
            <TD>{s.stopLoss?'₹'+s.stopLoss.toFixed(2):'—'}</TD>
          </Row>
        ))}</tbody>
      </table>
    </div>
  )
}

function MultifactorTable({ stocks }: { stocks: ScanResult['stocks'] }) {
  const n = stocks.length
  const rank = (arr: ScanResult['stocks'], key: keyof ScanResult['stocks'][0], asc=false) => {
    const s = [...arr].sort((a,b)=> asc ? (a[key] as number)-(b[key] as number) : (b[key] as number)-(a[key] as number))
    const m: Record<string,number> = {}; s.forEach((x,i)=>{ m[x.ticker]=n-i }); return m
  }
  const momR  = rank(stocks,'pctChange')
  const volR  = rank(stocks,'atr',true)
  const miroR = rank(stocks,'miroScore')
  const zR    = rank(stocks,'zScore',true)
  const scored = stocks.map(s => ({
    ...s,
    alpha: Math.round((momR[s.ticker]||0)*0.30+(volR[s.ticker]||0)*0.25+(miroR[s.ticker]||0)*0.30+(zR[s.ticker]||0)*0.15),
    mR: momR[s.ticker]||0, vR: volR[s.ticker]||0, miR: miroR[s.ticker]||0,
  })).sort((a,b)=>b.alpha-a.alpha)
  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, fontFamily:'monospace' }}>
        <thead><tr style={{ borderBottom:'1px solid '+C.orange, background:'#0d0d00' }}>
          <TH>#</TH><TH>TICKER</TH><TH>SECTOR</TH><TH>PRICE</TH><TH>α SCORE</TH><TH>MOM#</TH><TH>VOL#</TH><TH>MIRO#</TH><TH>SIGNAL</TH><TH>S/L</TH><TH>QTY</TH>
        </tr></thead>
        <tbody>{scored.map((s,i) => {
          const d = Math.ceil(((i+1)/n)*10)
          const sig = d<=2?'STRONG BUY':d>=9?'AVOID':d<=4?'BUY':'NEUTRAL'
          const col = d<=2?C.green:d>=9?C.red:d<=4?'#00cc66':C.grey
          return (<Row key={s.ticker} i={i}>
            <TD col="#444">{i+1}</TD><TD col={C.amber} bold>{s.ticker.replace('.NS','')}</TD>
            <td style={{padding:'3px 8px',color:C.grey,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.sector}</td>
            <TD col={C.white}>₹{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})}</TD>
            <td style={{padding:'3px 8px',color:d<=2?C.green:d<=4?C.amber:C.grey,fontWeight:900,fontSize:15}}>{s.alpha}</td>
            <TD col={C.grey}>#{s.mR}</TD><TD col={C.grey}>#{s.vR}</TD><TD col={C.grey}>#{s.miR}</TD>
            <TD col={col} bold>{sig}</TD>
            <TD>{s.stopLoss?'₹'+s.stopLoss.toFixed(2):'—'}</TD>
            <TD>{s.qty??'—'}</TD>
          </Row>)
        })}</tbody>
      </table>
    </div>
  )
}

export default function Dashboard() {

  const [activeTab, setActiveTab]     = useState('miro')

  const [universe, setUniverse]       = useState<Universe>('NIFTY50')

  const [riskInr, setRiskInr]         = useState(5000)

  const [scanning, setScanning]       = useState(false)

  const [progress, setProgress]       = useState({ done: 0, total: 0 })

  const [result, setResult]           = useState<ScanResult|null>(null)

  const [error, setError]             = useState<string|null>(null)
  const [loggedIn, setLoggedIn]       = useState(false)
  const [authMode, setAuthMode]       = useState<'login'|'register'>('login')
  const [loginEmail, setLoginEmail]   = useState('')
  const [loginPwd, setLoginPwd]       = useState('')
  const [loginErr, setLoginErr]       = useState('')
  const [regName, setRegName]         = useState('')
  const [regEmail, setRegEmail]       = useState('')
  const [regPhone, setRegPhone]       = useState('')
  const [regPwd, setRegPwd]           = useState('')
  const [regUser, setRegUser]         = useState('')
  const [regErr, setRegErr]           = useState('')

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



  // ─── AUTH SCREEN ────────────────────────────────────────────────────────────
  if (!loggedIn) {
    const inp = { background:'#0d0d0d', border:'1px solid #222', color:C.white, fontFamily:'monospace', fontSize:12, padding:'10px 12px', outline:'none', width:'100%', boxSizing:'border-box' as const }
    const lbl = { fontFamily:'monospace', fontSize:9, color:'#555', letterSpacing:1, marginBottom:4, display:'block' as const }
    const doLogin = () => {
      if (!loginEmail || !loginPwd) { setLoginErr('Email and password required'); return }
      // Hardcoded for now — replace with real auth later
      if (loginPwd === 'nifty2024') { setLoggedIn(true) } else { setLoginErr('Invalid credentials') }
    }
    const doRegister = () => {
      if (!regName || !regEmail || !regPhone || !regPwd || !regUser) { setRegErr('All fields are required'); return }
      if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(regEmail)) { setRegErr('Invalid email address'); return }
      if (!/^[6-9]d{9}$/.test(regPhone)) { setRegErr('Enter valid 10-digit Indian mobile number'); return }
      if (regPwd.length < 6) { setRegErr('Password must be at least 6 characters'); return }
      // Simulate registration success — wire to real DB later
      setLoggedIn(true)
    }
    return (
      <div style={{ minHeight:'100vh', background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 16px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontFamily:'monospace', fontSize:28, color:C.orange, fontWeight:900, letterSpacing:6 }}>NIFTYSNIPER</div>
          <div style={{ fontFamily:'monospace', fontSize:10, color:'#444', letterSpacing:3, marginTop:4 }}>INSTITUTIONAL MARKET INTELLIGENCE TERMINAL</div>
        </div>

        {/* Card */}
        <div style={{ width:'100%', maxWidth:420, background:'#080808', border:'1px solid #1a1a1a', padding:32 }}>

          {/* Tabs */}
          <div style={{ display:'flex', marginBottom:28, borderBottom:'1px solid #1a1a1a' }}>
            {(['login','register'] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setLoginErr(''); setRegErr('') }}
                style={{ flex:1, padding:'8px 0', fontFamily:'monospace', fontSize:11, fontWeight:700, letterSpacing:2, cursor:'pointer', border:'none', background:'transparent', color:authMode===m?C.orange:'#444', borderBottom:'2px solid '+(authMode===m?C.orange:'transparent'), textTransform:'uppercase' as const }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {authMode === 'login' ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Social login */}
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ flex:1, padding:'10px 0', background:'#111', border:'1px solid #222', color:C.white, fontFamily:'monospace', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>G</span> Google
                </button>
                <button style={{ flex:1, padding:'10px 0', background:'#111', border:'1px solid #222', color:C.white, fontFamily:'monospace', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>🍎</span> Apple
                </button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'#1a1a1a' }} />
                <span style={{ fontFamily:'monospace', fontSize:9, color:'#333' }}>OR</span>
                <div style={{ flex:1, height:1, background:'#1a1a1a' }} />
              </div>
              {/* Phone / email */}
              <div>
                <label style={lbl}>EMAIL OR PHONE</label>
                <input style={{ ...inp, borderColor: loginErr ? C.red : '#222' }} type="text" placeholder="email@example.com or +91 98765 43210"
                  value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setLoginErr('') }} onKeyDown={e => e.key==='Enter' && doLogin()} autoFocus />
              </div>
              <div>
                <label style={lbl}>PASSWORD</label>
                <input style={{ ...inp, borderColor: loginErr ? C.red : '#222' }} type="password" placeholder="••••••••"
                  value={loginPwd} onChange={e => { setLoginPwd(e.target.value); setLoginErr('') }} onKeyDown={e => e.key==='Enter' && doLogin()} />
              </div>
              {loginErr && <div style={{ fontFamily:'monospace', fontSize:10, color:C.red }}>{loginErr}</div>}
              <button onClick={doLogin}
                style={{ width:'100%', padding:'12px 0', background:C.orange, border:'none', color:'#000', fontFamily:'monospace', fontSize:12, fontWeight:900, letterSpacing:3, cursor:'pointer' }}>
                ACCESS TERMINAL
              </button>
              <div style={{ fontFamily:'monospace', fontSize:9, color:'#333', textAlign:'center' }}>
                Dont have an account? <span onClick={() => setAuthMode('register')} style={{ color:C.orange, cursor:'pointer' }}>Register here</span>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Social sign up */}
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ flex:1, padding:'10px 0', background:'#111', border:'1px solid #222', color:C.white, fontFamily:'monospace', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>G</span> Google
                </button>
                <button style={{ flex:1, padding:'10px 0', background:'#111', border:'1px solid #222', color:C.white, fontFamily:'monospace', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>🍎</span> Apple
                </button>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ flex:1, height:1, background:'#1a1a1a' }} />
                <span style={{ fontFamily:'monospace', fontSize:9, color:'#333' }}>OR REGISTER WITH EMAIL</span>
                <div style={{ flex:1, height:1, background:'#1a1a1a' }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>FULL NAME *</label>
                  <input style={inp} type="text" placeholder="Subroh Iyer" value={regName} onChange={e => { setRegName(e.target.value); setRegErr('') }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={lbl}>USERNAME *</label>
                  <input style={inp} type="text" placeholder="subroh75" value={regUser} onChange={e => { setRegUser(e.target.value); setRegErr('') }} />
                </div>
              </div>
              <div>
                <label style={lbl}>EMAIL ADDRESS *</label>
                <input style={inp} type="email" placeholder="subroh@email.com" value={regEmail} onChange={e => { setRegEmail(e.target.value); setRegErr('') }} />
              </div>
              <div>
                <label style={lbl}>MOBILE NUMBER * (for alerts)</label>
                <input style={inp} type="tel" placeholder="98765 43210" value={regPhone} onChange={e => { setRegPhone(e.target.value.replace(/D/g,'')); setRegErr('') }} maxLength={10} />
              </div>
              <div>
                <label style={lbl}>PASSWORD * (min 6 characters)</label>
                <input style={inp} type="password" placeholder="••••••••" value={regPwd} onChange={e => { setRegPwd(e.target.value); setRegErr('') }} />
              </div>
              {regErr && <div style={{ fontFamily:'monospace', fontSize:10, color:C.red }}>{regErr}</div>}
              <button onClick={doRegister}
                style={{ width:'100%', padding:'12px 0', background:C.orange, border:'none', color:'#000', fontFamily:'monospace', fontSize:12, fontWeight:900, letterSpacing:3, cursor:'pointer' }}>
                CREATE ACCOUNT
              </button>
              <div style={{ fontFamily:'monospace', fontSize:9, color:'#333', textAlign:'center' }}>
                Already registered? <span onClick={() => setAuthMode('login')} style={{ color:C.orange, cursor:'pointer' }}>Sign in</span>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div style={{ maxWidth:420, marginTop:20, padding:'14px 16px', border:'1px solid #1a0a00', background:'#0a0500' }}>
          <div style={{ fontFamily:'monospace', fontSize:9, color:'#ff8800', fontWeight:700, letterSpacing:1, marginBottom:6 }}>⚠ DISCLAIMER</div>
          <div style={{ fontFamily:'monospace', fontSize:9, color:'#555', lineHeight:1.7 }}>
            NiftySniper is <strong style={{ color:'#888' }}>NOT registered with SEBI</strong>. This is an institutional-grade market scanner designed to assist traders in their research journey. All signals, scores and outputs are <strong style={{ color:'#888' }}>not buy/sell recommendations</strong>. Trading in equities and derivatives involves substantial risk of loss. Past performance does not guarantee future results. Please consult a SEBI-registered investment advisor before making any investment decisions. By accessing this terminal you acknowledge that you have read and accepted these terms.
          </div>
        </div>

        <div style={{ fontFamily:'monospace', fontSize:9, color:'#1a1a1a', marginTop:16 }}>v1.3 · NSE · YAHOO FINANCE · CLAUDE AI</div>
      </div>
    )
  }

    const pulse      = result?.pulse

  const tickers    = result?.stocks.map(s => s.ticker) ?? []

  const strongBuys = result?.stocks.filter(s => s.recommendation === 'STRONG BUY').length ?? 0



  return (

    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, color: C.white, fontFamily: 'monospace', overflow: 'hidden' }}>



      {/* TOP BAR */}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 36, background: C.orange, flexShrink: 0 }}>

        <span style={{ fontWeight: 900, fontSize: 15, color: '#000', letterSpacing: 3 }}>NIFTYSNIPER TERMINAL</span>

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



      {/* TABS */}

      <div style={{ display: 'flex', background: '#111', borderBottom: '2px solid ' + C.orange, flexShrink: 0 }}>

        {TABS.map(tab => (

          <button key={tab.id} onClick={() => setActiveTab(tab.id)}

            style={{ padding: '6px 20px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2, cursor: 'pointer', border: 'none', borderRight: '1px solid #222', background: activeTab === tab.id ? C.orange : 'transparent', color: activeTab === tab.id ? '#000' : C.grey }}>

            {tab.label}

          </button>

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



      {/* BODY */}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>



        {/* SIDEBAR */}

        <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid ' + C.border, background: '#080808', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>

            <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>SCAN UNIVERSE</div>

            {UNIVERSES.map(u => (
              <button key={u.value} onClick={() => setUniverse(u.value)}
                style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 8px', marginBottom:3, fontFamily:'monospace', fontSize:10, cursor:'pointer', border:'1px solid '+(universe===u.value?C.orange:'#222'), background:universe===u.value?'#1a0a00':'transparent', color:universe===u.value?C.orange:C.grey }}>
                <span>{u.label}</span>
                <span style={{ fontSize:8, opacity:0.5 }}>{u.sub}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>

            <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>RISK CAPITAL ₹</div>

            <input type="number" value={riskInr} onChange={e => setRiskInr(Number(e.target.value))}

              style={{ width: '100%', background: '#111', border: '1px solid #333', color: C.amber, fontFamily: 'monospace', fontSize: 11, padding: '4px 8px', boxSizing: 'border-box' }} />

          </div>

          <div style={{ padding: '10px 12px', borderBottom: '1px solid #1a1a1a' }}>

            <button onClick={runScan}

              style={{ width: '100%', padding: '8px 0', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: 2, cursor: 'pointer', border: '2px solid ' + (scanning ? C.red : C.orange), background: scanning ? '#1a0000' : '#1a0800', color: scanning ? C.red : C.orange }}>

              {scanning ? `STOP (${progress.done}/${progress.total})` : 'EXECUTE AUDIT'}

            </button>

            {scanning && progress.total > 0 && (

              <div style={{ marginTop: 8, height: 3, background: '#222', borderRadius: 2, overflow: 'hidden' }}>

                <div style={{ height: '100%', background: C.orange, width: `${(progress.done/progress.total)*100}%`, transition: 'width 0.3s' }} />

              </div>

            )}

          </div>

          {pulse && (

            <div style={{ padding: '10px 12px', fontSize: 10 }}>

              <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>MARKET PULSE</div>

              {([

                ['VIX',    pulse.indiaVix.toFixed(2),                  pulse.indiaVix > 20 ? C.red : C.amber],

                ['NIFTY',  pulse.nifty50.value.toLocaleString('en-IN'), pulse.nifty50.changePct >= 0 ? C.green : C.red],

                ['BNKNI',  pulse.niftyBank.value.toLocaleString('en-IN'),pulse.niftyBank.changePct >= 0 ? C.green : C.red],

                ['REGIME', pulse.regime,                                 pulse.regime === 'BULLISH' ? C.green : pulse.regime === 'BEARISH' ? C.red : C.amber],

              ] as const).map(([k, v, col]) => (

                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>

                  <span style={{ color: C.grey }}>{k}</span>

                  <span style={{ color: col, fontWeight: 700 }}>{v}</span>

                </div>

              ))}

            </div>

          )}

        </div>



        {/* MAIN PANEL */}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {error && (

            <div style={{ padding: '6px 12px', background: '#1a0000', borderBottom: '1px solid ' + C.red, color: C.red, fontFamily: 'monospace', fontSize: 10 }}>

              ERROR: {error} <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontFamily: 'monospace' }}>✕</button>

            </div>

          )}

          {!result && !scanning && !error && (

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>

              <div style={{ fontSize: 48, opacity: 0.15, userSelect: 'none' }}>🏹</div>

              <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.orange, letterSpacing: 4 }}>TERMINAL READY</div>

              <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.grey }}>SELECT UNIVERSE → PRESS EXECUTE AUDIT</div>

            </div>

          )}

          {scanning && (

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>

              <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.orange, letterSpacing: 3 }}>SCANNING {universe}...</div>

              {progress.total > 0 && <>

                <div style={{ width: 320, height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>

                  <div style={{ height: '100%', background: C.orange, width: `${(progress.done/progress.total)*100}%`, transition: 'width 0.3s' }} />

                </div>

                <div style={{ fontFamily: 'monospace', fontSize: 10, color: C.grey }}>{progress.done} / {progress.total} STOCKS</div>

              </>}

            </div>

          )}

          {result && !scanning && (

            <>

              {activeTab === 'miro'         && <><PH title="MIRO MOMENTUM LEADERBOARD" sub="Miro Score 0-10 | Score ≥8 = institutional bot-flow | Vol Surge = today vs 20-day avg" /><MiroTable stocks={result.stocks} /></>}

              {activeTab === 'trend'        && <><PH title="STRUCTURAL TREND & ADX STRENGTH" sub="GOLDEN = Price > MA50 > MA200 | ADX > 25 = strong trend confirmed | BROKEN = price below MAs" /><TrendTable stocks={result.stocks} /></>}

              {activeTab === 'reversion'    && <><PH title="MEAN REVERSION — Z-SCORE SCANNER" sub="Z < -2.5 = oversold snap-back BUY | Z > +2.5 = overbought SELL | Expected reversion in 1-3 sessions" /><ReversionTable stocks={result.stocks} /></>}

              {activeTab === 'weekly'       && <><PH title="WEEKLY INSTITUTIONAL FLOW" sub="Vol Surge ≥3x + Price Move <1.5% = silent institutional ACCUMULATION" /><WeeklyTable stocks={result.stocks} /></>}

              {activeTab === 'momentum'    && <><PH title="PRICE MOMENTUM — 12M RETURN RANKING" sub="Kakushadze §3.1 — Buy top-decile winners, avoid bottom-decile losers | Momentum persists 1-12 months" /><MomentumTable stocks={result.stocks} /></>}
              {activeTab === 'lowvol'       && <><PH title="LOW-VOLATILITY ANOMALY — QUIET STOCKS OUTPERFORM" sub="Kakushadze §3.4 — Low ATR% stocks beat high-volatility peers on risk-adjusted basis | Sort by ATR%" /><LowVolTable stocks={result.stocks} /></>}
              {activeTab === 'macd'         && <><PH title="MOVING AVERAGE CROSSOVER — GOLDEN vs DEATH CROSS" sub="Kakushadze §3.12 — MA20 > MA50 > MA200 = Golden Cross bullish | MA20 < MA50 = Death Cross warning" /><MACrossTable stocks={result.stocks} /></>}
              {activeTab === 'multifactor'  && <><PH title="ALPHA COMBOS — MULTIFACTOR COMPOSITE SCORE" sub="Kakushadze §3.6 — Momentum 30% + Low-Vol 25% + Miro 30% + Mean-Reversion 15% | Top decile = buy signal" /><MultifactorTable stocks={result.stocks} /></>}
              {activeTab === 'filing'       && <AIPanel tickers={tickers} pulse={result.pulse} mode="filing" />}

              {activeTab === 'intelligence' && <AIPanel tickers={tickers} pulse={result.pulse} mode="debate" />}

            </>

          )}

        </div>

      </div>



      {/* STATUS BAR */}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 12px', background: '#0d0d0d', borderTop: '1px solid #1a1a1a', fontSize: 9, fontFamily: 'monospace', color: C.grey, flexShrink: 0 }}>

        <span style={{ color: C.orange }}>NIFTYSNIPER v1.3</span>

        <span>NSE · YAHOO FINANCE · CLAUDE AI</span>

        <span style={{ color: C.green }}>● LIVE</span>

      </div>



      <style>{`

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }

        ::-webkit-scrollbar-track { background: #000; }

        ::-webkit-scrollbar-thumb { background: #333; }

        select option { background: #111; color: #ffaa00; }

        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

      `}</style>

    </div>

  )

                   }
