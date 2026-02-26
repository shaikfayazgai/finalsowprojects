import { http, HttpResponse } from 'msw'
import { createMockSkillGenome } from '../factories/skills'

export const skillsHandlers = [
  http.get('/api/skill-genome', () => {
    return HttpResponse.json({ data: createMockSkillGenome() })
  }),
]
