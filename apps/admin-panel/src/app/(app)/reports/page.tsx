'use client'

import { useRouter } from 'next/navigation'
import { PageHeader, Button } from '@glimmora/ui'
import { Activity, TrendingUp, CheckCircle, DollarSign, Scale, Plus } from 'lucide-react'
import { ReportTypeCard } from '@/components/reports'

const REPORT_TYPES = [
  {
    type: 'platform_overview',
    title: 'Platform Health',
    description: 'Active users, project health, system performance',
    icon: Activity,
  },
  {
    type: 'user_activity',
    title: 'User Growth',
    description: 'Registration trends, retention, type distribution',
    icon: TrendingUp,
  },
  {
    type: 'project_delivery',
    title: 'Delivery Performance',
    description: 'Completion rates, timelines, quality metrics',
    icon: CheckCircle,
  },
  {
    type: 'financial',
    title: 'Payment Flow',
    description: 'Revenue, payouts, disputes, fee analysis',
    icon: DollarSign,
  },
  {
    type: 'skill_growth',
    title: 'Dispute Analytics',
    description: 'Dispute types, resolution times, outcomes',
    icon: Scale,
  },
]

export default function ReportsPage() {
  const router = useRouter()

  function handleGenerate(type: string) {
    router.push(`/reports/builder?type=${type}`)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Reports & Analytics"
        actions={
          <Button onClick={() => router.push('/reports/builder')}>
            <Plus className="h-4 w-4 mr-1.5" />
            Custom Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TYPES.map((report) => (
          <ReportTypeCard
            key={report.type}
            type={report.type}
            title={report.title}
            description={report.description}
            icon={report.icon}
            onGenerate={handleGenerate}
          />
        ))}
      </div>
    </div>
  )
}
