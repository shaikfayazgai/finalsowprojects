import type { Meta, StoryObj } from '@storybook/nextjs'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog'
import { Button } from '../button/button'

const meta: Meta = { title: 'Design System/Dialog', parameters: { layout: 'centered' } }
export default meta

export const BasicDialog: StoryObj = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-text-heading">Confirm Action</DialogTitle>
          <DialogDescription className="text-sm text-text-body">
            This will submit your evidence pack for mentor review. Once submitted, you cannot edit it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
          <Button variant="primary">Submit Evidence</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
