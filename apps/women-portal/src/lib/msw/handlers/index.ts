import { authHandlers } from './auth'
import { onboardingHandlers } from './onboarding'
import { canaryHandlers } from './canary'
import { taskHandlers } from './tasks'
import { evidenceHandlers } from './evidence'
import { apgHandlers } from './apg'
import { skillsHandlers } from './skills'
import { earningsHandlers } from './earnings'
import { podlHandlers } from './podl'
import { messageHandlers } from './messages'
import { profileHandlers } from './profile'

export const handlers = [
  ...canaryHandlers,
  ...authHandlers,
  ...onboardingHandlers,
  ...taskHandlers,
  ...evidenceHandlers,
  ...apgHandlers,
  ...skillsHandlers,
  ...earningsHandlers,
  ...podlHandlers,
  ...messageHandlers,
  ...profileHandlers,
]
