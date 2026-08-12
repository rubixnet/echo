import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 relative isolate overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "text-primary shadow-xl border-none hover:opacity-90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-foreground/5 hover:border-foreground/20",
        ghost:
          "text-foreground/70 hover:bg-foreground/10 hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20",
        link:
          "text-primary underline-offset-4 hover:underline",
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
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const isLiquid = variant === "default" || !variant;

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLiquid && (
        <>
          <div
            className="hidden dark:block absolute inset-0 -z-10 rounded-[inherit] pointer-events-none"
            style={{
              boxShadow: "inset 0 -1px 4px 0 rgba(255, 255, 255, 0.2), 0 3px 5px 0 rgba(0, 0, 0, 0.2)",
            }}
          >
            <div
              className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(48,48,48,0.35) 60%, rgba(51,51,51,0.2) 100%)",
              }}
            />
            <div
              className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none"
              style={{
                WebkitBackdropFilter: "blur(18px) saturate(120%)",
                backdropFilter: "blur(18px) saturate(120%)",
                background: "linear-gradient(0deg, rgba(255,255,255,0.15) 0%, transparent 8%)",
                boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)",
              }}
            >
              <div
                className="absolute inset-0 rounded-[inherit]"
                style={{
                  padding: "1px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.1) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            </div>
          </div>

          <div
            className="block dark:hidden absolute inset-0 -z-10 rounded-[inherit] pointer-events-none"
            style={{
              boxShadow: "inset 0 -1px 4px 0 rgba(0, 0, 0, 0.05), 0 3px 5px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.1) 100%)",
              }}
            />
            <div
              className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none"
              style={{
                WebkitBackdropFilter: "blur(18px) saturate(120%)",
                backdropFilter: "blur(18px) saturate(120%)",
                background: "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 7%)",
                boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)",
              }}
            >
              <div
                className="absolute inset-0 rounded-[inherit]"
                style={{
                  padding: "1px",
                  background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.02) 70%, rgba(0,0,0,0.1) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            </div>
          </div>
        </>
      )}

      <Slottable>{children}</Slottable>
    </Comp>
  )
}

const buttonGroupVariants = cva(
  "relative isolate inline-flex items-center rounded-full overflow-hidden transition-all",
  {
    variants: {
      size: {
        default: "h-11",
        sm: "h-9",
        lg: "h-13",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof buttonGroupVariants> & { separator?: boolean }
>(({ className, size, separator = false, children, ...props }, ref) => {
  const childArray = React.Children.toArray(children);
  return (
    <div ref={ref} className={cn(buttonGroupVariants({ size, className }))} {...props}>
      <div className="hidden dark:block absolute inset-0 -z-10 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0 -1px 4px 0 rgba(255, 255, 255, 0.2), 0 3px 5px 0 rgba(0, 0, 0, 0.2)", }} >
        <div className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(48,48,48,0.35) 60%, rgba(51,51,51,0.2) 100%)" }} />
        <div className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none" style={{ WebkitBackdropFilter: "blur(18px) saturate(120%)", backdropFilter: "blur(18px) saturate(120%)", background: "linear-gradient(0deg, rgba(255,255,255,0.15) 0%, transparent 8%)", boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)", }} >
          <div className="absolute inset-0 rounded-[inherit]" style={{ padding: "1px", background: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.1) 30%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.1) 70%, rgba(255,255,255,0.1) 100%)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", }} />
        </div>
      </div>
      <div className="block dark:hidden absolute inset-0 -z-10 rounded-[inherit] pointer-events-none" style={{ boxShadow: "inset 0 -1px 4px 0 rgba(0, 0, 0, 0.05), 0 3px 5px 0 rgba(0, 0, 0, 0.1)", }} >
        <div className="absolute inset-0 z-0 rounded-[inherit] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0.1) 100%)" }} />
        <div className="absolute inset-0 z-10 rounded-[inherit] pointer-events-none" style={{ WebkitBackdropFilter: "blur(18px) saturate(120%)", backdropFilter: "blur(18px) saturate(120%)", background: "linear-gradient(0deg, rgba(255,255,255,0.4) 0%, transparent 7%)", boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.5)", }} >
          <div className="absolute inset-0 rounded-[inherit]" style={{ padding: "1px", background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.02) 70%, rgba(0,0,0,0.1) 100%)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude", }} />
        </div>
      </div>

      <div className="relative z-10 flex items-center p-0.5 h-full">
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {separator && index < childArray.length - 1 && (
              <div className="w-[1px] h-5 bg-foreground/10 mx-0.5 rounded-full" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

export { Button, buttonVariants, ButtonGroup }