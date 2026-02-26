export interface SkillGenome {
  contributorId: string
  skills: SkillNode[]
  lastUpdated: string
  totalPoDLs: number
  overallGrowthPercentage: number
}

export interface SkillNode {
  id: string
  name: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  evidenceCount: number
  lastDemonstrated: string
  growthPercentage: number
  verifiedByMentor: boolean
}
