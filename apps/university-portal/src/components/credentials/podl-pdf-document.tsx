'use client'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PoDLCredential } from '@glimmora/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 28, color: '#A0614A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B4C3B', marginBottom: 24 },
  section: { marginBottom: 16 },
  label: {
    fontSize: 10,
    color: '#6B4C3B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: { fontSize: 14, color: '#2C1F1A', marginBottom: 8 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  skill: {
    backgroundColor: '#A0614A10',
    color: '#A0614A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
  },
  divider: { height: 1, backgroundColor: '#EAD9CC', marginVertical: 16 },
  hash: { fontFamily: 'Courier', fontSize: 9, color: '#6B4C3B' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40 },
  footerText: { fontSize: 9, color: '#6B4C3B', textAlign: 'center' },
  brandBar: { height: 4, backgroundColor: '#A0614A', marginBottom: 24, borderRadius: 2 },
})

export function PoDLPDFDocument({ credential }: { credential: PoDLCredential }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandBar} />
        <Text style={styles.header}>Proof of Delivery</Text>
        <Text style={styles.subtitle}>GlimmoraTeam Verified Credential</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Delivery Title</Text>
          <Text style={styles.value}>{credential.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Organization</Text>
          <Text style={styles.value}>{credential.organizationName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.value}>{credential.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Skills Demonstrated</Text>
          <View style={styles.skillsRow}>
            {credential.skillsDemonstrated.map((skill, i) => (
              <Text key={i} style={styles.skill}>
                {skill}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Issued</Text>
          <Text style={styles.value}>
            {new Date(credential.issuedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.label}>Verification Hash</Text>
          <Text style={styles.hash}>{credential.evidenceHash}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This credential is issued by GlimmoraTeam and verified on-chain. Credential
            ID: {credential.id}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
