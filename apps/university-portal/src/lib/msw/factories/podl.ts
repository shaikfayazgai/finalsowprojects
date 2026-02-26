import type { PoDLCredential } from '@glimmora/types'

export function createMockCredentials(): PoDLCredential[] {
  return [
    {
      id: 'podl-001',
      contributorId: 'student-001',
      taskId: 'task-010',
      projectId: 'proj-001',
      issuedAt: '2026-01-15T10:00:00Z',
      title: 'Frontend Dashboard Implementation',
      description:
        'Delivered a fully responsive dashboard with real-time data visualization, accessibility compliance, and cross-browser compatibility.',
      skillsDemonstrated: ['React', 'TypeScript', 'D3.js', 'Accessibility'],
      evidenceHash: '0xab3f7c2d1e9a8b4f5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
      verifiedByMentorId: 'mentor-001',
      organizationName: 'TechCorp Solutions',
      isRevoked: false,
    },
    {
      id: 'podl-002',
      contributorId: 'student-001',
      taskId: 'task-011',
      projectId: 'proj-002',
      issuedAt: '2026-02-01T14:30:00Z',
      title: 'API Integration Testing Suite',
      description:
        'Created comprehensive integration test suite covering 95% of API endpoints with automated CI/CD pipeline integration.',
      skillsDemonstrated: ['Testing', 'TypeScript', 'Jest', 'CI/CD'],
      evidenceHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      verifiedByMentorId: 'mentor-002',
      organizationName: 'DataFlow Inc.',
      isRevoked: false,
    },
    {
      id: 'podl-003',
      contributorId: 'student-001',
      taskId: 'task-012',
      projectId: 'proj-001',
      issuedAt: '2026-02-10T09:15:00Z',
      title: 'Mobile Navigation Redesign',
      description:
        'Redesigned the mobile navigation system improving usability scores by 40% based on user testing feedback.',
      skillsDemonstrated: ['UI/UX Design', 'CSS', 'Accessibility', 'User Testing'],
      evidenceHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9',
      verifiedByMentorId: 'mentor-001',
      organizationName: 'TechCorp Solutions',
      isRevoked: false,
    },
    {
      id: 'podl-004',
      contributorId: 'student-001',
      taskId: 'task-013',
      projectId: 'proj-003',
      issuedAt: '2026-02-20T16:45:00Z',
      title: 'Technical Documentation Portal',
      description:
        'Authored complete API documentation with interactive examples, authentication guides, and error handling references.',
      skillsDemonstrated: ['Technical Writing', 'Markdown', 'API Documentation'],
      evidenceHash: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5',
      verifiedByMentorId: 'mentor-003',
      organizationName: 'OpenAPI Collective',
      isRevoked: false,
    },
    {
      id: 'podl-005',
      contributorId: 'student-001',
      taskId: 'task-014',
      projectId: 'proj-002',
      issuedAt: '2026-02-25T11:00:00Z',
      title: 'Performance Optimization Sprint',
      description:
        'Reduced bundle size by 35% and improved Lighthouse performance score from 67 to 94 through code splitting and lazy loading.',
      skillsDemonstrated: ['Performance', 'React', 'Webpack', 'Monitoring'],
      evidenceHash: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      verifiedByMentorId: 'mentor-002',
      organizationName: 'DataFlow Inc.',
      isRevoked: false,
    },
  ]
}
