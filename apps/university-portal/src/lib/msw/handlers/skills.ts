import { http, HttpResponse } from 'msw'
import { createMockSkillGenome } from '../factories/skills'

const skillGenome = createMockSkillGenome()

export const skillHandlers = [
  http.get('/api/skill-genome', () => {
    return HttpResponse.json({ data: skillGenome })
  }),
]
