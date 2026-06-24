import {
  Html, Body, Container, Head, Heading, Hr, Img,
  Preview, Text, Button, Section, Row, Column,
} from "@react-email/components";
import * as React from "react";

export interface ReviewerInvitationProps {
  reviewerName: string;
  projectTitle: string;
  roleName: string;
  inviterName: string;
  inviterOrg: string;
  acceptUrl: string;
  deadline: string;
  headerColor?: string;
  logoUrl?: string;
  footerText?: string;
}

export default function ReviewerInvitation({
  reviewerName = "Reviewer",
  projectTitle = "Project Name",
  roleName = "Reviewer",
  inviterName = "Admin",
  inviterOrg = "Organization",
  acceptUrl = "#",
  deadline = "7 days",
  headerColor = "#5B3A29",
  logoUrl,
  footerText = "© Glimmora Technologies Pvt. Ltd. · You received this because you were invited as a reviewer.",
}: ReviewerInvitationProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to review "{projectTitle}" on GlimmoraTeam</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
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

          {/* Hero */}
          <Section style={heroSection}>
            <Row>
              <Column align="center">
                <div style={iconCircle}>
                  <Text style={iconText}>📋</Text>
                </div>
                <Heading style={h1}>You&apos;re Invited to Review</Heading>
                <Text style={heroSubtitle}>
                  {inviterName} from {inviterOrg} has invited you to join as a reviewer.
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Text style={paragraph}>
              Hi <strong style={{ color: "#0D1B2A" }}>{reviewerName}</strong>,
            </Text>
            <Text style={paragraph}>
              You have been invited to serve as a <strong style={{ color: "#0D1B2A" }}>{roleName}</strong> on
              the project <strong style={{ color: "#0D1B2A" }}>&quot;{projectTitle}&quot;</strong>. Your expertise
              is valued, and your review will be critical in ensuring project quality and governance compliance.
            </Text>

            {/* Invitation details card */}
            <Section style={detailsCard}>
              <Row style={detailRow}>
                <Column style={detailLabelCol}>
                  <Text style={detailLabel}>Project</Text>
                </Column>
                <Column>
                  <Text style={detailValue}>{projectTitle}</Text>
                </Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabelCol}>
                  <Text style={detailLabel}>Role</Text>
                </Column>
                <Column>
                  <Text style={detailValue}>{roleName}</Text>
                </Column>
              </Row>
              <Row style={detailRow}>
                <Column style={detailLabelCol}>
                  <Text style={detailLabel}>Invited By</Text>
                </Column>
                <Column>
                  <Text style={detailValue}>{inviterName} ({inviterOrg})</Text>
                </Column>
              </Row>
              <Row style={{ ...detailRow, borderBottom: "none" }}>
                <Column style={detailLabelCol}>
                  <Text style={detailLabel}>Respond By</Text>
                </Column>
                <Column>
                  <Text style={{ ...detailValue, color: "#92400E", fontWeight: 700 }}>{deadline}</Text>
                </Column>
              </Row>
            </Section>

            {/* What you'll do */}
            <Text style={{ ...paragraph, fontWeight: 700, fontSize: "14px", color: "#0D1B2A", marginBottom: "12px" }}>
              What you&apos;ll be doing:
            </Text>
            <Section style={checklistCard}>
              {[
                "Review deliverables and evidence packs submitted by contributors",
                "Provide quality assessments and approval decisions",
                "Flag rework requests when standards are not met",
                "Participate in milestone sign-off and acceptance workflows",
              ].map((item, i) => (
                <Row key={i} style={checklistRow}>
                  <Column style={checkIconCol}>
                    <Text style={checkIcon}>✓</Text>
                  </Column>
                  <Column>
                    <Text style={checkText}>{item}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* CTA */}
            <Row style={{ margin: "28px 0 16px" }}>
              <Column align="center">
                <Button href={acceptUrl} style={{ ...ctaButton, backgroundColor: headerColor }}>
                  Accept Invitation →
                </Button>
              </Column>
            </Row>

            <Text style={{ ...paragraph, fontSize: "13px", color: "#9ca3af", textAlign: "center" as const }}>
              This invitation expires in <strong style={{ color: "#374151" }}>{deadline}</strong>. If you did not expect
              this invitation, you can safely ignore this email.
            </Text>

            {/* Support */}
            <Section style={supportCard}>
              <Row>
                <Column>
                  <Text style={supportTitle}>Questions about this invitation?</Text>
                  <Text style={supportText}>
                    Contact {inviterName} directly or reach out to us at{" "}
                    <a href="mailto:grcsupport@glimmora.ai" style={{ color: headerColor, fontWeight: 600, textDecoration: "none" }}>
                      grcsupport@glimmora.ai
                    </a>
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerHr} />
            <Row>
              <Column align="center" style={{ padding: "24px 40px 8px" }}>
                <Text style={followText}>Follow us</Text>
                <table cellPadding="0" cellSpacing="0" style={{ margin: "0 auto" }}>
                  <tr>
                    {[
                      { href: "https://twitter.com/glimmorateam",      bg: "#000000", label: "X",  title: "Twitter / X" },
                      { href: "https://linkedin.com/company/glimmora", bg: "#0A66C2", label: "in", title: "LinkedIn" },
                      { href: "https://instagram.com/glimmorateam",    bg: "#E1306C", label: "IG",  title: "Instagram" },
                      { href: "https://youtube.com/@glimmorateam",     bg: "#FF0000", label: "YT",  title: "YouTube" },
                    ].map((s) => (
                      <td key={s.title} style={{ padding: "0 6px" }}>
                        <a href={s.href} title={s.title} style={{ textDecoration: "none" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: s.bg, textAlign: "center" as const, lineHeight: "36px", display: "inline-block" }}>
                            <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 700, fontFamily: "sans-serif" }}>{s.label}</span>
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
const header: React.CSSProperties = { position: "relative" as const };
const brandName: React.CSSProperties = { color: "#ffffff", fontSize: "20px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.3px" };
const brandTagline: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: "11px", margin: "0 0 32px", letterSpacing: "0.04em", textTransform: "uppercase" as const };
const headerArc: React.CSSProperties = { height: "28px", background: "#ffffff", borderRadius: "50% 50% 0 0 / 100% 100% 0 0", margin: "-1px 0 0" };
const heroSection: React.CSSProperties = { padding: "8px 40px 24px", textAlign: "center" as const };
const iconCircle: React.CSSProperties = { display: "inline-block", width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "#F5EFE9", border: "3px solid #DCC9B5", textAlign: "center" as const, lineHeight: "72px", margin: "0 auto 16px" };
const iconText: React.CSSProperties = { fontSize: "32px", margin: 0, lineHeight: "72px", display: "block" };
const h1: React.CSSProperties = { fontSize: "26px", fontWeight: 800, color: "#0D1B2A", margin: "0 0 8px", letterSpacing: "-0.5px" };
const heroSubtitle: React.CSSProperties = { fontSize: "15px", color: "#6b7280", margin: 0 };
const contentSection: React.CSSProperties = { padding: "4px 40px 36px" };
const paragraph: React.CSSProperties = { fontSize: "15px", lineHeight: "1.7", color: "#374151", margin: "0 0 16px" };
const detailsCard: React.CSSProperties = { backgroundColor: "#F9F7F5", borderRadius: "12px", padding: "4px 20px", margin: "0 0 24px" };
const detailRow: React.CSSProperties = { padding: "12px 0", borderBottom: "1px solid #EDE8E3" };
const detailLabelCol: React.CSSProperties = { width: "100px", verticalAlign: "top" as const };
const detailLabel: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: "0.05em", margin: 0 };
const detailValue: React.CSSProperties = { fontSize: "14px", fontWeight: 500, color: "#0D1B2A", margin: 0 };
const checklistCard: React.CSSProperties = { backgroundColor: "#F0FAFA", borderRadius: "12px", padding: "4px 16px", margin: "0 0 8px", border: "1px solid #D1F0EE" };
const checklistRow: React.CSSProperties = { padding: "10px 0", borderBottom: "1px solid #D1F0EE" };
const checkIconCol: React.CSSProperties = { width: "28px", verticalAlign: "top" as const, paddingTop: "2px" };
const checkIcon: React.CSSProperties = { fontSize: "14px", fontWeight: 800, color: "#0F766E", margin: 0 };
const checkText: React.CSSProperties = { fontSize: "13px", color: "#374151", margin: 0, lineHeight: "1.5" };
const ctaButton: React.CSSProperties = { display: "inline-block", color: "#ffffff", fontSize: "15px", fontWeight: 700, textDecoration: "none", borderRadius: "10px", padding: "14px 32px", cursor: "pointer" };
const supportCard: React.CSSProperties = { backgroundColor: "#FFF8F3", border: "1px solid #F0DDD0", borderRadius: "10px", padding: "16px 20px", margin: "8px 0 0" };
const supportTitle: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#0D1B2A", margin: "0 0 4px" };
const supportText: React.CSSProperties = { fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: "1.5" };
const footer: React.CSSProperties = { backgroundColor: "#F9F7F5" };
const followText: React.CSSProperties = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 12px", textAlign: "center" as const };
const footerHr: React.CSSProperties = { border: "none", borderTop: "1px solid #EDE8E3", margin: 0 };
const footerBrand: React.CSSProperties = { fontSize: "13px", fontWeight: 700, color: "#374151", margin: "0 0 4px" };
const footerTextStyle: React.CSSProperties = { fontSize: "11px", color: "#9ca3af", margin: 0, lineHeight: "1.5" };
