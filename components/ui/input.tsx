import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl px-4 py-2 text-sm",
          "neu-surface text-[color:var(--ink)]",
          "shadow-[var(--nu-inset-sm)]",
          "placeholder:text-[color:var(--ink-soft)]",
          "outline-none transition-shadow duration-200",
          "focus-visible:shadow-[var(--nu-inset-sm),0_0_0_4px_var(--accent-glow)]",
          "disabled:cursor-not-allowed disabled:opacity-55",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
