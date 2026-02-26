'use client'
import { MSWProvider } from './MSWProvider'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MSWProvider>
      <QueryProvider>{children}</QueryProvider>
    </MSWProvider>
  )
}
