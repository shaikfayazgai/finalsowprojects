import "dotenv/config";
import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST ?? "smtp.office365.com";
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER ?? process.env.GMAIL_USER;
const pass = process.env.SMTP_PASSWORD ?? process.env.GMAIL_APP_PASSWORD;
const from = process.env.EMAIL_FROM ?? `GlimmoraTeam <${user}>`;

console.log("[config]");
console.log("  HOST   :", host);
console.log("  PORT   :", port);
console.log("  USER   :", JSON.stringify(user));
console.log("  PASS   :", pass ? `set (len=${pass.length})` : "MISSING");
console.log("  FROM   :", JSON.stringify(from));

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
  requireTLS: true,
  auth: { user, pass },
  connectionTimeout: 60_000,
  greetingTimeout: 30_000,
  socketTimeout: 90_000,
  tls: { ciphers: "TLSv1.2" },
  logger: true,
  debug: false,
});

try {
  console.log("\n[verify] checking SMTP credentials…");
  await transporter.verify();
  console.log("[verify] OK\n");
} catch (e) {
  console.error("[verify] FAILED:", e.message);
  console.error("  code:", e.code, "responseCode:", e.responseCode);
  console.error("  response:", e.response);
  process.exit(1);
}

try {
  console.log("[send] sending test email to rahulpattusamy@gmail.com…");
  const info = await transporter.sendMail({
    from,
    to: "rahulpattusamy@gmail.com",
    subject: "GlimmoraTeam — SMTP Test Email",
    html: `<div style="font-family:Poppins,Arial,sans-serif;padding:24px;">
      <h2>SMTP test successful</h2>
      <p>This is a diagnostic test email sent from the GlimmoraTeam app to verify Microsoft 365 SMTP delivery.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    </div>`,
  });
  console.log("[send] OK — messageId:", info.messageId);
  console.log("[send] response:", info.response);
} catch (e) {
  console.error("[send] FAILED:", e.message);
  console.error("  code:", e.code, "responseCode:", e.responseCode);
  console.error("  response:", e.response);
  process.exit(1);
}
