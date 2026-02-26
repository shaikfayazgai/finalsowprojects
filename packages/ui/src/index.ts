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

// DS-11: Dropdown Menu
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './components/dropdown-menu'

// DS-12: Context Menu
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from './components/context-menu'

// DS-13: Popover
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose } from './components/popover'

// DS-14: Tabs
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/tabs'

// DS-15: Accordion
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/accordion'

// DS-16: Slider
export { Slider } from './components/slider'

// DS-17: Avatar
export { Avatar, AvatarImage, AvatarFallback } from './components/avatar'

// DS-18: Badge
export { Badge, badgeVariants } from './components/badge'

// DS-19: Tag
export { Tag, tagVariants } from './components/tag'

// DS-20: Toast
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction, toastVariants } from './components/toast'

// DS-21: Progress
export { Progress } from './components/progress'

// DS-22: Spinner
export { Spinner } from './components/spinner'

// DS-23: Skeleton
export { Skeleton } from './components/skeleton'

// DS-24: File Upload
export { FileUpload } from './components/file-upload'

// DS-25: Date Picker
export { DatePicker } from './components/date-picker'

// DS-26: Stepper
export { Stepper } from './components/stepper'

// DS-27: Combobox
export { Combobox, ComboboxInput, ComboboxList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxSeparator } from './components/combobox'

// DS-44: Bar Chart
export { BarChart } from './components/bar-chart'

// DS-45: Progress Ring
export { ProgressRing } from './components/progress-ring'

// DS-46: Sparkline
export { Sparkline } from './components/sparkline'

// DS-47: Activity Heatmap
export { ActivityHeatmap } from './components/activity-heatmap'
