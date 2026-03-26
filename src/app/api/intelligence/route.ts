import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({apiKey:process.env.ANTHROPIC_API_KEY!})
function buildDebate(t:string,v:number,r:string,f:number){return `You are running a live investment committee debate for ${t}.\nVIX: ${v}, Regime: ${r}, FII: ${f} Cr\n\nFormat:\n## Round 1\n**🟢 BULL:** [bullish case]\n**🔴 BEAR:** [risks]\n**🔵 QUANT:** [technicals]\n**🟡 RISK MGR:** [position sizing]\n\n## Round 2\n**🟢 BULL:** [rebuttal]\n **🔴 BEAR:** [rebuttal]\n**🔵 QUANT:** [stats]\n**🟡 RISK MGR:** [final reco]\n\n## ⚦️ Verdict\n[committee consensus with specific action]`}
function buildFiling(t:string){return `SEBI Reg 30 audit for ${t}.\n\n## Company Overview\n## Expected Disclosures\n## Risk Flags\n## Catalysts in Next 30 Days\n## Analyst Verdict`}
export async function POST(req:Request){
  const {ticker,vix=22.81,regime='BEARISH',fiiNet=-5518,mode='debate'}=await req.json().catch(()=>({}))
  if(!ticker) return Response.json({error:'ticker required'},{status:400})
  const prompt=mode==='filing'?buildFiling(ticker):buildDebate(ticker,vix,regime,fiiNet)
  const system=mode==='filing'?'Expert SEBI compliance analyst.':'Investment committee moderator for Indian institutional fund.'
  const stream=await anthropic.messages.stream({model:'claude-sonnet-4-20250514',max_tokens:1500,system,messages:[{role:'user',content:prompt}]})
  const enc=new TextEncoder()
  return new Response(new ReadableStream({async start(c){for await(const chunk of stream){if(chunk.type==='content_block_delta'&&chunk.delta.type==='text_delta')c.enqueue(enc.encode(`data: ${JSON.stringify({text:chunk.delta.text})}\n\n`))};c.enqueue(enc.encode('data: [DONE]\n\n'));c.close()}}),{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache'}})
}
