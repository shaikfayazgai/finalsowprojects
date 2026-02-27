import { authHandlers } from './auth'
import { dashboardHandlers } from './dashboard'
import { userHandlers } from './users'
import { projectHandlers } from './projects'

export const handlers = [
  ...authHandlers,
  ...dashboardHandlers,
  ...userHandlers,
  ...projectHandlers,
]
