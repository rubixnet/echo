import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { LiquidContainer } from "@/components/LiquidGlassCard";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative isolate overflow-hidden",
  {
    variants: {
      variant: {
        default: "text-primary hover:opacity-90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        outline: "border border-border bg-transparent text-foreground hover:bg-foreground/5 hover:border-foreground/20",
        ghost: "text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 gap-2",
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
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const isLiquid = variant === "default" || !variant;

  if (isLiquid) {
    return (
      <LiquidContainer radius="9999px" className={cn(buttonVariants({ variant, size, className }))}>
        <Comp data-slot="button" className="w-full h-full flex items-center justify-center gap-2" {...props}>
          <Slottable>{children}</Slottable>
        </Comp>
      </LiquidContainer>
    );
  }

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props}>
      <Slottable>{children}</Slottable>
    </Comp>
  );
}

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { separator?: boolean }
>(({ className, separator = false, children, ...props }, ref) => {
  const childArray = React.Children.toArray(children);

  return (
    <LiquidContainer
      ref={ref}
      radius="9999px"
      className={cn("relative isolate inline-flex items-center overflow-hidden shadow-xl shadow-black/10 transition-all p-0.5", className)}
      {...props}
    >
      <div className="relative z-10 flex items-center">
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {separator && index < childArray.length - 1 && (
              <div className="w-[1px] h-5 bg-foreground/10 mx-0.5 rounded-full" />
            )}
          </React.Fragment>
        ))}
      </div>
    </LiquidContainer>
  );
});
ButtonGroup.displayName = "ButtonGroup";

export { Button, buttonVariants, ButtonGroup };