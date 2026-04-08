import {
  Html,
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Img,
  Preview,
  Text,
  Button,
  Section,
  Row,
  Column,
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
  headerColor = "#A67763",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd.",
}: SowStageActivatedProps) {
  return (
    <Html>
      <Head />
      <Preview>Action Required: {stageName} review for "{sowTitle}"</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={{ ...header, backgroundColor: headerColor }}>
            {logoUrl ? (
              <Img src={logoUrl} width="140" height="36" alt="Glimmora" style={logo} />
            ) : (
              <Heading style={logoText}>Glimmora</Heading>
            )}
          </Section>

          {/* Badge */}
          <Section style={badgeSection}>
            <Row>
              <Column>
                <span style={{ ...badge, backgroundColor: `${headerColor}18`, color: headerColor, borderColor: `${headerColor}40` }}>
                  Action Required
                </span>
              </Column>
            </Row>
          </Section>

          {/* Title */}
          <Section style={contentSection}>
            <Heading style={h1}>Review Stage Activated</Heading>

            <Text style={greeting}>Hi {approverName},</Text>

            <Text style={paragraph}>
              The <strong style={{ color: "#1a1a1a" }}>{stageName}</strong> approval stage for the SOW{" "}
              <strong style={{ color: "#1a1a1a" }}>"{sowTitle}"</strong> has been activated and is now
              awaiting your review.
            </Text>

            {/* Deadline callout */}
            <Section style={{ ...callout, borderLeftColor: headerColor }}>
              <Text style={calloutLabel}>Review deadline</Text>
              <Text style={calloutValue}>{slaDeadline}</Text>
            </Section>

            <Text style={paragraph}>
              Please complete your review by the deadline above to keep the approval pipeline on track.
              Overdue reviews may trigger automatic escalation.
            </Text>

            <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
              Review SOW →
            </Button>

            <Text style={paragraph}>
              If you have questions about the SOW content or the review process, reply to this email
              or reach out to your designated contact at Glimmora.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footerSection}>
            <Text style={footerTextStyle}>{footerText}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/* ── Styles ── */
const body: React.CSSProperties = { backgroundColor: "#f4f0ed", fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" };
const container: React.CSSProperties = { margin: "40px auto", maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" };
const header: React.CSSProperties = { padding: "28px 40px" };
const logo: React.CSSProperties = { display: "block" };
const logoText: React.CSSProperties = { color: "#ffffff", fontSize: "22px", fontWeight: 700, margin: 0 };
const badgeSection: React.CSSProperties = { padding: "20px 40px 0" };
const badge: React.CSSProperties = { display: "inline-block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "6px", border: "1px solid" };
const contentSection: React.CSSProperties = { padding: "16px 40px 32px" };
const h1: React.CSSProperties = { fontSize: "22px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 20px" };
const greeting: React.CSSProperties = { fontSize: "15px", color: "#374151", margin: "0 0 12px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.65", color: "#374151", margin: "0 0 16px" };
const callout: React.CSSProperties = { borderLeft: "3px solid", padding: "12px 16px", borderRadius: "0 8px 8px 0", backgroundColor: "#fafafa", margin: "0 0 20px" };
const calloutLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 4px" };
const calloutValue: React.CSSProperties = { fontSize: "16px", fontWeight: 700, color: "#1a1a1a", margin: 0 };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "14px", fontWeight: 600, textDecoration: "none", borderRadius: "8px", padding: "12px 24px", margin: "0 0 20px", cursor: "pointer" };
const hr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "0 40px" };
const footerSection: React.CSSProperties = { padding: "20px 40px" };
const footerTextStyle: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
