import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-[var(--radius-card)] border border-[var(--color-border)]",
        "bg-[var(--color-surface-2)] px-3 py-1 text-sm font-[var(--font-sans)]",
        "text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
