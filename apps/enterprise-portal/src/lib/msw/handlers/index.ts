import { authHandlers } from './auth'
import { onboardingHandlers } from './onboarding'
import { sowHandlers } from './sow'
import { blueprintHandlers } from './blueprint'
import { dashboardHandlers } from './dashboard'

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...sowHandlers,
  ...blueprintHandlers,
  ...dashboardHandlers,
]
