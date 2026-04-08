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
  Link,
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
  headerColor = "#A67763",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd. · You received this because you registered an enterprise organization.",
}: WelcomeEnterpriseProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Glimmora — {orgName} is ready</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={{ ...header, backgroundColor: headerColor }}>
            {logoUrl ? (
              <Img src={logoUrl} width="140" height="36" alt="Glimmora" style={logo} />
            ) : (
              <Heading style={logoText}>Glimmora</Heading>
            )}
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>Welcome, {firstName}!</Heading>

            <Text style={paragraph}>
              Your enterprise organization{" "}
              <strong style={{ color: "#1a1a1a" }}>{orgName}</strong> has been successfully
              registered on <strong style={{ color: "#1a1a1a" }}>Glimmora</strong>.
            </Text>

            <Text style={paragraph}>
              You can now upload SOWs, form delivery teams, and manage your entire project
              lifecycle from your admin console:
            </Text>

            <Button href={dashboardUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
              Go to Enterprise Dashboard →
            </Button>

            <Hr style={internalHr} />

            <Text style={smallParagraph}>
              <strong>Your admin console includes:</strong>
            </Text>
            <Text style={listItem}>→ SOW Upload &amp; AI-powered extraction</Text>
            <Text style={listItem}>→ 5-stage approval pipeline with SLA tracking</Text>
            <Text style={listItem}>→ Contributor team formation &amp; task decomposition</Text>
            <Text style={listItem}>→ Project monitoring, billing &amp; analytics</Text>

            <Hr style={internalHr} />

            <Text style={paragraph}>
              Need help getting started?{" "}
              <Link href="mailto:support@glimmora.com" style={{ color: headerColor, fontWeight: 600 }}>
                Contact our support team
              </Link>{" "}
              or reply to this email.
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

const body: React.CSSProperties = { backgroundColor: "#f4f0ed", fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" };
const container: React.CSSProperties = { margin: "40px auto", maxWidth: "600px", backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" };
const header: React.CSSProperties = { padding: "28px 40px" };
const logo: React.CSSProperties = { display: "block" };
const logoText: React.CSSProperties = { color: "#ffffff", fontSize: "22px", fontWeight: 700, margin: 0 };
const contentSection: React.CSSProperties = { padding: "32px 40px 32px" };
const h1: React.CSSProperties = { fontSize: "24px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 20px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.65", color: "#374151", margin: "0 0 16px" };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "14px", fontWeight: 600, textDecoration: "none", borderRadius: "8px", padding: "12px 24px", margin: "0 0 16px", cursor: "pointer" };
const internalHr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "20px 0" };
const smallParagraph: React.CSSProperties = { fontSize: "14px", lineHeight: "1.65", color: "#374151", margin: "0 0 8px" };
const listItem: React.CSSProperties = { fontSize: "14px", lineHeight: "1.5", color: "#374151", margin: "0 0 6px", paddingLeft: "4px" };
const hr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "0 40px" };
const footerSection: React.CSSProperties = { padding: "20px 40px" };
const footerTextStyle: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
