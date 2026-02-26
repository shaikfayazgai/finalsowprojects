'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Body, Checkbox, Stepper } from '@glimmora/ui'
import { BookOpen, Shield, Users, Scale, Eye, Heart } from 'lucide-react'

const ONBOARDING_STEPS = [
  { label: 'Profile' },
  { label: 'Expertise' },
  { label: 'Capacity' },
  { label: 'Orientation' },
]

const CODE_OF_CONDUCT = [
  {
    icon: Shield,
    title: 'Blind Review Integrity',
    description:
      'All reviews are conducted without knowledge of the contributor\'s identity. You will never see names, profiles, or prior performance history during a review.',
  },
  {
    icon: Scale,
    title: 'Fair and Objective Assessment',
    description:
      'Evaluate evidence strictly against the task requirements and quality rubric. Personal biases, preferences, or assumptions must not influence decisions.',
  },
  {
    icon: Heart,
    title: 'Constructive Feedback',
    description:
      'When requesting rework, provide specific, actionable guidance. Your feedback is a learning opportunity for contributors -- frame it as such.',
  },
  {
    icon: Eye,
    title: 'Confidentiality',
    description:
      'All project details, evidence submissions, and contributor interactions are strictly confidential. Do not share or discuss outside the platform.',
  },
  {
    icon: Users,
    title: 'SLA Commitment',
    description:
      'Complete reviews within assigned SLA deadlines. If you cannot meet a deadline, flag it early so the APG can reassign. Reliability builds platform trust.',
  },
  {
    icon: BookOpen,
    title: 'Continuous Growth',
    description:
      'Participate in calibration exercises and stay current with platform guidelines. The review process evolves -- your engagement in that evolution matters.',
  },
]

export function OrientationStep() {
  const router = useRouter()
  const [agreedToCoC, setAgreedToCoC] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreedToCoC) return

    setIsLoading(true)
    try {
      await fetch('/api/mentor/onboarding/orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreedToCodeOfConduct: true }),
      })
      router.push('/queue')
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={3} />

      <div>
        <Heading level="h2">Platform Orientation</Heading>
        <Body className="text-text-secondary mt-1">
          Understand how mentoring works on GlimmoraTeam and agree to the Code of Conduct.
        </Body>
      </div>

      {/* Platform overview */}
      <div className="p-4 bg-bg-card rounded-card shadow-card space-y-3">
        <Heading level="h4">How Mentoring Works</Heading>
        <Body className="text-text-secondary text-sm leading-relaxed">
          As a mentor, you are a critical link in the GlimmoraTeam delivery chain. When contributors
          submit evidence for their assigned tasks, the Autonomous Project Governor (APG) routes
          submissions to qualified mentors based on expertise match and current capacity.
        </Body>
        <Body className="text-text-secondary text-sm leading-relaxed">
          You review evidence against the task requirements and provide one of three decisions:
          Approve (evidence meets standards), Rework Required (specific changes needed), or
          Reject (fundamental quality or compliance issues). Each decision includes structured
          feedback that helps contributors grow.
        </Body>
        <Body className="text-text-secondary text-sm leading-relaxed">
          All reviews are blind -- you will never know who submitted the evidence. This ensures
          fairness and eliminates bias. Your review quality is tracked through calibration
          scores, and top-performing mentors advance through the tier system.
        </Body>
      </div>

      {/* Code of Conduct */}
      <div className="space-y-4">
        <Heading level="h3">Mentor Code of Conduct</Heading>
        <div className="space-y-3">
          {CODE_OF_CONDUCT.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex gap-3 p-3 rounded-card border border-border">
                <div className="shrink-0 w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-brand-primary" />
                </div>
                <div>
                  <Body className="font-medium text-sm">{item.title}</Body>
                  <Body className="text-text-secondary text-xs mt-0.5">{item.description}</Body>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Agreement */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-start gap-3 p-4 rounded-card border border-border bg-bg-card cursor-pointer">
          <Checkbox
            checked={agreedToCoC}
            onCheckedChange={(checked) => setAgreedToCoC(checked === true)}
            className="mt-0.5"
          />
          <Body className="text-sm">
            I have read and agree to the Mentor Code of Conduct. I understand that violations
            may result in tier demotion or removal from the mentoring program.
          </Body>
        </label>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !agreedToCoC}
        >
          {isLoading ? 'Completing Setup...' : 'Complete Onboarding'}
        </Button>
      </form>
    </div>
  )
}
