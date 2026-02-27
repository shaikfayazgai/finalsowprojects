'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ESGReportData } from '@glimmora/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  brandBar: { height: 4, backgroundColor: '#A0614A', marginBottom: 24, borderRadius: 2 },
  header: { fontSize: 24, color: '#A0614A', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#6B4C3B', marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: '#2C1F1A', fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
  griRef: { fontSize: 9, color: '#6B4C3B', marginBottom: 8 },
  label: {
    fontSize: 10,
    color: '#6B4C3B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { fontSize: 13, color: '#2C1F1A', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  metricBlock: { width: '48%' },
  divider: { height: 1, backgroundColor: '#EAD9CC', marginVertical: 16 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  skill: {
    backgroundColor: '#A0614A10',
    color: '#A0614A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 9,
  },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  footerText: { fontSize: 9, color: '#6B4C3B', textAlign: 'center' },
})

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function ESGReportPDF({ data }: { data: ESGReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.header}>ESG Compliance Report</Text>
        <Text style={styles.subtitle}>
          {data.organizationName} | {data.reportPeriod}
        </Text>

        {/* Workforce Diversity (GRI 405) */}
        <Text style={styles.sectionTitle}>Workforce Diversity</Text>
        <Text style={styles.griRef}>GRI 405: Diversity and Equal Opportunity</Text>
        <View style={styles.row}>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Women Contributor Hours</Text>
            <Text style={styles.value}>
              {data.womenContributorHours.toLocaleString()} ({formatPercent(data.womenWorkforcePercentage)})
            </Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Student Contributor Hours</Text>
            <Text style={styles.value}>
              {data.studentContributorHours.toLocaleString()} ({formatPercent(data.studentWorkforcePercentage)})
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Total Contributor Hours</Text>
            <Text style={styles.value}>{data.totalContributorHours.toLocaleString()}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Underrepresented Groups</Text>
            <Text style={styles.value}>{formatPercent(data.underrepresentedGroupPercentage)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Skills Development (GRI 404) */}
        <Text style={styles.sectionTitle}>Skills Development</Text>
        <Text style={styles.griRef}>GRI 404: Training and Education</Text>
        <View style={styles.row}>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>PoDL Credentials Issued</Text>
            <Text style={styles.value}>{data.podlCredentialsIssued}</Text>
          </View>
        </View>
        <Text style={styles.label}>Skills Developed</Text>
        <View style={styles.skillsRow}>
          {data.skillsDeveloped.map((skill, i) => (
            <Text key={i} style={styles.skill}>{skill}</Text>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Fair Payment */}
        <Text style={styles.sectionTitle}>Fair Payment</Text>
        <View style={styles.row}>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Total Payments Released</Text>
            <Text style={styles.value}>{formatCurrency(data.totalPaymentsReleased, data.currency)}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>On-Time Payment Rate</Text>
            <Text style={styles.value}>{formatPercent(data.onTimePaymentRate)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Delivery Quality */}
        <Text style={styles.sectionTitle}>Delivery Quality</Text>
        <View style={styles.row}>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>On-Time Delivery Rate</Text>
            <Text style={styles.value}>{formatPercent(data.onTimeDeliveryRate)}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Rework Rate</Text>
            <Text style={styles.value}>{formatPercent(data.reworkRate)}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.metricBlock}>
            <Text style={styles.label}>Mentor Review Coverage</Text>
            <Text style={styles.value}>{formatPercent(data.mentorReviewRate)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated {data.generatedDate} | Aligned with GRI Standards
          </Text>
          <Text style={styles.footerText}>
            GlimmoraTeam -- Baarez Technology Solutions
          </Text>
        </View>
      </Page>
    </Document>
  )
}
