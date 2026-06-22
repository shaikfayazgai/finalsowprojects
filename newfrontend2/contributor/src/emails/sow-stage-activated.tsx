import {
  Html, Body, Container, Head, Heading, Hr, Img,
  Preview, Text, Button, Section, Row, Column,
} from "@react-email/components";
import * as React from "react";

export interface SowStageActivatedProps {
  approverName: string;
  stageName: string;
  sowTitle: string;
  slaDeadline: string;
  sowUrl: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function SowStageActivated({
  approverName = "Approver",
  stageName = "Business Owner Review",
  sowTitle = "Untitled SOW",
  slaDeadline = "N/A",
  sowUrl = "#",
  headerColor = "#B45309",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd.",
}: SowStageActivatedProps) {
  return (
    <Html>
      <Head />
      <Preview>⚡ Action Required: {stageName} review for "{sowTitle}"</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* ── Header ── */}
          <Section style={{ ...header, background: `linear-gradient(135deg, #78350F 0%, ${headerColor} 100%)` }}>
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
              <Column style={{ padding: "0 40px 0" }}>
                <div style={urgencyBadge}>
                  <Text style={urgencyText}>⚡ ACTION REQUIRED</Text>
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
                  <Text style={iconText}>📋</Text>
                </div>
                <Heading style={h1}>Review Stage Activated</Heading>
                <Text style={heroSubtitle}>Your review is required to keep the pipeline on track.</Text>
              </Column>
            </Row>
          </Section>

          {/* ── Content ── */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {approverName},</Text>
            <Text style={paragraph}>
              The <strong style={{ color: "#0D1B2A" }}>{stageName}</strong> approval stage has been
              activated for the following statement of work:
            </Text>

            {/* SOW card */}
            <Section style={sowCard}>
              <Row>
                <Column style={{ padding: "16px 20px" }}>
                  <Text style={sowLabel}>Statement of Work</Text>
                  <Text style={sowTitle_}>{sowTitle}</Text>
                  <Text style={sowStage}>Stage: {stageName}</Text>
                </Column>
              </Row>
            </Section>

            {/* Deadline callout */}
            <Section style={deadlineCard}>
              <Row>
                <Column style={deadlineIconCol}>
                  <Text style={deadlineIcon}>⏰</Text>
                </Column>
                <Column>
                  <Text style={deadlineLabel}>Review Deadline</Text>
                  <Text style={deadlineValue}>{slaDeadline}</Text>
                </Column>
              </Row>
            </Section>

            <Text style={paragraph}>
              Please complete your review before the deadline above. Overdue reviews may trigger
              automatic escalation to the next level approver.
            </Text>

            <Row style={{ margin: "24px 0 16px" }}>
              <Column align="center">
                <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
                  Review SOW Now →
                </Button>
              </Column>
            </Row>

            <Text style={noteText}>
              If you have questions, reply to this email or contact your designated project coordinator.
            </Text>
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
const urgencyBadge: React.CSSProperties = { display: "inline-block", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px", padding: "5px 12px", margin: "0 0 32px" };
const urgencyText: React.CSSProperties = { color: "#FDE68A", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", margin: 0 };
const headerArc: React.CSSProperties = { height: "28px", background: "#ffffff", borderRadius: "50% 50% 0 0 / 100% 100% 0 0", margin: "-1px 0 0" };
const heroSection: React.CSSProperties = { padding: "8px 40px 20px", textAlign: "center" };
const iconCircle: React.CSSProperties = { display: "inline-block", width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#FEF3C7", border: "3px solid #FCD34D", textAlign: "center", lineHeight: "72px", margin: "0 auto 16px" };
const iconText: React.CSSProperties = { fontSize: "32px", margin: 0, lineHeight: "72px", display: "block" };
const h1: React.CSSProperties = { fontSize: "26px", fontWeight: 800, color: "#0D1B2A", margin: "0 0 8px", letterSpacing: "-0.5px" };
const heroSubtitle: React.CSSProperties = { fontSize: "15px", color: "#6b7280", margin: 0 };
const contentSection: React.CSSProperties = { padding: "4px 40px 36px" };
const greeting: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.7", color: "#374151", margin: "0 0 20px" };
const sowCard: React.CSSProperties = { backgroundColor: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "10px", margin: "0 0 16px" };
const sowLabel: React.CSSProperties = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#92400E", margin: "0 0 4px" };
const sowTitle_: React.CSSProperties = { fontSize: "16px", fontWeight: 700, color: "#0D1B2A", margin: "0 0 4px" };
const sowStage: React.CSSProperties = { fontSize: "12px", color: "#92400E", margin: 0, fontWeight: 600 };
const deadlineCard: React.CSSProperties = { backgroundColor: "#FFF7ED", border: "1px solid #FDBA74", borderRadius: "10px", padding: "14px 20px", margin: "0 0 20px" };
const deadlineIconCol: React.CSSProperties = { width: "44px", verticalAlign: "middle" };
const deadlineIcon: React.CSSProperties = { fontSize: "24px", margin: 0 };
const deadlineLabel: React.CSSProperties = { fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#92400E", margin: "0 0 2px" };
const deadlineValue: React.CSSProperties = { fontSize: "18px", fontWeight: 800, color: "#0D1B2A", margin: 0 };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", borderRadius: "10px", padding: "14px 32px", cursor: "pointer" };
const noteText: React.CSSProperties = { fontSize: "13px", color: "#9ca3af", margin: "8px 0 0", lineHeight: "1.5", textAlign: "center" };
const footer: React.CSSProperties = { backgroundColor: "#F9F7F5" };
const footerHr: React.CSSProperties = { border: "none", borderTop: "1px solid #EDE8E3", margin: 0 };
const footerBrand: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", margin: "0 0 4px" };
const footerTextStyle: React.CSSProperties = { fontSize: "11px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
