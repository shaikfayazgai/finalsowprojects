/**
 * Meridian — Avatar
 *
 * Identity primitive. Renders initials by default; opt-in image source
 * loads on top with graceful fallback. Five sizes match the operator-
 * mention contexts (chip → row → header → hero).
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const avatarVariants = cva(
  "inline-flex items-center justify-center font-body font-semibold uppercase ring-2 ring-surface select-none shrink-0",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[9px] rounded-md",
        sm: "h-7 w-7 text-[10px] rounded-md",
        md: "h-9 w-9 text-[11px] rounded-lg",
        lg: "h-11 w-11 text-body-sm rounded-xl",
        xl: "h-14 w-14 text-body-md rounded-2xl",
      },
      tone: {
        brand: "bg-brand-subtle text-brand-subtle-text",
        secondary: "bg-brand-secondary-subtle text-brand-secondary-subtle-text",
        tertiary: "bg-brand-tertiary-subtle text-brand-tertiary-subtle-text",
        neutral: "bg-bg-subtle text-text-secondary",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "brand",
    },
  },
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  initials: string;
  src?: string;
  alt?: string;
}

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, tone, initials, src, alt, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(avatarVariants({ size, tone }), "relative overflow-hidden", className)}
        {...props}
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? initials}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <span aria-hidden={!!src}>{initials}</span>
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export { avatarVariants };
