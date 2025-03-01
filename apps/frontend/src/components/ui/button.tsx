import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

import { cn } from "@/lib/utils";

const Spinner = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    className="animate-spin"
  >
    <path
      d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
      fill="currentColor"
    />
  </svg>
);

const buttonVariants = cva(
  [
    "cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors",
    /* Disabled */
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ",
    /* Focus Visible */
    "data-[focus-visible]:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring data-[focus-visible]:ring-offset-2",
    /* Resets */
    "focus-visible:outline-none",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground data-[hovered]:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground data-[hovered]:bg-destructive/90",
        outline:
          "border border-input bg-background data-[hovered]:bg-accent data-[hovered]:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground data-[hovered]:bg-secondary/80",
        ghost: "data-[hovered]:bg-accent data-[hovered]:text-accent-foreground",
        link: "text-primary underline-offset-4 data-[hovered]:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends AriaButtonProps,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef(
  (
    { className, children, variant, size, ...props }: ButtonProps,
    ref: React.Ref<HTMLButtonElement>
  ) => {
    return (
      <AriaButton
        className={composeRenderProps(className, (className) =>
          cn(
            buttonVariants({
              variant,
              size,
              className,
            })
          )
        )}
        {...props}
        ref={ref}
      >
        {({ isPending }) => (isPending ? <Spinner /> : <>{children}</>)}
      </AriaButton>
    );
  }
);

export { Button, buttonVariants };
export type { ButtonProps };
