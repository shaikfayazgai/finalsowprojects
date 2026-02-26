import type { PoDLCredential } from '@glimmora/types'
import { randomId } from './common'

export function createMockPoDLCredentials(): PoDLCredential[] {
  return [
    {
      id: randomId('podl'), contributorId: 'user-001', taskId: 'task-008', projectId: 'proj-001',
      issuedAt: '2026-02-18T10:00:00Z', title: 'Dark Mode Toggle Implementation',
      description: 'Successfully implemented dark mode toggle with theme persistence',
      skillsDemonstrated: ['CSS', 'React', 'Tailwind'], evidenceHash: '0x7a3f...b2c1',
      verifiedByMentorId: 'mentor-001', organizationName: 'TechCorp Inc.',
      isRevoked: false, exportUrl: '/mock/podl-001.pdf',
    },
    {
      id: randomId('podl'), contributorId: 'user-001', taskId: 'task-006', projectId: 'proj-001',
      issuedAt: '2026-02-14T10:00:00Z', title: 'Image Loading Pipeline Optimization',
      description: 'Optimized image loading with lazy loading and CDN integration',
      skillsDemonstrated: ['Performance', 'React', 'CDN'], evidenceHash: '0x9b2e...a4d3',
      verifiedByMentorId: 'mentor-002', organizationName: 'TechCorp Inc.',
      isRevoked: false,
    },
    {
      id: randomId('podl'), contributorId: 'user-001', taskId: 'task-003', projectId: 'proj-002',
      issuedAt: '2026-01-25T10:00:00Z', title: 'Responsive Navigation Component',
      description: 'Built accessible mobile navigation with keyboard support',
      skillsDemonstrated: ['React', 'Accessibility', 'CSS'], evidenceHash: '0x4c1d...e7f8',
      verifiedByMentorId: 'mentor-001', organizationName: 'DesignHub Ltd.',
      isRevoked: false, exportUrl: '/mock/podl-003.pdf',
    },
  ]
}
