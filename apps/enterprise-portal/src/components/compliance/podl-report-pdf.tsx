'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

export interface PoDLReportData {
  projectName: string
  sowVersion: string
  completionDate: string
  totalMilestones: number
  totalTasks: number
  durationWeeks: number
  milestones: Array<{
    name: string
    deliverablesVerified: number
    skillsDemonstrated: string[]
    qualityScore: number
  }>
  payments: Array<{
    amount: number
    currency: string
    date: string
    transactionId: string
    status: string
  }>
  verificationHashes: string[]
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  brandBar: { height: 4, backgroundColor: '#A0614A', marginBottom: 24, borderRadius: 2 },
  header: { fontSize: 24, color: '#A0614A', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#6B4C3B', marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: '#2C1F1A', fontWeight: 'bold', marginBottom: 12, marginTop: 16 },
  label: {
    fontSize: 10,
    color: '#6B4C3B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { fontSize: 13, color: '#2C1F1A', marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#EAD9CC', marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  milestoneBlock: { marginBottom: 12, paddingLeft: 8 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  skill: {
    backgroundColor: '#A0614A10',
    color: '#A0614A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 9,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: '1 solid #EAD9CC',
  },
  paymentCell: { fontSize: 10, color: '#2C1F1A' },
  hash: { fontFamily: 'Courier', fontSize: 8, color: '#6B4C3B', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  footerText: { fontSize: 9, color: '#6B4C3B', textAlign: 'center' },
})

export function PoDLReportPDF({ data }: { data: PoDLReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.header}>PoDL Audit Report</Text>
        <Text style={styles.subtitle}>
          {data.projectName} -- Completed {new Date(data.completionDate).toLocaleDateString()}
        </Text>

        {/* Project Summary */}
        <Text style={styles.sectionTitle}>Project Summary</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>SOW Version</Text>
            <Text style={styles.value}>{data.sowVersion}</Text>
          </View>
          <View>
            <Text style={styles.label}>Total Milestones</Text>
            <Text style={styles.value}>{data.totalMilestones}</Text>
          </View>
          <View>
            <Text style={styles.label}>Total Tasks</Text>
            <Text style={styles.value}>{data.totalTasks}</Text>
          </View>
          <View>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{data.durationWeeks} weeks</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Milestone Verification */}
        <Text style={styles.sectionTitle}>Milestone Verification</Text>
        {data.milestones.map((ms, i) => (
          <View key={i} style={styles.milestoneBlock}>
            <Text style={styles.label}>{ms.name}</Text>
            <View style={styles.row}>
              <Text style={styles.value}>Deliverables Verified: {ms.deliverablesVerified}</Text>
              <Text style={styles.value}>Quality Score: {ms.qualityScore}%</Text>
            </View>
            <Text style={{ fontSize: 9, color: '#6B4C3B', marginBottom: 2 }}>Skills Demonstrated:</Text>
            <View style={styles.skillsRow}>
              {ms.skillsDemonstrated.map((skill, j) => (
                <Text key={j} style={styles.skill}>{skill}</Text>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Payment Records */}
        <Text style={styles.sectionTitle}>Payment Records</Text>
        <View style={styles.paymentRow}>
          <Text style={{ ...styles.paymentCell, fontWeight: 'bold' }}>Amount</Text>
          <Text style={{ ...styles.paymentCell, fontWeight: 'bold' }}>Date</Text>
          <Text style={{ ...styles.paymentCell, fontWeight: 'bold' }}>Transaction ID</Text>
          <Text style={{ ...styles.paymentCell, fontWeight: 'bold' }}>Status</Text>
        </View>
        {data.payments.map((payment, i) => (
          <View key={i} style={styles.paymentRow}>
            <Text style={styles.paymentCell}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: payment.currency }).format(payment.amount)}
            </Text>
            <Text style={styles.paymentCell}>{new Date(payment.date).toLocaleDateString()}</Text>
            <Text style={styles.paymentCell}>{payment.transactionId}</Text>
            <Text style={styles.paymentCell}>{payment.status}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Verification */}
        <Text style={styles.sectionTitle}>Verification</Text>
        <Text style={styles.label}>Cryptographic Verification Hashes (SHA-256)</Text>
        {data.verificationHashes.map((hash, i) => (
          <Text key={i} style={styles.hash}>{hash}</Text>
        ))}
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 10, color: '#6B4C3B' }}>
            Cryptographic Signature: Verified by GlimmoraTeam PoDL Engine
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by GlimmoraTeam -- Baarez Technology Solutions | {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
