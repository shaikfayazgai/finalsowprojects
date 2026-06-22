import {
  Html, Body, Container, Head, Heading, Hr, Img,
  Preview, Text, Button, Section, Row, Column,
} from "@react-email/components";
import * as React from "react";

export interface WelcomeEnterpriseProps {
  firstName: string;
  orgName: string;
  dashboardUrl: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function WelcomeEnterprise({
  firstName = "Admin",
  orgName = "Your Organization",
  dashboardUrl = "#",
  headerColor = "#7C5C3E",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd. · You received this because you registered an enterprise organization.",
}: WelcomeEnterpriseProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to GlimmoraTeam — {orgName} is ready to go.</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* ── Header ── */}
          <Section style={{ ...header, background: `linear-gradient(135deg, #0D1B2A 0%, ${headerColor} 100%)` }}>
            <Row>
              <Column style={{ padding: "32px 40px 0" }}>
                {logoUrl
                  ? <Img src={logoUrl} width="140" height="36" alt="GlimmoraTeam" />
                  : <Text style={brandName}>GlimmoraTeam</Text>
                }
                <Text style={brandTagline}>AI-Governed Global Workforce Platform</Text>
              </Column>
            </Row>
            <Section style={headerArc} />
          </Section>

          {/* ── Hero ── */}
          <Section style={heroSection}>
            <Row>
              <Column align="center">
                <div style={iconCircle}>
                  <Text style={iconText}>🏢</Text>
                </div>
                <Heading style={h1}>{orgName} is live!</Heading>
                <Text style={heroSubtitle}>Your enterprise workspace is ready, {firstName}.</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Content ── */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              Your organisation has been successfully onboarded onto{" "}
              <strong style={{ color: "#0D1B2A" }}>GlimmoraTeam</strong>. You now have full access
              to your enterprise admin console with AI-powered project governance tools.
            </Text>

            {/* Feature highlights */}
            <Section style={featuresGrid}>
              {[
                { icon: "📄", title: "SOW Management", desc: "Upload, extract & manage statements of work with AI" },
                { icon: "✅", title: "Approval Pipeline", desc: "Two-step approval (Glimmora Commercial → enterprise sign-off)" },
                { icon: "👥", title: "Team Formation", desc: "AI-matched contributor teams for every project" },
                { icon: "📊", title: "Analytics", desc: "Real-time project health, cost & delivery insights" },
              ].map((feat) => (
                <Row key={feat.title} style={featureRow}>
                  <Column style={featureIconCol}>
                    <Text style={featureIcon}>{feat.icon}</Text>
                  </Column>
                  <Column style={featureTextCol}>
                    <Text style={featureTitle}>{feat.title}</Text>
                    <Text style={featureDesc}>{feat.desc}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* CTA */}
            <Row style={{ margin: "28px 0 16px" }}>
              <Column align="center">
                <Button href={dashboardUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
                  Open Enterprise Dashboard →
                </Button>
              </Column>
            </Row>

            <Section style={supportCard}>
              <Row>
                <Column>
                  <Text style={supportTitle}>Need assistance getting started?</Text>
                  <Text style={supportText}>
                    Our onboarding team is here to help. Reply to this email or contact us at{" "}
                    <a href="mailto:support@glimmora.com" style={{ color: headerColor, fontWeight: 600, textDecoration: "none" }}>
                      support@glimmora.com
                    </a>
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* ── Footer ── */}
          <Section style={footer}>
            <Hr style={footerHr} />

            {/* Social icons */}
            <Row>
              <Column align="center" style={{ padding: "24px 40px 8px" }}>
                <Text style={followText}>Follow us</Text>
                <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
                  <tr>
                    {[
                      { href: "https://twitter.com/glimmorateam",      bg: "#000000", label: "𝕏",  title: "Twitter / X" },
                      { href: "https://linkedin.com/company/glimmora", bg: "#0A66C2", label: "in", title: "LinkedIn" },
                      { href: "https://instagram.com/glimmorateam",    bg: "#E1306C", label: "▷",  title: "Instagram" },
                      { href: "https://youtube.com/@glimmorateam",     bg: "#FF0000", label: "▶",  title: "YouTube" },
                    ].map((s) => (
                      <td key={s.title} style={{ padding: "0 6px" }}>
                        <a href={s.href} title={s.title} style={{ textDecoration: "none" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: s.bg, textAlign: "center", lineHeight: "36px", display: "inline-block" }}>
                            <span style={{ color: "#ffffff", fontSize: s.label === "in" ? "14px" : "13px", fontWeight: 700, fontFamily: "sans-serif" }}>{s.label}</span>
                          </div>
                        </a>
                      </td>
                    ))}
                  </tr>
                </table>
              </Column>
            </Row>

            <Row>
              <Column style={{ padding: "12px 40px 20px" }}>
                <Text style={footerBrand}>GlimmoraTeam</Text>
                <Text style={footerTextStyle}>{footerText}</Text>
              </Column>
            </Row>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

/* ── Styles ── */
const body: React.CSSProperties = { backgroundColor: "#F0EDE9", fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif", margin: 0, padding: 0 };
const container: React.CSSProperties = { margin: "40px auto", maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.10)" };
const header: React.CSSProperties = { position: "relative" };
const brandName: React.CSSProperties = { color: "#ffffff", fontSize: "20px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.3px" };
const brandTagline: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 32px", letterSpacing: "0.04em", textTransform: "uppercase" };
const headerArc: React.CSSProperties = { height: "28px", background: "#ffffff", borderRadius: "50% 50% 0 0 / 100% 100% 0 0", margin: "-1px 0 0" };
const heroSection: React.CSSProperties = { padding: "8px 40px 24px", textAlign: "center" };
const iconCircle: React.CSSProperties = { display: "inline-block", width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#F5EFE9", border: "3px solid #DCC9B5", textAlign: "center", lineHeight: "72px", margin: "0 auto 16px" };
const iconText: React.CSSProperties = { fontSize: "32px", margin: 0, lineHeight: "72px", display: "block" };
const h1: React.CSSProperties = { fontSize: "26px", fontWeight: 800, color: "#0D1B2A", margin: "0 0 8px", letterSpacing: "-0.5px" };
const heroSubtitle: React.CSSProperties = { fontSize: "15px", color: "#6b7280", margin: 0 };
const contentSection: React.CSSProperties = { padding: "4px 40px 36px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.7", color: "#374151", margin: "0 0 24px" };
const featuresGrid: React.CSSProperties = { backgroundColor: "#F9F7F5", borderRadius: "12px", padding: "4px 16px", margin: "0 0 8px" };
const featureRow: React.CSSProperties = { padding: "12px 0", borderBottom: "1px solid #EDE8E3" };
const featureIconCol: React.CSSProperties = { width: "40px", verticalAlign: "top", paddingTop: "2px" };
const featureIcon: React.CSSProperties = { fontSize: "20px", margin: 0 };
const featureTextCol: React.CSSProperties = { verticalAlign: "top" };
const featureTitle: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#0D1B2A", margin: "0 0 2px" };
const featureDesc: React.CSSProperties = { fontSize: "13px", color: "#6b7280", margin: 0 };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", borderRadius: "10px", padding: "14px 32px", cursor: "pointer" };
const supportCard: React.CSSProperties = { backgroundColor: "#FFF8F3", border: "1px solid #F0DDD0", borderRadius: "10px", padding: "16px 20px", margin: "8px 0 0" };
const supportTitle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#0D1B2A", margin: "0 0 4px" };
const supportText: React.CSSProperties = { fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.5" };
const footer: React.CSSProperties = { backgroundColor: "#F9F7F5" };
const followText: React.CSSProperties = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 12px", textAlign: "center" };
const footerHr: React.CSSProperties = { border: "none", borderTop: "1px solid #EDE8E3", margin: 0 };
const footerBrand: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", margin: "0 0 4px" };
const footerTextStyle: React.CSSProperties = { fontSize: "11px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
