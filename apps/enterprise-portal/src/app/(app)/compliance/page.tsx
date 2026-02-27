'use client'
import Link from 'next/link'
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from '@glimmora/ui'

const reports = [
  {
    title: 'PoDL Audit Reports',
    description: 'Export Proof-of-Delivery audit reports for completed projects with milestone verification, payment records, and cryptographic hashes.',
    href: '/compliance/podl',
  },
  {
    title: 'ESG Compliance Reports',
    description: 'Export GRI-aligned ESG compliance reports covering workforce diversity, skills development, fair payment, and delivery quality.',
    href: '/compliance/esg',
  },
]

export default function CompliancePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Compliance & Reports"
        subtitle="Generate audit-ready reports for governance, compliance, and ESG tracking"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-caption">{report.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
