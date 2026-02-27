'use client'

import { useAuthStore } from '@/store/auth-store'
import { Button, Caption } from '@glimmora/ui'

export function RoleSwitcherOverlay() {
  if (process.env.NODE_ENV !== 'development') return null

  const adminRole = useAuthStore((s) => s.adminRole)
  const setAdminRole = useAuthStore((s) => s.setAdminRole)

  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-lg border border-sand bg-white p-3 shadow-lg">
      <Caption className="mb-2 text-warm-brown">Dev: Admin Role</Caption>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={adminRole === 'standard_admin' ? 'primary' : 'secondary'}
          onClick={() => setAdminRole('standard_admin')}
        >
          Standard
        </Button>
        <Button
          size="sm"
          variant={adminRole === 'super_admin' ? 'primary' : 'secondary'}
          onClick={() => setAdminRole('super_admin')}
        >
          Super Admin
        </Button>
      </div>
    </div>
  )
}
