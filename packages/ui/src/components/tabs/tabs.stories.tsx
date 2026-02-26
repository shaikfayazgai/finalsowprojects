import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

const meta: Meta = { title: 'Design System/Tabs', parameters: { layout: 'padded' } }
export default meta

export const ThreeTabs: StoryObj = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="rounded-card border border-border bg-bg-card p-4">
            <p className="text-sm font-body text-text-body">
              Project overview with milestone progress, team health, and delivery metrics.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="activity">
          <div className="rounded-card border border-border bg-bg-card p-4">
            <p className="text-sm font-body text-text-body">
              Recent activity feed showing task completions, evidence submissions, and reviews.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <div className="rounded-card border border-border bg-bg-card p-4">
            <p className="text-sm font-body text-text-body">
              Project configuration including notification preferences and access control.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  ),
}
