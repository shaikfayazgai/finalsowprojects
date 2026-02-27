'use client'

import { Card, CardContent, Button } from '@glimmora/ui'
import type { LucideIcon } from 'lucide-react'

interface ReportTypeCardProps {
  type: string
  title: string
  description: string
  icon: LucideIcon
  onGenerate: (type: string) => void
}

export function ReportTypeCard({
  type,
  title,
  description,
  icon: Icon,
  onGenerate,
}: ReportTypeCardProps) {
  return (
    <Card className="hover:shadow-card transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-inner bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-display font-semibold text-text-heading">
              {title}
            </h3>
            <p className="mt-1 text-xs font-body text-text-caption line-clamp-2">
              {description}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={() => onGenerate(type)}>
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
