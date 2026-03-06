import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-[var(--color-bg)] hover:opacity-90 active:scale-[0.98] shadow-sm",
        outline:
          "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
        ghost:
          "bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
        destructive:
          "bg-[var(--color-negative)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-7 px-3 text-xs rounded-[calc(var(--radius-card)/2)]",
        default: "h-9 px-4 py-2 text-sm rounded-[var(--radius-card)]",
        lg: "h-11 px-6 text-base rounded-[var(--radius-card)]",
        icon: "h-9 w-9 rounded-[var(--radius-card)]",
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
