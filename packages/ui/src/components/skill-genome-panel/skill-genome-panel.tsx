'use client'
import { Shield, Lock } from 'lucide-react'
import { Tag } from '../tag/tag'
import { Progress } from '../progress/progress'
import { cn } from '../../lib/utils'

type SkillTier = 'emerging' | 'developing' | 'proficient' | 'expert'

interface SkillEntry {
  name: string
  tier: SkillTier
  evidenceCount: number
  progress: number
  verified: boolean
}

interface SkillGenomePanelProps {
  skills: SkillEntry[]
  privacyLabel?: string
  className?: string
}

const tierOrder: Record<SkillTier, number> = {
  expert: 0,
  proficient: 1,
  developing: 2,
  emerging: 3,
}

const tierStyles: Record<SkillTier, string> = {
  emerging: 'bg-hover text-text-caption',
  developing: 'bg-brand-sand/20 text-brand-sand',
  proficient: 'bg-brand-primary/10 text-brand-primary',
  expert: 'bg-brand-forest/10 text-brand-forest',
}

const tierLabels: Record<SkillTier, string> = {
  emerging: 'Emerging',
  developing: 'Developing',
  proficient: 'Proficient',
  expert: 'Expert',
}

function sortSkills(skills: SkillEntry[]): SkillEntry[] {
  return [...skills].sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier]
    if (tierDiff !== 0) return tierDiff
    return b.evidenceCount - a.evidenceCount
  })
}

export function SkillGenomePanel({
  skills,
  privacyLabel = 'Your skills are private and never shared publicly',
  className,
}: SkillGenomePanelProps) {
  const sorted = sortSkills(skills)

  return (
    <div className={cn('bg-bg-card rounded-card shadow-card p-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-display text-lg font-semibold text-text-heading">
          Skill Genome
        </h3>
        <Lock className="h-4 w-4 text-text-caption" />
      </div>

      {/* Privacy notice */}
      <div className="flex items-center gap-1.5 mb-4">
        <Lock className="h-3 w-3 shrink-0 text-text-disabled" />
        <p className="text-xs font-body text-text-caption">{privacyLabel}</p>
      </div>

      {/* Skill rows */}
      <div className="space-y-4">
        {sorted.map((skill) => (
          <div key={skill.name} className="space-y-1.5">
            <div className="flex items-center gap-2">
              {/* Skill name */}
              <span className="text-sm font-body font-medium text-text-body">
                {skill.name}
              </span>

              {/* Tier badge */}
              <span
                className={cn(
                  'inline-flex items-center rounded-badge px-2 py-0.5 text-[10px] font-body font-medium uppercase tracking-wider',
                  tierStyles[skill.tier]
                )}
              >
                {tierLabels[skill.tier]}
              </span>

              {/* Verified indicator */}
              {skill.verified && (
                <Shield className="h-3.5 w-3.5 text-status-success" aria-label="Mentor verified" />
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Progress bar toward next tier */}
              <div className="flex-1">
                <Progress value={skill.progress} className="h-1" />
              </div>

              {/* Evidence count */}
              <span className="shrink-0 text-xs text-text-caption">
                {skill.evidenceCount} {skill.evidenceCount === 1 ? 'delivery' : 'deliveries'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <p className="text-sm font-body text-text-caption text-center py-8">
          Complete deliveries to build your skill genome.
        </p>
      )}
    </div>
  )
}
