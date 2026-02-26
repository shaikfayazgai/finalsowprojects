import { authHandlers } from './auth'
import { applicationHandlers } from './application'
import { onboardingHandlers } from './onboarding'

export const handlers = [
  ...authHandlers,
  ...applicationHandlers,
  ...onboardingHandlers,
]
