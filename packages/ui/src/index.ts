// IMPORTANT: No "use client" here — individual component files have it
// This allows server components to import layout primitives without forcing client mode

export { cn } from './lib/utils'

// DS-02: Typography
export { Heading, Body, Label, Caption } from './components/typography'

// DS-04: Button
export { Button, buttonVariants } from './components/button'

// DS-05: Input
export { TextInput, Textarea, PasswordInput } from './components/input'

// DS-06: Select
export { Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectValue, SelectLabel } from './components/select'

// DS-07: Checkbox
export { Checkbox } from './components/checkbox'

// DS-07: Radio
export { RadioGroup, RadioItem } from './components/radio'

// DS-08: Switch
export { Switch } from './components/switch'

// DS-09: Dialog
export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './components/dialog'

// DS-10: Tooltip
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/tooltip'

// DS-44: Bar Chart
export { BarChart } from './components/bar-chart'

// DS-45: Progress Ring
export { ProgressRing } from './components/progress-ring'

// DS-46: Sparkline
export { Sparkline } from './components/sparkline'

// DS-47: Activity Heatmap
export { ActivityHeatmap } from './components/activity-heatmap'
