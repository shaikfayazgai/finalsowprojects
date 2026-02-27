'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Button, Heading, Body, TextInput, PasswordInput } from '@glimmora/ui'
import type { EnterpriseUser } from '@glimmora/types'
import { useAuthStore } from '@/store/auth-store'

interface LoginResponse {
  user: EnterpriseUser
  token: string
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser, onboardingCompleted } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/enterprise/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Login failed')
      return res.json() as Promise<LoginResponse>
    },
    onSuccess: (data) => {
      setUser(data.user)
      if (!onboardingCompleted) {
        router.push('/onboarding/company')
      } else {
        router.push('/dashboard')
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    loginMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heading level="h1" className="text-3xl">GlimmoraTeam</Heading>
        <Body className="mt-2 text-text-caption">
          Enterprise Portal — Upload your SOW and let AI govern delivery.
        </Body>
      </div>

      <div className="p-6 bg-bg-card rounded-card shadow-card">
        <Heading level="h2" className="mb-4">Sign In</Heading>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-text-heading">
              Work Email
            </label>
            <TextInput
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-text-heading">
              Password
            </label>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {loginMutation.isError && (
            <p className="text-sm text-status-urgent">
              Invalid email or password. Please try again.
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loginMutation.isPending || !email || !password}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>

      <Body className="text-center text-sm text-text-caption">
        Contact your administrator for account access.
      </Body>
    </div>
  )
}
