import {
  Html, Body, Container, Head, Heading, Hr, Img,
  Preview, Text, Button, Section, Row, Column,
} from "@react-email/components";
import * as React from "react";

export interface SowStageApprovedProps {
  recipientName: string;
  stageName: string;
  approverName: string;
  sowTitle: string;
  sowUrl: string;
  nextStageName?: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function SowStageApproved({
  recipientName = "User",
  stageName = "Business Owner Review",
  approverName = "Approver",
  sowTitle = "Untitled SOW",
  sowUrl = "#",
  nextStageName,
  headerColor = "#059669",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd.",
}: SowStageApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>✓ {stageName} approved for "{sowTitle}"</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* ── Header ── */}
          <Section style={{ ...header, background: "linear-gradient(135deg, #064E3B 0%, #059669 100%)" }}>
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
                  <Text style={approvedBadgeText}>✓ STAGE APPROVED</Text>
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
                  <Text style={iconText}>✅</Text>
                </div>
                <Heading style={h1}>{stageName} Complete</Heading>
                <Text style={heroSubtitle}>The approval stage has been signed off successfully.</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Content ── */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={paragraph}>
              Great news! The <strong style={{ color: "#0D1B2A" }}>{stageName}</strong> stage for{" "}
              <strong style={{ color: "#0D1B2A" }}>"{sowTitle}"</strong> has been approved by{" "}
              <strong style={{ color: "#0D1B2A" }}>{approverName}</strong>.
            </Text>

            {/* Approval confirmation card */}
            <Section style={confirmCard}>
              <Row>
                <Column style={confirmIconCol}>
                  <Text style={confirmIcon}>🎯</Text>
                </Column>
                <Column>
                  <Text style={confirmLabel}>Approved Stage</Text>
                  <Text style={confirmValue}>{stageName}</Text>
                  <Text style={confirmSub}>Approved by {approverName}</Text>
                </Column>
              </Row>
            </Section>

            {/* Next stage */}
            {nextStageName ? (
              <Section style={nextStageCard}>
                <Row>
                  <Column style={nextStageIconCol}>
                    <Text style={nextStageIcon}>→</Text>
                  </Column>
                  <Column>
                    <Text style={nextStageLabel}>Up Next</Text>
                    <Text style={nextStageValue}>{nextStageName}</Text>
                  </Column>
                </Row>
              </Section>
            ) : (
              <Section style={allDoneCard}>
                <Row>
                  <Column align="center" style={{ padding: "12px 20px" }}>
                    <Text style={allDoneText}>🏆 All approval stages are now complete!</Text>
                  </Column>
                </Row>
              </Section>
            )}

            <Row style={{ margin: "24px 0 16px" }}>
              <Column align="center">
                <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
                  View SOW Status →
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
const body: React.CSSProperties = { backgroundColor: "#F0EDE9", fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif", margin: 0, padding: 0 };
const container: React.CSSProperties = { margin: "40px auto", maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.10)" };
const header: React.CSSProperties = { position: "relative" };
const brandName: React.CSSProperties = { color: "#ffffff", fontSize: "20px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.3px" };
const brandTagline: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 16px", letterSpacing: "0.04em", textTransform: "uppercase" };
const approvedBadge: React.CSSProperties = { display: "inline-block", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", padding: "5px 12px", margin: "0 0 32px" };
const approvedBadgeText: React.CSSProperties = { color: "#D1FAE5", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", margin: 0 };
const headerArc: React.CSSProperties = { height: "28px", background: "#ffffff", borderRadius: "50% 50% 0 0 / 100% 100% 0 0", margin: "-1px 0 0" };
const heroSection: React.CSSProperties = { padding: "8px 40px 20px", textAlign: "center" };
const iconCircle: React.CSSProperties = { display: "inline-block", width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#ECFDF5", border: "3px solid #6EE7B7", textAlign: "center", lineHeight: "72px", margin: "0 auto 16px" };
const iconText: React.CSSProperties = { fontSize: "32px", margin: 0, lineHeight: "72px", display: "block" };
const h1: React.CSSProperties = { fontSize: "26px", fontWeight: 800, color: "#0D1B2A", margin: "0 0 8px", letterSpacing: "-0.5px" };
const heroSubtitle: React.CSSProperties = { fontSize: "15px", color: "#6b7280", margin: 0 };
const contentSection: React.CSSProperties = { padding: "4px 40px 36px" };
const greeting: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.7", color: "#374151", margin: "0 0 20px" };
const confirmCard: React.CSSProperties = { backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: "10px", padding: "14px 20px", margin: "0 0 16px" };
const confirmIconCol: React.CSSProperties = { width: "44px", verticalAlign: "middle" };
const confirmIcon: React.CSSProperties = { fontSize: "24px", margin: 0 };
const confirmLabel: React.CSSProperties = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#065F46", margin: "0 0 2px" };
const confirmValue: React.CSSProperties = { fontSize: "15px", fontWeight: 700, color: "#0D1B2A", margin: "0 0 2px" };
const confirmSub: React.CSSProperties = { fontSize: "12px", color: "#059669", margin: 0 };
const nextStageCard: React.CSSProperties = { backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "12px 20px", margin: "0 0 8px" };
const nextStageIconCol: React.CSSProperties = { width: "36px", verticalAlign: "middle" };
const nextStageIcon: React.CSSProperties = { fontSize: "20px", fontWeight: 700, color: "#059669", margin: 0 };
const nextStageLabel: React.CSSProperties = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#065F46", margin: "0 0 2px" };
const nextStageValue: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#0D1B2A", margin: 0 };
const allDoneCard: React.CSSProperties = { backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7", borderRadius: "10px", margin: "0 0 8px" };
const allDoneText: React.CSSProperties = { fontSize: "14px", fontWeight: 700, color: "#065F46", margin: 0 };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", borderRadius: "10px", padding: "14px 32px", cursor: "pointer" };
const footer: React.CSSProperties = { backgroundColor: "#F9F7F5" };
const footerHr: React.CSSProperties = { border: "none", borderTop: "1px solid #EDE8E3", margin: 0 };
const footerBrand: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", margin: "0 0 4px" };
const footerTextStyle: React.CSSProperties = { fontSize: "11px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
