'use client'
import { forwardRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

const inputBaseClass = 'w-full border border-border bg-bg-card text-text-body rounded-inner px-3 py-2 text-sm font-body placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150'

interface InputWrapperProps {
  label?: string
  error?: string
  className?: string
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement>, InputWrapperProps {}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-text-heading font-body">{label}</label>}
      <input ref={ref} className={cn(inputBaseClass, error && 'border-status-urgent focus:ring-status-urgent', className)} {...props} />
      {error && <p className="text-xs text-status-urgent font-body">{error}</p>}
    </div>
  )
)
TextInput.displayName = 'TextInput'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, InputWrapperProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-text-heading font-body">{label}</label>}
      <textarea ref={ref} className={cn(inputBaseClass, 'min-h-[80px] resize-y', error && 'border-status-urgent', className)} {...props} />
      {error && <p className="text-xs text-status-urgent font-body">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

interface PasswordInputProps extends Omit<TextInputProps, 'type'> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [show, setShow] = useState(false)
    return (
      <div className="space-y-1">
        {label && <label className="text-sm font-medium text-text-heading font-body">{label}</label>}
        <div className="relative">
          <input ref={ref} type={show ? 'text' : 'password'} className={cn(inputBaseClass, 'pr-10', error && 'border-status-urgent', className)} {...props} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-caption hover:text-text-body">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-status-urgent font-body">{error}</p>}
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
