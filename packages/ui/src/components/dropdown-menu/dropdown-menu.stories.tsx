import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Button } from '../button/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './dropdown-menu'

const meta: Meta = { title: 'Design System/DropdownMenu', parameters: { layout: 'centered' } }
export default meta

export const Basic: StoryObj = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">Open Menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>View Task</DropdownMenuItem>
        <DropdownMenuItem>Edit Details</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Download Evidence</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const WithCheckboxes: StoryObj = {
  render: function Render() {
    const [showStatus, setShowStatus] = useState(true)
    const [showProgress, setShowProgress] = useState(false)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">View Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
            Status
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showProgress} onCheckedChange={setShowProgress}>
            Progress
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

export const WithRadioGroup: StoryObj = {
  render: function Render() {
    const [sort, setSort] = useState('date')
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Sort By</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

export const WithSubMenu: StoryObj = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary">More Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>View</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Share With</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Mentor</DropdownMenuItem>
            <DropdownMenuItem>Team Lead</DropdownMenuItem>
            <DropdownMenuItem>Reviewer</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
