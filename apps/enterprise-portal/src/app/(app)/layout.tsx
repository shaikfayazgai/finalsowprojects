'use client'
import { AppShell, Sidebar, TopBar } from '@glimmora/ui'
import type { SidebarNavItem } from '@glimmora/ui'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Archive,
  FolderKanban,
  CheckCircle,
  FileCheck,
  Leaf,
  CreditCard,
  Settings,
  User,
} from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems: SidebarNavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" />, active: pathname === '/dashboard' },
    { label: 'Upload SOW', href: '/sow/upload', icon: <Upload className="h-5 w-5" />, active: pathname === '/sow/upload' },
    { label: 'SOW Archive', href: '/sow/archive', icon: <Archive className="h-5 w-5" />, active: pathname === '/sow/archive' },
    { label: 'Active Projects', href: '/projects', icon: <FolderKanban className="h-5 w-5" />, active: pathname === '/projects' },
    { label: 'Completed', href: '/projects/completed', icon: <CheckCircle className="h-5 w-5" />, active: pathname === '/projects/completed' },
    { label: 'PoDL Reports', href: '/compliance/podl', icon: <FileCheck className="h-5 w-5" />, active: pathname.startsWith('/compliance/podl') },
    { label: 'ESG Reports', href: '/compliance/esg', icon: <Leaf className="h-5 w-5" />, active: pathname.startsWith('/compliance/esg') },
    { label: 'Payments', href: '/payments', icon: <CreditCard className="h-5 w-5" />, active: pathname.startsWith('/payments') },
    { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" />, active: pathname.startsWith('/settings') },
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
              <User className="h-4 w-4 text-brand-primary" />
            </div>
            <span className="text-sm font-body text-text-body truncate">
              Priya Nair
            </span>
          </div>
        }
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          breadcrumb={
            <span className="text-sm font-body text-text-caption">
              Enterprise Portal
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
