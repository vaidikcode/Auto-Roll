"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Neumorphic button system.
 * - Default: accent-gradient fill, soft raised shadow, lifts on hover, presses on active.
 * - Secondary: surface-colored raised pill (neu).
 * - Outline: inset / pressed look for toggles & destructive confirms.
 * - Ghost / Link: flat, accent-colored.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold select-none " +
    "transition-all duration-200 ease-out " +
    "focus-visible:outline-none focus-visible:ring-0 " +
    "focus-visible:shadow-[0_0_0_4px_var(--accent-glow)] " +
    "disabled:pointer-events-none disabled:opacity-55 disabled:saturate-50",
  {
    variants: {
      variant: {
        default:
          "text-white neu-accent-fill " +
          "shadow-[6px_6px_14px_rgba(99,102,241,0.28),-6px_-6px_14px_rgba(255,255,255,0.9)] " +
          "hover:-translate-y-0.5 hover:shadow-[8px_8px_18px_rgba(99,102,241,0.32),-8px_-8px_18px_rgba(255,255,255,0.95)] " +
          "active:translate-y-0 active:shadow-[inset_4px_4px_9px_rgba(68,71,180,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.25)]",
        destructive:
          "text-white bg-[linear-gradient(135deg,#fb7185_0%,#e11d48_100%)] " +
          "shadow-[5px_5px_12px_rgba(225,29,72,0.22),-5px_-5px_12px_rgba(255,255,255,0.9)] " +
          "hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_4px_4px_9px_rgba(150,20,50,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.25)]",
        success:
          "text-white bg-[linear-gradient(135deg,#34d399_0%,#059669_100%)] " +
          "shadow-[5px_5px_12px_rgba(16,185,129,0.24),-5px_-5px_12px_rgba(255,255,255,0.9)] " +
          "hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "text-[color:var(--ink)] neu-surface " +
          "shadow-[var(--nu-raised-sm)] " +
          "hover:-translate-y-0.5 hover:shadow-[7px_7px_16px_var(--nu-dark),-7px_-7px_16px_var(--nu-light)] " +
          "active:translate-y-0 active:shadow-[var(--nu-inset-sm)]",
        outline:
          "text-[color:var(--ink)] neu-surface " +
          "shadow-[var(--nu-inset-sm)] " +
          "hover:text-[color:var(--accent-ink)]",
        ghost:
          "text-[color:var(--ink-muted)] bg-transparent " +
          "hover:text-[color:var(--ink)] hover:shadow-[var(--nu-raised-xs)]",
        link:
          "bg-transparent shadow-none text-[color:var(--accent-ink)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3.5 text-xs rounded-lg",
        lg: "h-12 px-8 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
