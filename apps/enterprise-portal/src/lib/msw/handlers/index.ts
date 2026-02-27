import { authHandlers } from './auth'
import { onboardingHandlers } from './onboarding'
import { sowHandlers } from './sow'

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...sowHandlers,
]
