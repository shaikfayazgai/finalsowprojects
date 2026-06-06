import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";
function H(req: NextRequest){const h:Record<string,string>={"Content-Type":"application/json"};const a=req.headers.get("authorization");if(a)h.Authorization=a;return h;}
export async function GET(req: NextRequest){const qs=new URL(req.url).search;try{const r=await fetch(`${BACKEND}/api/superadmin/users/check-email${qs}`,{headers:H(req),cache:"no-store",signal:AbortSignal.timeout(15000)});return NextResponse.json(await r.json().catch(()=>({})),{status:r.status});}catch{return NextResponse.json({exists:false},{status:200});}}
