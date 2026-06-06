import { fetchInternal } from "@/lib/api/client";

/**
 * Public proxy for pre-account application-document uploads (Women in Tech).
 * Lives under the public /api/auth prefix (no session yet) and forwards the
 * multipart file straight to the backend, which stores it in Vercel Blob and
 * returns a { url, filename, contentType, size } descriptor. Only images/PDF
 * are accepted and size is capped — enforced server-side.
 */
function backend(): string {
  return (
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ||
    process.env.GLIMMORA_API_URL ||
    "http://localhost:9000"
  );
}

export async function POST(req: Request) {
  try {
    // Pass the multipart body through unchanged — let the platform set the
    // multipart boundary by forwarding the original Content-Type.
    const form = await req.formData();
    const res = await fetchInternal(`${backend()}/api/v1/auth/application-upload`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ detail: "Upload failed. Please try again." }, { status: 500 });
  }
}
