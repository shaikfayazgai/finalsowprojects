import { authHandlers } from './auth'
import { onboardingHandlers } from './onboarding'
import { sowHandlers } from './sow'
import { blueprintHandlers } from './blueprint'
import { dashboardHandlers } from './dashboard'
import { projectHandlers } from './projects'
import { evidenceHandlers } from './evidence'
import { paymentHandlers } from './payments'

export const handlers = [
  ...authHandlers,
  ...onboardingHandlers,
  ...sowHandlers,
  ...blueprintHandlers,
  ...dashboardHandlers,
  ...projectHandlers,
  ...evidenceHandlers,
  ...paymentHandlers,
]
