'use client'
import { AppShell, Sidebar, TopBar } from '@glimmora/ui'
import type { SidebarNavItem } from '@glimmora/ui'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  Award,
  Users,
  Brain,
  Settings,
} from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems: SidebarNavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, active: pathname === '/dashboard' },
    { label: 'Discover Tasks', href: '/tasks', icon: <Search className="h-5 w-5" />, active: pathname.startsWith('/tasks') },
    { label: 'Credentials', href: '/credentials', icon: <Award className="h-5 w-5" />, active: pathname.startsWith('/credentials') },
    { label: 'Team', href: '/team', icon: <Users className="h-5 w-5" />, active: pathname === '/team' },
    { label: 'Skills', href: '/skills', icon: <Brain className="h-5 w-5" />, active: pathname === '/skills' },
    { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" />, active: pathname === '/settings' },
  ]

  return (
    <AppShell>
      <Sidebar
        navItems={navItems}
        logo={
          <span className="text-sm font-display font-semibold text-text-heading">
            University Portal
          </span>
        }
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          breadcrumb={
            <span className="text-sm font-body text-text-caption">
              University Portal
            </span>
          }
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AppShell>
  )
}
