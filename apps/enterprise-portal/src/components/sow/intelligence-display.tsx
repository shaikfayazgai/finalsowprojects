'use client'
import { Heading, Body, Badge, Progress, Card, CardContent, CardHeader, CardTitle, Button } from '@glimmora/ui'
import type { SOWIntelligence } from '@glimmora/types'
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, History } from 'lucide-react'
import Link from 'next/link'

interface IntelligenceDisplayProps {
  data: SOWIntelligence
}

function confidenceColor(score: number): string {
  if (score >= 0.8) return 'text-brand-forest'
  if (score >= 0.6) return 'text-brand-gold'
  return 'text-status-urgent'
}

function confidenceLabel(score: number): string {
  if (score >= 0.8) return 'High Confidence'
  if (score >= 0.6) return 'Moderate Confidence'
  return 'Low Confidence'
}

function severityVariant(severity: 'mandatory' | 'preferred' | 'note'): 'atrisk' | 'normal' | 'done' {
  if (severity === 'mandatory') return 'atrisk'
  if (severity === 'preferred') return 'normal'
  return 'done'
}

function clauseTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    objective: 'Objective',
    deliverable: 'Deliverable',
    timeline: 'Timeline',
    budget: 'Budget',
    compliance: 'Compliance',
    general: 'General',
  }
  return labels[type] || type
}

export function IntelligenceDisplay({ data }: IntelligenceDisplayProps) {
  const { sowId } = data

  return (
    <div className="space-y-6">
      {/* Project Objective */}
      <Card>
        <CardHeader>
          <CardTitle>Project Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <Body>{data.projectObjective}</Body>
        </CardContent>
      </Card>

      {/* Confidence Score */}
      <Card>
        <CardHeader>
          <CardTitle>APG Confidence Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-display font-semibold ${confidenceColor(data.confidenceScore)}`}>
              {Math.round(data.confidenceScore * 100)}%
            </span>
            <Badge status={data.confidenceScore >= 0.8 ? 'done' : data.confidenceScore >= 0.6 ? 'normal' : 'atrisk'}>
              {confidenceLabel(data.confidenceScore)}
            </Badge>
          </div>
          <Progress value={data.confidenceScore * 100} />
        </CardContent>
      </Card>

      {/* Extracted Clauses */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Clauses ({data.clauses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.clauses.map((clause) => (
              <div
                key={clause.id}
                className="p-3 border border-border rounded-inner space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Badge status="normal">{clauseTypeLabel(clause.type)}</Badge>
                  <span className="text-xs text-text-caption">
                    {Math.round(clause.confidence * 100)}% confidence
                  </span>
                </div>
                <Body className="text-sm">{clause.text}</Body>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deliverables */}
      <Card>
        <CardHeader>
          <CardTitle>Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.deliverables.map((del, i) => (
              <li key={i} className="flex items-start gap-3">
                {del.included ? (
                  <CheckCircle className="h-5 w-5 text-brand-forest shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-text-caption shrink-0 mt-0.5" />
                )}
                <Body className={`text-sm ${del.included ? '' : 'text-text-caption line-through'}`}>
                  {del.text}
                </Body>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Timeline Estimates */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-medium text-text-heading">Milestone</th>
                  <th className="text-left py-2 font-medium text-text-heading">Target Date</th>
                </tr>
              </thead>
              <tbody>
                {data.timelineEstimates.map((est, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-text-body">{est.milestone}</td>
                    <td className="py-2 text-text-caption">{est.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Budget Range */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-display font-semibold text-text-heading">
              {data.budgetRange.currency} {data.budgetRange.min.toLocaleString()}
            </span>
            <span className="text-text-caption">to</span>
            <span className="text-2xl font-display font-semibold text-text-heading">
              {data.budgetRange.currency} {data.budgetRange.max.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Flags */}
      {data.complianceFlags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.complianceFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Badge status={severityVariant(flag.severity)}>
                    {flag.severity}
                  </Badge>
                  <Body className="text-sm">{flag.item}</Body>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Ambiguities */}
      {data.ambiguities.length > 0 && (
        <div className="p-4 bg-brand-gold/10 border border-brand-gold/30 rounded-card space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand-gold" />
            <Heading level="h3" className="text-base">
              Ambiguities Detected ({data.ambiguities.length})
            </Heading>
          </div>
          <ul className="space-y-2">
            {data.ambiguities.map((amb, i) => (
              <li key={i} className="pl-7">
                <Body className="text-sm">
                  <span className="font-medium">{amb.section}:</span> {amb.issue}
                </Body>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button asChild>
          <Link href={`/projects/new?sowId=${sowId}`}>
            Open Blueprint Editor
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/sow/${sowId}/versions`}>
            <History className="h-4 w-4 mr-2" />
            View Version History
          </Link>
        </Button>
      </div>
    </div>
  )
}
