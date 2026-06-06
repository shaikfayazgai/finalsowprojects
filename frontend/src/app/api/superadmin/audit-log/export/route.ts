import { NextRequest } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";
export async function GET(req: NextRequest){const qs=new URL(req.url).search;const a=req.headers.get("authorization")??"";const r=await fetch(`${BACKEND}/api/superadmin/audit-log/export${qs}`,{headers:{Authorization:a},signal:AbortSignal.timeout(30000)});return new Response(await r.text(),{status:r.status,headers:{"Content-Type":"text/csv","Content-Disposition":"attachment; filename=audit-log.csv"}});}
