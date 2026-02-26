import type { SkillGenome } from '@glimmora/types'

export function createMockSkillGenome(): SkillGenome {
  return {
    contributorId: 'user-001',
    skills: [
      { id: 's1', name: 'React', category: 'Frontend', level: 'advanced', evidenceCount: 12, lastDemonstrated: '2026-02-20', growthPercentage: 85, verifiedByMentor: true },
      { id: 's2', name: 'TypeScript', category: 'Languages', level: 'advanced', evidenceCount: 10, lastDemonstrated: '2026-02-18', growthPercentage: 78, verifiedByMentor: true },
      { id: 's3', name: 'Tailwind CSS', category: 'Frontend', level: 'intermediate', evidenceCount: 7, lastDemonstrated: '2026-02-15', growthPercentage: 60, verifiedByMentor: true },
      { id: 's4', name: 'Node.js', category: 'Backend', level: 'intermediate', evidenceCount: 5, lastDemonstrated: '2026-02-10', growthPercentage: 45, verifiedByMentor: false },
      { id: 's5', name: 'SQL', category: 'Data', level: 'beginner', evidenceCount: 2, lastDemonstrated: '2026-01-28', growthPercentage: 20, verifiedByMentor: false },
      { id: 's6', name: 'Testing', category: 'Quality', level: 'intermediate', evidenceCount: 4, lastDemonstrated: '2026-02-12', growthPercentage: 55, verifiedByMentor: true },
    ],
    lastUpdated: '2026-02-20T10:00:00Z',
    totalPoDLs: 6,
    overallGrowthPercentage: 58,
  }
}
