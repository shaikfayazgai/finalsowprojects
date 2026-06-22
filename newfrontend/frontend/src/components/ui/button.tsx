"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-body text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      // Variants use the live Azure design tokens (brand / on-brand / semantic
      // surfaces). The legacy brown/forest/gold palette is NOT defined in the
      // current @theme — it rendered solid buttons with no background (white
      // text on white = invisible). These map to tokens that actually exist.
      variant: {
        primary:
          "bg-brand text-on-brand shadow-md hover:bg-brand-hover hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        secondary:
          "bg-brand-secondary text-on-brand-secondary shadow-md hover:bg-brand-secondary-hover hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        outline:
          "border-[1.5px] border-stroke-subtle text-foreground bg-surface hover:bg-bg-subtle hover:border-brand",
        ghost:
          "text-foreground bg-transparent hover:bg-bg-subtle",
        gold:
          "bg-brand-tertiary text-on-brand-tertiary shadow-md hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        danger:
          "bg-error-solid text-white shadow-md hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        glass:
          "glass text-foreground hover:bg-white/70 hover:-translate-y-0.5",
        "gradient-primary":
          "bg-gradient-to-r from-brand to-brand-active text-on-brand shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        "gradient-cta":
          "bg-gradient-to-r from-brand to-brand-tertiary text-on-brand shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        "gradient-forest":
          "bg-gradient-to-r from-brand-secondary to-brand text-on-brand shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0",
        link:
          "text-brand underline-offset-4 hover:underline hover:text-brand-hover p-0 h-auto",
      },
      size: {
        sm: "h-8 px-4 text-xs rounded-lg",
        md: "h-10 px-6 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
