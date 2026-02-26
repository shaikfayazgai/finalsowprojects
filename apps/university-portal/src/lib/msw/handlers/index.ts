import { authHandlers } from './auth'
import { taskHandlers } from './tasks'
import { evidenceHandlers } from './evidence'
import { credentialHandlers } from './credentials'
import { teamHandlers } from './team'
import { skillHandlers } from './skills'
import { apgHandlers } from './apg'

export const handlers = [
  ...authHandlers,
  ...taskHandlers,
  ...evidenceHandlers,
  ...credentialHandlers,
  ...teamHandlers,
  ...skillHandlers,
  ...apgHandlers,
]
