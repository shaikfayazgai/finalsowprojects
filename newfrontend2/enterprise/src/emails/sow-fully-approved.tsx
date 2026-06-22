import {
  Html, Body, Container, Head, Heading, Hr, Img,
  Preview, Text, Button, Section, Row, Column,
} from "@react-email/components";
import * as React from "react";

export interface SowFullyApprovedProps {
  adminName: string;
  sowTitle: string;
  approvedAt: string;
  sowUrl: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function SowFullyApproved({
  adminName = "Admin",
  sowTitle = "Untitled SOW",
  approvedAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  sowUrl = "#",
  headerColor = "#1E40AF",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd.",
}: SowFullyApprovedProps) {
  const stages = [
    { name: "Glimmora Commercial", icon: "💼" },
    { name: "Enterprise approval", icon: "🏁" },
  ];

  return (
    <Html>
      <Head />
      <Preview>🏆 SOW Fully Approved — "{sowTitle}" — Both approval gates complete!</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* ── Header ── */}
          <Section style={{ ...header, background: "linear-gradient(135deg, #0D1B2A 0%, #1E40AF 100%)" }}>
            <Row>
              <Column style={{ padding: "32px 40px 0" }}>
                {logoUrl
                  ? <Img src={logoUrl} width="140" height="36" alt="GlimmoraTeam" />
                  : <Text style={brandName}>GlimmoraTeam</Text>
                }
                <Text style={brandTagline}>SOW Approval Pipeline</Text>
              </Column>
            </Row>
            <Row>
              <Column style={{ padding: "0 40px" }}>
                <div style={approvedBadge}>
                  <Text style={approvedBadgeText}>🏆 FULLY APPROVED</Text>
                </div>
              </Column>
            </Row>
            <Section style={headerArc} />
          </Section>

          {/* ── Hero ── */}
          <Section style={heroSection}>
            <Row>
              <Column align="center">
                <div style={iconCircle}>
                  <Text style={iconText}>🎊</Text>
                </div>
                <Heading style={h1}>SOW Approved!</Heading>
                <Text style={heroSubtitle}>Both approval gates have been completed successfully.</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Content ── */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {adminName},</Text>
            <Text style={paragraph}>
              Excellent news! <strong style={{ color: "#0D1B2A" }}>"{sowTitle}"</strong> has cleared
              both approval gates and is now fully approved. Your project is ready for the next
              phase: <strong style={{ color: "#0D1B2A" }}>team formation and task decomposition</strong>.
            </Text>

            {/* Approval date card */}
            <Section style={dateCard}>
              <Row>
                <Column style={dateIconCol}>
                  <Text style={dateIcon}>📅</Text>
                </Column>
                <Column>
                  <Text style={dateLabel}>Approved On</Text>
                  <Text style={dateValue}>{approvedAt}</Text>
                </Column>
              </Row>
            </Section>

            {/* Stages completed */}
            <Text style={stagesTitle}>Completed Approval Stages</Text>
            <Section style={stagesContainer}>
              {stages.map((stage, i) => (
                <Row key={i} style={stageRow}>
                  <Column style={stageIconCol}>
                    <Text style={stageEmoji}>{stage.icon}</Text>
                  </Column>
                  <Column style={stageNameCol}>
                    <Text style={stageName_}>{stage.name}</Text>
                  </Column>
                  <Column style={stageStatusCol}>
                    <div style={stageCheck}>
                      <Text style={stageCheckText}>✓</Text>
                    </div>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* What's next */}
            <Section style={nextCard}>
              <Row>
                <Column style={{ padding: "14px 20px" }}>
                  <Text style={nextTitle}>🚀 What happens now?</Text>
                  <Text style={nextText}>
                    Head to your dashboard to begin project decomposition, assign contributor tasks,
                    and form your delivery team using Glimmora&apos;s AI-powered matching engine.
                  </Text>
                </Column>
              </Row>
            </Section>

            <Row style={{ margin: "24px 0 16px" }}>
              <Column align="center">
                <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
                  View Approved SOW →
                </Button>
              </Column>
            </Row>
          </Section>

          {/* ── Footer ── */}
          <Section style={footer}>
            <Hr style={footerHr} />
            <Row>
              <Column style={{ padding: "20px 40px" }}>
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
const brandTagline: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 16px", letterSpacing: "0.04em", textTransform: "uppercase" };
const approvedBadge: React.CSSProperties = { display: "inline-block", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", padding: "5px 12px", margin: "0 0 32px" };
const approvedBadgeText: React.CSSProperties = { color: "#BFDBFE", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", margin: 0 };
const headerArc: React.CSSProperties = { height: "28px", background: "#ffffff", borderRadius: "50% 50% 0 0 / 100% 100% 0 0", margin: "-1px 0 0" };
const heroSection: React.CSSProperties = { padding: "8px 40px 20px", textAlign: "center" };
const iconCircle: React.CSSProperties = { display: "inline-block", width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#EFF6FF", border: "3px solid #93C5FD", textAlign: "center", lineHeight: "72px", margin: "0 auto 16px" };
const iconText: React.CSSProperties = { fontSize: "32px", margin: 0, lineHeight: "72px", display: "block" };
const h1: React.CSSProperties = { fontSize: "26px", fontWeight: 800, color: "#0D1B2A", margin: "0 0 8px", letterSpacing: "-0.5px" };
const heroSubtitle: React.CSSProperties = { fontSize: "15px", color: "#6b7280", margin: 0 };
const contentSection: React.CSSProperties = { padding: "4px 40px 36px" };
const greeting: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.7", color: "#374151", margin: "0 0 20px" };
const dateCard: React.CSSProperties = { backgroundColor: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: "10px", padding: "14px 20px", margin: "0 0 24px" };
const dateIconCol: React.CSSProperties = { width: "44px", verticalAlign: "middle" };
const dateIcon: React.CSSProperties = { fontSize: "24px", margin: 0 };
const dateLabel: React.CSSProperties = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1E40AF", margin: "0 0 2px" };
const dateValue: React.CSSProperties = { fontSize: "17px", fontWeight: 800, color: "#0D1B2A", margin: 0 };
const stagesTitle: React.CSSProperties = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151", margin: "0 0 10px" };
const stagesContainer: React.CSSProperties = { backgroundColor: "#F9F7F5", border: "1px solid #EDE8E3", borderRadius: "10px", padding: "4px 16px", margin: "0 0 20px" };
const stageRow: React.CSSProperties = { padding: "10px 0", borderBottom: "1px solid #EDE8E3" };
const stageIconCol: React.CSSProperties = { width: "36px", verticalAlign: "middle" };
const stageEmoji: React.CSSProperties = { fontSize: "16px", margin: 0 };
const stageNameCol: React.CSSProperties = { verticalAlign: "middle" };
const stageName_: React.CSSProperties = { fontSize: "13px", fontWeight: 600, color: "#0D1B2A", margin: 0 };
const stageStatusCol: React.CSSProperties = { width: "36px", verticalAlign: "middle", textAlign: "right" };
const stageCheck: React.CSSProperties = { display: "inline-block", width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#059669", textAlign: "center", lineHeight: "22px" };
const stageCheckText: React.CSSProperties = { color: "#ffffff", fontSize: "12px", fontWeight: 700, margin: 0, lineHeight: "22px" };
const nextCard: React.CSSProperties = { backgroundColor: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: "10px", margin: "0 0 8px" };
const nextTitle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#0369A1", margin: "0 0 6px" };
const nextText: React.CSSProperties = { fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.6" };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", borderRadius: "10px", padding: "14px 32px", cursor: "pointer" };
const footer: React.CSSProperties = { backgroundColor: "#F9F7F5" };
const footerHr: React.CSSProperties = { border: "none", borderTop: "1px solid #EDE8E3", margin: 0 };
const footerBrand: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", margin: "0 0 4px" };
const footerTextStyle: React.CSSProperties = { fontSize: "11px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
