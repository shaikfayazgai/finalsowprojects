import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../button/button'
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from './popover'

const meta: Meta = { title: 'Design System/Popover', parameters: { layout: 'centered' } }
export default meta

export const Basic: StoryObj = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Edit Settings</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-3">
          <h4 className="font-display text-sm font-medium text-text-heading">Notification Preferences</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-body text-text-body">
              <input type="checkbox" className="rounded" defaultChecked />
              Email notifications
            </label>
            <label className="flex items-center gap-2 text-sm font-body text-text-body">
              <input type="checkbox" className="rounded" />
              WhatsApp notifications
            </label>
          </div>
          <div className="flex justify-end">
            <PopoverClose asChild>
              <Button variant="primary" size="sm">Save</Button>
            </PopoverClose>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
