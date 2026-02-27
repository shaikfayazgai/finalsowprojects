// This file is ONLY imported via dynamic import() inside event handlers.
// DO NOT add to barrel export or import at top level.
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PlatformReportData, ReportConfig } from '@glimmora/types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EAD9CC',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#2C1F1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B4C3B',
    marginBottom: 2,
  },
  headerDateRange: {
    fontSize: 9,
    color: '#A0614A',
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#2C1F1A',
    marginTop: 20,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    width: '30%',
    padding: 10,
    backgroundColor: '#FAF7F4',
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 8,
    color: '#6B4C3B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#2C1F1A',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F4',
    borderBottomWidth: 1,
    borderBottomColor: '#EAD9CC',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EAD9CC',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: '#FDFCFB',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#2C1F1A',
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6B4C3B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#EAD9CC',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: '#A0614A',
  },
})

const REPORT_TYPE_TITLES: Record<string, string> = {
  platform_overview: 'Platform Health Report',
  user_activity: 'User Growth Report',
  project_delivery: 'Delivery Performance Report',
  financial: 'Payment Flow Report',
  skill_growth: 'Dispute Analytics Report',
}

interface ReportPDFProps {
  data: PlatformReportData
  config: ReportConfig
}

export function ReportPDF({ data, config }: ReportPDFProps) {
  const metricEntries = Object.entries(data.metrics)
  const chartRows = data.chartData ?? []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GlimmoraTeam Report</Text>
          <Text style={styles.headerSubtitle}>
            {REPORT_TYPE_TITLES[config.type] ?? config.title}
          </Text>
          <Text style={styles.headerDateRange}>
            Period: {config.dateRange.from} to {config.dateRange.to}
          </Text>
        </View>

        {/* Metrics Summary */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          {metricEntries.map(([key, value]) => (
            <View key={key} style={styles.metricCard}>
              <Text style={styles.metricLabel}>
                {key.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.metricValue}>{String(value)}</Text>
            </View>
          ))}
        </View>

        {/* Data Table */}
        {chartRows.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Data Breakdown</Text>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              {Object.keys(chartRows[0]).map((key) => (
                <Text key={key} style={styles.tableCellHeader}>
                  {key.replace(/_/g, ' ')}
                </Text>
              ))}
            </View>
            {/* Table Rows */}
            {chartRows.map((row, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                {Object.values(row).map((val, ci) => (
                  <Text key={ci} style={styles.tableCell}>
                    {String(val)}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated: {new Date().toISOString()}
          </Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>
    </Document>
  )
}
