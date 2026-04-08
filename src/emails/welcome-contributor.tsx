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

export interface WelcomeContributorProps {
  firstName: string;
  loginUrl: string;
  onboardingUrl: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function WelcomeContributor({
  firstName = "Contributor",
  loginUrl = "#",
  onboardingUrl = "#",
  headerColor = "#0F766E",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd. · You received this because you registered as a contributor.",
}: WelcomeContributorProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Glimmora, {firstName}! Your account is ready.</Preview>
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
            <Heading style={h1}>Welcome, {firstName}! 🎉</Heading>

            <Text style={paragraph}>
              You have successfully registered as a contributor on{" "}
              <strong style={{ color: "#1a1a1a" }}>Glimmora</strong> — the AI-Governed Global
              Workforce Platform. We are excited to have you on board.
            </Text>

            <Text style={paragraph}>
              To get started, complete your profile and explore available tasks:
            </Text>

            <Button href={onboardingUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
              Complete Onboarding →
            </Button>

            <Section style={dividerRow}>
              <Text style={dividerText}>— or —</Text>
            </Section>

            <Text style={paragraph}>
              Already set up?{" "}
              <Link href={loginUrl} style={{ color: headerColor, fontWeight: 600 }}>
                Log in to your dashboard
              </Link>{" "}
              and start finding tasks that match your skills.
            </Text>

            <Hr style={internalHr} />

            <Text style={smallParagraph}>
              <strong>What happens next?</strong>
            </Text>
            <Text style={listItem}>→ Complete your profile for better task matching</Text>
            <Text style={listItem}>→ Browse and apply for tasks in your skill area</Text>
            <Text style={listItem}>→ Submit evidence and earn credentials</Text>
            <Text style={listItem}>→ Build your reputation and grow your earnings</Text>
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
const dividerRow: React.CSSProperties = { margin: "0 0 16px" };
const dividerText: React.CSSProperties = { fontSize: "13px", color: "#9ca3af", textAlign: "center", margin: 0 };
const internalHr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "20px 0" };
const smallParagraph: React.CSSProperties = { fontSize: "14px", lineHeight: "1.65", color: "#374151", margin: "0 0 8px" };
const listItem: React.CSSProperties = { fontSize: "14px", lineHeight: "1.5", color: "#374151", margin: "0 0 6px", paddingLeft: "4px" };
const hr: React.CSSProperties = { border: "none", borderTop: "1px solid #f0ece8", margin: "0 40px" };
const footerSection: React.CSSProperties = { padding: "20px 40px" };
const footerTextStyle: React.CSSProperties = { fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
