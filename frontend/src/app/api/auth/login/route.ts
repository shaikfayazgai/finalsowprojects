import { fetchInternal } from "@/lib/api/client";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return Response.json(
      { detail: "Email and password required" },
      { status: 400 },
    );
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_GLIMMORA_API_URL || 
                    process.env.GLIMMORA_API_URL || 
                    "http://localhost:9000";
    
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return Response.json(body, { status: response.status });
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("[/api/auth/login] Error:", error);
    return Response.json(
      { detail: "Authentication failed" },
      { status: 500 },
    );
  }
}
