import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-[var(--ios-blue)] focus-visible:ring-3 focus-visible:ring-[var(--ios-blue)]/30 active:not-aria-[haspopup]:scale-95 disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-[var(--ios-red)] aria-invalid:ring-3 aria-invalid:ring-[var(--ios-red)]/20 dark:aria-invalid:border-[var(--ios-red)]/50 dark:aria-invalid:ring-[var(--ios-red)]/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--ios-blue)] text-white hover:bg-[var(--ios-blue)]/80 shadow-sm",
        outline:
          "border-[var(--ios-separator)] bg-[var(--ios-bg-secondary)] hover:bg-[var(--ios-fill-quaternary)] hover:text-[var(--ios-label)] aria-expanded:bg-[var(--ios-fill-tertiary)] aria-expanded:text-[var(--ios-label)]",
        secondary:
          "bg-[var(--ios-fill-tertiary)] text-[var(--ios-label)] hover:bg-[var(--ios-fill-secondary)] aria-expanded:bg-[var(--ios-fill-secondary)] aria-expanded:text-[var(--ios-label)]",
        ghost:
          "hover:bg-[var(--ios-fill-quaternary)] hover:text-[var(--ios-label)] aria-expanded:bg-[var(--ios-fill-tertiary)] aria-expanded:text-[var(--ios-label)]",
        destructive:
          "bg-[var(--ios-red)]/10 text-[var(--ios-red)] hover:bg-[var(--ios-red)]/20 focus-visible:border-[var(--ios-red)]/40 focus-visible:ring-[var(--ios-red)]/20 dark:bg-[var(--ios-red)]/20 dark:hover:bg-[var(--ios-red)]/30 dark:focus-visible:ring-[var(--ios-red)]/40",
        link: "text-[var(--ios-blue)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-full px-2 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-full px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8 rounded-full",
        "icon-xs":
          "size-6 rounded-full in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-full in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-9 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export { buttonVariants }
