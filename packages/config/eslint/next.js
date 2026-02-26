import baseConfig from './base.js'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  ...baseConfig,
  {
    plugins: { '@next/next': nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules },
  },
]
