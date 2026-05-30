import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full text-sm font-bold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-2 active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 
          "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800",
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        outline:
          "border-2 border-neutral-200 bg-transparent text-neutral-900 hover:bg-neutral-100 hover:border-neutral-300",
        ghost:
          "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
        destructive:
          "bg-rose-50 text-rose-600 hover:bg-rose-100",
        link: 
          "text-neutral-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 gap-2",
        sm: "h-9 px-4 gap-1.5 text-xs",
        lg: "h-14 px-8 gap-2.5 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }