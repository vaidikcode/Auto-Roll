import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl px-4 py-3 text-sm",
          "neu-surface text-[color:var(--ink)]",
          "shadow-[var(--nu-inset-sm)]",
          "placeholder:text-[color:var(--ink-soft)]",
          "outline-none transition-shadow duration-200 resize-none",
          "focus-visible:shadow-[var(--nu-inset-sm),0_0_0_4px_var(--accent-glow)]",
          "disabled:cursor-not-allowed disabled:opacity-55",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
