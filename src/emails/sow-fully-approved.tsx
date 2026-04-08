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
  return (
    <Html>
      <Head />
      <Preview>SOW Approved ✓ — "{sowTitle}"</Preview>
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
                <span style={{ ...badge, backgroundColor: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}>
                  Fully Approved
                </span>
              </Column>
            </Row>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>SOW Approved — All Stages Complete</Heading>

            <Text style={greeting}>Hi {adminName},</Text>

            <Text style={paragraph}>
              Excellent news! All five approval stages for{" "}
              <strong style={{ color: "#1a1a1a" }}>"{sowTitle}"</strong> have been successfully
              completed.
            </Text>

            <Section style={{ ...callout, borderLeftColor: headerColor }}>
              <Text style={calloutLabel}>Approved on</Text>
              <Text style={calloutValue}>{approvedAt}</Text>
            </Section>

            <Text style={paragraph}>
              The SOW is now fully approved and ready for the next phase:{" "}
              <strong style={{ color: "#1a1a1a" }}>project decomposition and team formation</strong>.
              You can begin assigning tasks and forming your delivery team from the dashboard.
            </Text>

            <Section style={stagesRow}>
              {["Business", "Commercial", "Legal", "Security", "Final"].map((stage) => (
                <Row key={stage}>
                  <Column style={stageCheck}>
                    <Text style={stageCheckText}>✓ {stage}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Button href={sowUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
              View Approved SOW →
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
const callout: React.CSSProperties = { borderLeft: "3px solid", padding: "12px 16px", borderRadius: "0 8px 8px 0", backgroundColor: "#f8faff", margin: "0 0 20px" };
const calloutLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", margin: "0 0 4px" };
const calloutValue: React.CSSProperties = { fontSize: "16px", fontWeight: 700, color: "#1a1a1a", margin: 0 };
const stagesRow: React.CSSProperties = { margin: "0 0 20px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" };
const stageCheck: React.CSSProperties = { padding: "3px 0" };
const stageCheckText: React.CSSProperties = { fontSize: "13px", color: "#15803d", fontWeight: 600, margin: 0 };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "14px", fontWeight: 600, textDecoration: "none", borderRadius: "8px", padding: "12px 24px", margin: "0 0 20px", cursor: "pointer" };
const hr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "0 40px" };
const footerSection: React.CSSProperties = { padding: "20px 40px" };
const footerTextStyle: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
