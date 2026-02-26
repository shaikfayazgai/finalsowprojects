'use client'
import { useEffect, useState } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function init() {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const { worker } = await import('@/lib/msw/browser')
        await worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: { url: '/mockServiceWorker.js' },
        })
      }
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return null
  return <>{children}</>
}
