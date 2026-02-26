import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('/api/auth/login', () =>
    HttpResponse.json({
      token: 'mock-mentor-token',
      role: 'mentor',
    })
  ),

  http.get('/api/auth/me', () =>
    HttpResponse.json({
      id: 'mentor-001',
      displayName: 'Alex Rivera',
      tier: 'silver',
      role: 'mentor',
    })
  ),

  http.post('/api/auth/logout', () =>
    HttpResponse.json({ success: true })
  ),
]
