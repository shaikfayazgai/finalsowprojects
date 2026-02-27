'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@glimmora/ui'
import type { AdminUserType } from '@glimmora/types'
import { UserProfileTab } from './user-profile-tab'
import { UserActivityTab } from './user-activity-tab'
import { UserProjectsTab } from './user-projects-tab'
import { UserPaymentsTab } from './user-payments-tab'
import { UserSkillsTab } from './user-skills-tab'
import { UserAuditTab } from './user-audit-tab'

const TAB_CONFIG = [
  { value: 'profile', label: 'Profile' },
  { value: 'activity', label: 'Activity' },
  { value: 'projects', label: 'Projects' },
  { value: 'payments', label: 'Earnings/Payments' },
  { value: 'skills', label: 'Skill Genome' },
  { value: 'audit', label: 'Audit Log' },
] as const

type TabValue = (typeof TAB_CONFIG)[number]['value']

function getInitialTab(): TabValue {
  if (typeof window === 'undefined') return 'profile'
  const hash = window.location.hash.replace('#', '')
  const valid = TAB_CONFIG.some((t) => t.value === hash)
  return valid ? (hash as TabValue) : 'profile'
}

interface UserDetailTabsProps {
  userId: string
  userType: AdminUserType
}

export function UserDetailTabs({ userId, userType: _userType }: UserDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('profile')

  useEffect(() => {
    setActiveTab(getInitialTab())

    function onHashChange() {
      const hash = window.location.hash.replace('#', '')
      const valid = TAB_CONFIG.some((t) => t.value === hash)
      if (valid) setActiveTab(hash as TabValue)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function handleTabChange(value: string) {
    setActiveTab(value as TabValue)
    window.location.hash = value
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="w-full flex-wrap">
        {TAB_CONFIG.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="profile">
        <UserProfileTab userId={userId} />
      </TabsContent>

      <TabsContent value="activity">
        <UserActivityTab userId={userId} />
      </TabsContent>

      <TabsContent value="projects">
        <UserProjectsTab userId={userId} />
      </TabsContent>

      <TabsContent value="payments">
        <UserPaymentsTab userId={userId} />
      </TabsContent>

      <TabsContent value="skills">
        <UserSkillsTab userId={userId} />
      </TabsContent>

      <TabsContent value="audit">
        <UserAuditTab userId={userId} />
      </TabsContent>
    </Tabs>
  )
}
