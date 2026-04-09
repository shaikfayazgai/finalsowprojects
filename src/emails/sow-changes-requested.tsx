import {
  Html, Body, Container, Head, Heading, Hr, Img,
  Preview, Text, Button, Section, Row, Column,
} from "@react-email/components";
import * as React from "react";

export interface SowChangesRequestedProps {
  recipientName: string;
  stageName: string;
  reason: string;
  sowTitle: string;
  sowUrl: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function SowChangesRequested({
  recipientName = "User",
  stageName = "Legal / Compliance Review",
  reason = "Please review the flagged sections.",
  sowTitle = "Untitled SOW",
  sowUrl = "#",
  headerColor = "#DC2626",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd.",
}: SowChangesRequestedProps) {
  return (
    <Html>
      <Head />
      <Preview>⚠ Changes requested on "{sowTitle}" — {stageName}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* ── Header ── */}
          <Section style={{ ...header, background: "linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)" }}>
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
                <div style={alertBadge}>
                  <Text style={alertBadgeText}>⚠ CHANGES REQUESTED</Text>
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
                  <Text style={iconText}>✏️</Text>
                </div>
                <Heading style={h1}>Review Feedback</Heading>
                <Text style={heroSubtitle}>The reviewer has requested updates to your SOW.</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Content ── */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {recipientName},</Text>
            <Text style={paragraph}>
              The reviewer for the <strong style={{ color: "#0D1B2A" }}>{stageName}</strong> stage
              has requested changes to the SOW <strong style={{ color: "#0D1B2A" }}>"{sowTitle}"</strong>.
              Please review the feedback below and update your document accordingly.
            </Text>

            {/* Feedback card */}
            <Section style={feedbackCard}>
              <Row>
                <Column style={{ padding: "16px 20px" }}>
                  <Text style={feedbackHeader}>
                    <span style={{ marginRight: "8px" }}>💬</span> Reviewer Feedback
                  </Text>
                  <Text style={feedbackStage}>Stage: {stageName}</Text>
                  <Hr style={feedbackDivider} />
                  <Text style={feedbackText}>{reason}</Text>
                </Column>
              </Row>
            </Section>

            {/* What to do */}
            <Section style={stepsCard}>
              <Row>
                <Column style={{ padding: "14px 20px" }}>
                  <Text style={stepsTitle}>What to do next</Text>
                  {[
                    "Review the feedback carefully",
                    "Update the SOW document to address each point",
                    "Resubmit for review from the SOW detail page",
                  ].map((step, i) => (
                    <Row key={i}>
                      <Column style={stepNumCol}>
                        <div style={stepBullet}>
                          <Text style={stepBulletText}>{i + 1}</Text>
                        </div>
                      </Column>
                      <Column>
                        <Text style={stepItemText}>{step}</Text>
                      </Column>
                    </Row>
                  ))}
                </Column>
              </Row>
            </Section>

            <Row style={{ margin: "24px 0 16px" }}>
              <Column align="center">
                <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
                  View &amp; Update SOW →
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
const alertBadge: React.CSSProperties = { display: "inline-block", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", padding: "5px 12px", margin: "0 0 32px" };
const alertBadgeText: React.CSSProperties = { color: "#FEE2E2", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", margin: 0 };
const headerArc: React.CSSProperties = { height: "28px", background: "#ffffff", borderRadius: "50% 50% 0 0 / 100% 100% 0 0", margin: "-1px 0 0" };
const heroSection: React.CSSProperties = { padding: "8px 40px 20px", textAlign: "center" };
const iconCircle: React.CSSProperties = { display: "inline-block", width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#FEF2F2", border: "3px solid #FECACA", textAlign: "center", lineHeight: "72px", margin: "0 auto 16px" };
const iconText: React.CSSProperties = { fontSize: "32px", margin: 0, lineHeight: "72px", display: "block" };
const h1: React.CSSProperties = { fontSize: "26px", fontWeight: 800, color: "#0D1B2A", margin: "0 0 8px", letterSpacing: "-0.5px" };
const heroSubtitle: React.CSSProperties = { fontSize: "15px", color: "#6b7280", margin: 0 };
const contentSection: React.CSSProperties = { padding: "4px 40px 36px" };
const greeting: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.7", color: "#374151", margin: "0 0 20px" };
const feedbackCard: React.CSSProperties = { backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", margin: "0 0 16px" };
const feedbackHeader: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#991B1B", margin: "0 0 4px" };
const feedbackStage: React.CSSProperties = { fontSize: "11px", color: "#DC2626", fontWeight: 600, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.04em" };
const feedbackDivider: React.CSSProperties = { border: "none", borderTop: "1px solid #FECACA", margin: "0 0 12px" };
const feedbackText: React.CSSProperties = { fontSize: "14px", lineHeight: "1.7", color: "#374151", margin: 0, fontStyle: "italic" };
const stepsCard: React.CSSProperties = { backgroundColor: "#F9F7F5", border: "1px solid #EDE8E3", borderRadius: "10px", margin: "0 0 8px" };
const stepsTitle: React.CSSProperties = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151", margin: "0 0 12px" };
const stepNumCol: React.CSSProperties = { width: "32px", verticalAlign: "middle" };
const stepBullet: React.CSSProperties = { width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#DC2626", textAlign: "center", lineHeight: "22px", display: "inline-block" };
const stepBulletText: React.CSSProperties = { color: "#ffffff", fontSize: "11px", fontWeight: 700, margin: 0, lineHeight: "22px" };
const stepItemText: React.CSSProperties = { fontSize: "13px", color: "#374151", margin: "0 0 8px" };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", borderRadius: "10px", padding: "14px 32px", cursor: "pointer" };
const footer: React.CSSProperties = { backgroundColor: "#F9F7F5" };
const footerHr: React.CSSProperties = { border: "none", borderTop: "1px solid #EDE8E3", margin: 0 };
const footerBrand: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", margin: "0 0 4px" };
const footerTextStyle: React.CSSProperties = { fontSize: "11px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
