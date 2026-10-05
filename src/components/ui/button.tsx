import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-white text-zinc-950 hover:bg-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] border border-white/20 font-semibold",
        primaryDark:
          "bg-zinc-900 text-zinc-100 hover:bg-zinc-800 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        secondary:
          "bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800/80 hover:text-white border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        outline:
          "border border-white/[0.1] bg-transparent text-zinc-300 hover:bg-white/[0.05] hover:text-white",
        ghost:
          "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]",
        destructive:
          "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
        link:
          "text-zinc-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 text-xs gap-1.5",
        sm: "h-7 rounded-md px-2.5 text-[11px] gap-1",
        lg: "h-9 rounded-lg px-4 text-xs gap-2",
        icon: "h-7 w-7 rounded-md",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
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
