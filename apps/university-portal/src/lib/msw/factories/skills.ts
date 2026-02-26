export function createMockSkillGenome() {
  return [
    {
      name: 'React',
      tier: 'proficient' as const,
      evidenceCount: 8,
      progress: 72,
      verified: true,
    },
    {
      name: 'TypeScript',
      tier: 'proficient' as const,
      evidenceCount: 7,
      progress: 65,
      verified: true,
    },
    {
      name: 'CSS / Tailwind',
      tier: 'developing' as const,
      evidenceCount: 5,
      progress: 55,
      verified: true,
    },
    {
      name: 'Testing',
      tier: 'developing' as const,
      evidenceCount: 4,
      progress: 40,
      verified: false,
    },
    {
      name: 'Technical Writing',
      tier: 'emerging' as const,
      evidenceCount: 2,
      progress: 25,
      verified: false,
    },
    {
      name: 'Performance',
      tier: 'emerging' as const,
      evidenceCount: 1,
      progress: 15,
      verified: false,
    },
  ]
}
