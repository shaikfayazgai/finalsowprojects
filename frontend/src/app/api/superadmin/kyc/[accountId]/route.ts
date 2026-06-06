import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.GLIMMORA_API_URL ?? process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? "";
function H(req: NextRequest){const h:Record<string,string>={"Content-Type":"application/json"};const a=req.headers.get("authorization");if(a)h.Authorization=a;return h;}
export async function GET(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }){const { accountId } = await params;try{const r=await fetch(`${BACKEND}/api/superadmin/kyc/${accountId}`,{headers:H(req),cache:"no-store",signal:AbortSignal.timeout(30000)});return NextResponse.json(await r.json().catch(()=>({})),{status:r.status});}catch{return NextResponse.json({detail:"Failed"},{status:500});}}
