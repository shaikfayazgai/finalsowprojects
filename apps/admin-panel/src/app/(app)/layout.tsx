'use client'

import { AppShell, Sidebar, TopBar } from '@glimmora/ui'
import type { SidebarNavItem } from '@glimmora/ui'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Scale,
  FileText,
  BookOpen,
  Bot,
  ScrollText,
  Shield,
} from 'lucide-react'
import { RoleSwitcherOverlay } from '@/components/dev/role-switcher'
import { useAuthStore } from '@/store/auth-store'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const navItems: SidebarNavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, active: pathname === '/dashboard' },
    { label: 'Users', href: '/users', icon: <Users className="h-5 w-5" />, active: pathname.startsWith('/users') },
    { label: 'Projects', href: '/projects', icon: <FolderKanban className="h-5 w-5" />, active: pathname.startsWith('/projects') },
    { label: 'Disputes', href: '/disputes', icon: <Scale className="h-5 w-5" />, active: pathname.startsWith('/disputes') },
    { label: 'Reports', href: '/reports', icon: <FileText className="h-5 w-5" />, active: pathname.startsWith('/reports') },
    { label: 'Content', href: '/content/skills', icon: <BookOpen className="h-5 w-5" />, active: pathname.startsWith('/content') },
    { label: 'APG Config', href: '/apg-config', icon: <Bot className="h-5 w-5" />, active: pathname.startsWith('/apg-config') },
    { label: 'Audit Log', href: '/audit-log', icon: <ScrollText className="h-5 w-5" />, active: pathname.startsWith('/audit-log') },
  ]

  return (
    <AppShell>
      <Sidebar
        navItems={navItems}
        logo={
          <span className="text-sm font-display font-semibold text-text-heading">
            GlimmoraTeam
          </span>
        }
        bottomContent={
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-brand-primary" />
            </div>
            <span className="text-sm font-body text-text-body truncate">
              {user?.displayName ?? 'Admin'}
            </span>
          </div>
        }
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          breadcrumb={
            <span className="text-sm font-body text-text-caption">
              Admin Panel
            </span>
          }
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <RoleSwitcherOverlay />
    </AppShell>
  )
}
