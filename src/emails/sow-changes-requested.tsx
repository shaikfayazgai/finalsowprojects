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
  headerColor = "#92400E",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd.",
}: SowChangesRequestedProps) {
  return (
    <Html>
      <Head />
      <Preview>Changes requested on "{sowTitle}" — {stageName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: headerColor }}>
            {logoUrl ? (
              <Img src={logoUrl} width="140" height="36" alt="Glimmora" style={logo} />
            ) : (
              <Heading style={logoText}>Glimmora</Heading>
            )}
          </Section>

          <Section style={badgeSection}>
            <Row>
              <Column>
                <span style={{ ...badge, backgroundColor: "#fff7ed", color: "#c2410c", borderColor: "#fed7aa" }}>
                  Changes Requested
                </span>
              </Column>
            </Row>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>Review Feedback</Heading>

            <Text style={greeting}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              The reviewer for the <strong style={{ color: "#1a1a1a" }}>{stageName}</strong> stage
              has requested changes to the SOW{" "}
              <strong style={{ color: "#1a1a1a" }}>"{sowTitle}"</strong>.
            </Text>

            <Section style={{ ...callout, borderLeftColor: headerColor }}>
              <Text style={calloutLabel}>Reviewer feedback</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>

            <Text style={paragraph}>
              Please address the feedback above and resubmit the SOW for review. You can update
              the document directly from the SOW detail page.
            </Text>

            <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
              View &amp; Update SOW →
            </Button>
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
const reasonText: React.CSSProperties = { fontSize: "14px", lineHeight: "1.6", color: "#374151", margin: 0 };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "14px", fontWeight: 600, textDecoration: "none", borderRadius: "8px", padding: "12px 24px", margin: "0 0 20px", cursor: "pointer" };
const hr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "0 40px" };
const footerSection: React.CSSProperties = { padding: "20px 40px" };
const footerTextStyle: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
