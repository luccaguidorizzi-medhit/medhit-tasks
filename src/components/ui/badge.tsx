import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-white/10 bg-zinc-800/80 text-zinc-200 shadow-2xs",
        secondary:
          "border-transparent bg-zinc-900 text-zinc-400",
        outline:
          "border-white/[0.08] text-zinc-400",
        agent:
          "border-indigo-500/20 bg-indigo-500/10 text-indigo-300 font-semibold tracking-wider",
        urgent:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold",
        high:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        medium:
          "border-sky-500/30 bg-sky-500/10 text-sky-400",
        low:
          "border-zinc-700 bg-zinc-800/50 text-zinc-400",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
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

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
