'use client'
import { Avatar as RadixAvatar } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
  variants: {
    size: {
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    },
  },
  defaultVariants: { size: 'md' },
})

// --- Anonymous mode SVG shapes ---
function hashSeed(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 360
  }
  return hash
}

const anonymousColors = [
  'var(--color-brand-primary)',
  'var(--color-brand-sand)',
  'var(--color-brand-forest)',
  'var(--color-brand-teal)',
  'var(--color-brand-gold)',
  'var(--color-status-success)',
]

function AnonymousShape({ seed }: { seed: string }) {
  const hash = hashSeed(seed)
  const shapeIndex = hash % 6
  const colorIndex = (hash + 3) % anonymousColors.length
  const fill = anonymousColors[colorIndex]

  const shapes: Record<number, React.ReactNode> = {
    0: ( // circle-pattern
      <>
        <circle cx="20" cy="20" r="12" fill={fill} opacity="0.3" />
        <circle cx="20" cy="20" r="7" fill={fill} opacity="0.6" />
        <circle cx="20" cy="20" r="3" fill={fill} />
      </>
    ),
    1: ( // diamond
      <>
        <rect x="12" y="12" width="16" height="16" rx="2" fill={fill} opacity="0.3" transform="rotate(45 20 20)" />
        <rect x="15" y="15" width="10" height="10" rx="1" fill={fill} transform="rotate(45 20 20)" />
      </>
    ),
    2: ( // hexagon
      <>
        <polygon points="20,6 32,13 32,27 20,34 8,27 8,13" fill={fill} opacity="0.3" />
        <polygon points="20,11 27,15 27,25 20,29 13,25 13,15" fill={fill} />
      </>
    ),
    3: ( // triangle-pair
      <>
        <polygon points="20,8 32,28 8,28" fill={fill} opacity="0.4" />
        <polygon points="20,32 12,18 28,18" fill={fill} opacity="0.7" />
      </>
    ),
    4: ( // cross
      <>
        <rect x="16" y="8" width="8" height="24" rx="2" fill={fill} opacity="0.4" />
        <rect x="8" y="16" width="24" height="8" rx="2" fill={fill} />
      </>
    ),
    5: ( // waves
      <>
        <ellipse cx="20" cy="14" rx="12" ry="4" fill={fill} opacity="0.3" />
        <ellipse cx="20" cy="20" rx="10" ry="4" fill={fill} opacity="0.5" />
        <ellipse cx="20" cy="26" rx="8" ry="4" fill={fill} />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
      <rect width="40" height="40" rx="20" fill="var(--color-bg-dashboard)" />
      {shapes[shapeIndex]}
    </svg>
  )
}

// --- Sub-components for direct Radix usage ---
export function AvatarImage({
  className,
  ...props
}: RadixAvatar.AvatarImageProps) {
  return (
    <RadixAvatar.Image
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  )
}

export function AvatarFallback({
  className,
  ...props
}: RadixAvatar.AvatarFallbackProps) {
  return (
    <RadixAvatar.Fallback
      className={cn(
        'flex h-full w-full items-center justify-center bg-brand-primary text-white font-body font-medium',
        className
      )}
      {...props}
    />
  )
}

// --- Main Avatar component with 3 modes ---
interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  name?: string
  anonymous?: boolean
  seed?: string
  className?: string
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function Avatar({
  src,
  alt,
  name,
  anonymous = false,
  seed = '',
  size,
  className,
}: AvatarProps) {
  if (anonymous) {
    return (
      <div className={cn(avatarVariants({ size }), className)}>
        <AnonymousShape seed={seed || 'default'} />
      </div>
    )
  }

  return (
    <RadixAvatar.Root className={cn(avatarVariants({ size }), className)}>
      {src && <AvatarImage src={src} alt={alt ?? name ?? 'Avatar'} />}
      <AvatarFallback delayMs={src ? 600 : 0}>
        {name ? getInitials(name) : '?'}
      </AvatarFallback>
    </RadixAvatar.Root>
  )
}
