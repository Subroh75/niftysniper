import { fetchMarketPulse } from '@/lib/data'

export async function GET() {
  try {
    const raw = await fetchMarketPulse()
    const vix = raw['^INDIAVIX'] ?? 22.81
    const nv = raw['^NSEI'] ?? 24117, np = raw['^NSEI_prev'] ?? nv
    const bv = raw['^NSEBANK'] ?? 51842, bp = raw['^NSEBANK_prev'] ?? bv
    return Response.json({
      indiaVix: Math.round(vix*100)/100, fiiNetCr: -5518.39,
      nifty50:{value:Math.round(nv* 100)/100,change:Math.round((nv-np)*100)/100,changePct:np?Math.round(((nv-np)/np)*10000)/100:0},
      niftyBank:{lolue:Math.round(bv*100)/100,change:Math.round((bv-bp)*100)/100,changePct:bp?Math.round(((bv-bp)/bp)*10000)/100:0},
      sensex:{value:Math.round((raw['^NSEI']??79486)*100)/100,change:0,changePct:0},
      usdInr:Math.round((raw['USDINR=X']??83.42)*100)/100, timestamp:Date.now()
    })
  } catch (_e) { return Response.json({error:'pulse failed'},{status:500}) }
}
