import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("badge", {
  variants: {
    variant: {
      default:
        "bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/30",
      gdelt: "badge-gdelt",
      gnews: "badge-gnews",
      youtube: "badge-youtube",
      positive:
        "bg-[var(--color-positive)]/15 text-[var(--color-positive)] border border-[var(--color-positive)]/30",
      negative:
        "bg-[var(--color-negative)]/15 text-[var(--color-negative)] border border-[var(--color-negative)]/30",
      neutral:
        "bg-[var(--color-text-faint)]/15 text-[var(--color-text-muted)] border border-[var(--color-border)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
