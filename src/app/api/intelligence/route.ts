import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function buildDebate(ticker: string, vix: number, regime: string, fiiNet: number): string {
  return 'You are running a live investment committee debate for ' + ticker + '.\n\nMarket Context:\n- India VIX: ' + vix + ' (' + (vix>20?'ELEVATED':'NORMAL') + ')\n- Market Regime: ' + regime + '\n- FII Net Flow: \u20b9' + fiiNet.toLocaleString('en-IN') + ' Cr (' + (fiiNet<0?'NET SELLERS':'NET BUYERS') + ')\n\nFormat as:\n\n## Round 1: Opening Statements\n\n**\ud83d\udfe2 BULL:** [bullish case]\n\n**\ud83d\udd34 BEAR:** [key risks]\n\n**\ud83d\udd35 QUANT:** [technical levels]\n\n**\ud83d\udfe1 RISK MGR:** [position sizing]\n\n## Round 2: Rebuttals\n\n**\ud83d\udfe2 BULL:** [rebuttal]\n\n**\ud83d\udd34 BEAR:** [rebuttal]\n\n**\ud83d\udd35 QUANT:** [stats]\n\n**\ud83d\udfe1 RISK MGR:** [final recommendation with SL levels]\n\n## \u2696\ufe0f Verdict\n\n[committee consensus]'
}

function buildFiling(ticker: string): string {
  return 'SEBI Reg 30 audit for ' + ticker + '.\n\n## Company Overview\n## Expected Disclosures\n## Risk Flags\n## Catalysts (Next 30 Days)\n## Analyst Verdict'
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { ticker, vix = 22.81, regime = 'BEARISH', fiiNet = -5518, mode = 'debate' } = body
  if (!ticker) return Response.json({ error: 'ticker required' }, { status: 400 })
  const prompt = mode === 'filing' ? buildFiling(ticker) : buildDebate(ticker, vix, regime, fiiNet)
  const system = mode === 'filing'
    ? 'You are an expert SEBI compliance analyst with deep knowledge of Indian equity markets.'
    : 'You are moderator of a high-stakes investment committee for an Indian institutional fund. Be specific, use real market data.'
  const stream = await anthropic.messages.stream({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system, messages: [{ role: 'user', content: prompt }] })
  const enc = new TextEncoder()
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
  return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
}
