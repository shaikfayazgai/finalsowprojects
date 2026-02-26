export type OnboardingStepId = 'profile' | 'devices' | 'skills' | 'activation'
export type OnboardingStatus = 'not_started' | 'in_progress' | 'complete'

export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  status: OnboardingStatus
}

export interface OnboardingProgress {
  currentStep: OnboardingStepId
  completedSteps: OnboardingStepId[]
  steps: OnboardingStep[]
}
