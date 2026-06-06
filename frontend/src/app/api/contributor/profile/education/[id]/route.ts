import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";
function H(req: NextRequest){const h:Record<string,string>={"Content-Type":"application/json"};const a=req.headers.get("authorization");if(a)h.Authorization=a;return h;}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }){const { id } = await params;try{const r=await fetch(`${BACKEND}/api/contributor/profile/education/${id}`,{method:"DELETE",headers:H(req),signal:AbortSignal.timeout(30000)});return NextResponse.json(await r.json().catch(()=>({})),{status:r.status});}catch{return NextResponse.json({detail:"Failed"},{status:500});}}
