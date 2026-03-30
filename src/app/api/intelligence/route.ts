import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildDebate(ticker: string, vix: number, regime: string, fiiNet: number): string {
  return `You are running a live investment committee debate for ${ticker}.

Market Context:
- India VIX: ${vix} (${vix > 20 ? 'ELEVATED' : 'NORMAL'})
- Market Regime: ${regime}
- FII Net Flow: ₹${fiiNet.toLocaleString('en-IN')} Cr (${fiiNet < 0 ? 'NET SELLERS' : 'NET BUYERS'})

Format your response as a structured debate:

## Round 1: Opening Statements

**🟢 BULL:** [Make the bullish case with specific price targets]

**🔴 BEAR:** [Key risks and downside scenarios]

**🔵 QUANT:** [Technical levels, RSI, MACD, key support/resistance]

**🟡 RISK MGR:** [Position sizing, stop loss levels]

## Round 2: Rebuttals

**🟢 BULL:** [Rebuttal to bear case]

**🔴 BEAR:** [Rebuttal to bull case]

**🔵 QUANT:** [Stats and data]

**🟡 RISK MGR:** [Final recommendation with entry/SL/target]

## ⚖️ Verdict

[Committee consensus — BUY / SELL / HOLD with conviction score 1-10]`
}

function buildFiling(ticker: string): string {
  return `Conduct a SEBI Reg 30 compliance audit for ${ticker} (NSE-listed).

## Company Overview
Brief on business model and recent performance.

## Expected SEBI Reg 30 Disclosures
List material events that should be disclosed in the next 30 days.

## Risk Flags
Any red flags in recent filings, promoter pledging, or governance issues.

## Near-term Catalysts
Key events — results, AGM, capex announcements, sector tailwinds/headwinds.

## Analyst Verdict
Buy / Accumulate / Hold / Reduce / Sell with 12-month price target and rationale.`
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { ticker, vix = 22.81, regime = 'BEARISH', fiiNet = -5518, mode = 'debate' } = body

  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })

  const prompt = mode === 'filing' ? buildFiling(ticker) : buildDebate(ticker, vix, regime, fiiNet)
  const system  = mode === 'filing'
    ? 'You are an expert SEBI compliance analyst with deep knowledge of Indian equity markets and NSE-listed companies. Be specific and actionable.'
    : 'You are the moderator of a high-stakes investment committee for an Indian institutional fund managing ₹5,000 Cr. All analysts must be specific, cite real data, and disagree where warranted.'

  try {
    const stream = await anthropic.messages.stream({
      model:      'claude-opus-4-5-20251101',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: prompt }],
    })

    const enc      = new TextEncoder()
    const readable = new ReadableStream({
      async start(ctrl) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            ctrl.enqueue(enc.encode('data: ' + JSON.stringify({ text: chunk.delta.text }) + '\n\n'))
          }
        }
        ctrl.enqueue(enc.encode('data: [DONE]\n\n'))
        ctrl.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  } catch (err) {
    console.error('Intelligence API error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
