'use client'
import { Avatar } from '../avatar/avatar'
import { Tag } from '../tag/tag'
import { cn } from '../../lib/utils'

interface AnonymizedTeamCardProps {
  seed: string
  role: string
  skills: string[]
  className?: string
}

const MAX_VISIBLE_SKILLS = 4

export function AnonymizedTeamCard({
  seed,
  role,
  skills,
  className,
}: AnonymizedTeamCardProps) {
  const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS)
  const hiddenCount = skills.length - visibleSkills.length

  return (
    <div
      className={cn(
        'bg-bg-card rounded-card shadow-card p-4 flex flex-col items-center text-center',
        className
      )}
    >
      {/* Anonymous SVG avatar -- NO photo, NO initials, NO identity */}
      <Avatar anonymous seed={seed} size="lg" />

      {/* Role label */}
      <p className="text-sm font-body font-medium text-text-heading mt-3">
        {role}
      </p>

      {/* Skill tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {visibleSkills.map((skill) => (
            <Tag key={skill} variant="skill">
              {skill}
            </Tag>
          ))}
          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded-badge px-2 py-1 text-xs font-body text-text-caption bg-hover">
              +{hiddenCount} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
