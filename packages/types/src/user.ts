export type UserRole =
  | 'woman-contributor'
  | 'student-contributor'
  | 'alumni-contributor'
  | 'enterprise-requester'
  | 'mentor-reviewer'
  | 'university-governor'
  | 'community-support-lead'
  | 'platform-admin'
  | 'super-admin'

export type ContributorTier = 'emerging' | 'established' | 'expert'
export type MentorTier = 'bronze' | 'silver' | 'gold' | 'elite'

export interface User {
  id: string
  role: UserRole
  displayName: string
  email: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ContributorProfile extends User {
  role: Extract<UserRole, 'woman-contributor' | 'student-contributor' | 'alumni-contributor'>
  tier: ContributorTier
  anonymousId: string
  languagePreference: string
  onboardingCompleted: boolean
}

export interface MentorProfile extends User {
  role: Extract<UserRole, 'mentor-reviewer'>
  tier: MentorTier
  expertiseAreas: string[]
  capacityHoursPerWeek: number
  totalReviews: number
}

export interface EnterpriseUser extends User {
  role: Extract<UserRole, 'enterprise-requester'>
  organizationId: string
  organizationName: string
}
