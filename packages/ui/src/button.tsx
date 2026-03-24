"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary px-5 py-2.5 text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary px-5 py-2.5 text-secondary-foreground hover:bg-secondary/80",
        ghost: "px-4 py-2 text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, size, type = "button", variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ className, size, variant }))} type={type} {...props} />
  );
}
