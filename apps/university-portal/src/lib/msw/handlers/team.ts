import { http, HttpResponse } from 'msw'
import { createMockTeamMembers } from '../factories/team'

const teamMembers = createMockTeamMembers()

export const teamHandlers = [
  http.get('/api/team', () => {
    return HttpResponse.json({ data: teamMembers })
  }),
]
