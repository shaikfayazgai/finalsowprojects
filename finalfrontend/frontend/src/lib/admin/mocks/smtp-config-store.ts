/**
 * In-memory SMTP config for admin email settings mock API.
 */

export interface AdminSmtpConfig {
  provider: "office365" | "gmail" | "sendgrid" | "custom";
  host: string;
  port: number;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  replyToAddress: string;
  useTLS: boolean;
  useSSL: boolean;
  active: boolean;
  lastTested?: string;
}

const DEFAULT: AdminSmtpConfig = {
  provider: "office365",
  host: "smtp.office365.com",
  port: 587,
  username: "",
  password: "",
  fromAddress: "",
  fromName: "Glimmora",
  replyToAddress: "",
  useTLS: true,
  useSSL: false,
  active: false,
};

let config: AdminSmtpConfig = { ...DEFAULT };

export function getAdminSmtpConfig(): AdminSmtpConfig {
  return { ...config, password: config.password ? "••••••••" : "" };
}

export function getAdminSmtpConfigRaw(): AdminSmtpConfig {
  return { ...config };
}

export function setAdminSmtpConfig(patch: Partial<AdminSmtpConfig>): AdminSmtpConfig {
  if (patch.password === "••••••••" || patch.password === "") {
    const { password: _p, ...rest } = patch;
    config = { ...config, ...rest };
  } else {
    config = { ...config, ...patch };
  }
  return getAdminSmtpConfig();
}

export function testAdminSmtpConnection(cfg: Partial<AdminSmtpConfig>): { success: boolean; message?: string } {
  const host = cfg.host ?? config.host;
  const port = cfg.port ?? config.port;
  const username = cfg.username ?? config.username;
  const fromAddress = cfg.fromAddress ?? config.fromAddress;

  if (!host?.trim()) return { success: false, message: "SMTP host is required." };
  if (!port || port < 1) return { success: false, message: "Valid SMTP port is required." };
  if (!username?.trim()) return { success: false, message: "SMTP username is required." };
  if (!fromAddress?.trim()) return { success: false, message: "From address is required." };

  config = { ...config, ...cfg, lastTested: new Date().toISOString() };
  return { success: true };
}
