import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badges deliberately avoid box-shadow neumorphism (they'd look noisy on cards).
 * Instead they use soft pastel fills + a hair-line border that matches the surface.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium " +
    "tracking-tight transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface-2)] text-[color:var(--ink-muted)]",
        success:
          "bg-[color:var(--success-soft)] text-[#065f46]",
        warning:
          "bg-[color:var(--warning-soft)] text-[#92400e]",
        danger:
          "bg-[color:var(--danger-soft)] text-[#9f1239]",
        info:
          "bg-[color:var(--info-soft)] text-[#1e40af]",
        outline:
          "bg-transparent text-[color:var(--ink-muted)] shadow-[var(--nu-inset-sm)]",
        black:
          "neu-accent-fill text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
