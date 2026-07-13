import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase whitespace-nowrap transition-all focus-visible:border-[var(--ios-blue)] focus-visible:ring-[3px] focus-visible:ring-[var(--ios-blue)]/30 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-[var(--ios-red)] aria-invalid:ring-[var(--ios-red)]/20 dark:aria-invalid:ring-[var(--ios-red)]/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[var(--ios-blue)] text-white [a]:hover:bg-[var(--ios-blue)]/80",
        secondary:
          "bg-[var(--ios-fill-tertiary)] text-[var(--ios-label-secondary)] [a]:hover:bg-[var(--ios-fill-secondary)]",
        destructive:
          "bg-[var(--ios-red)]/10 text-[var(--ios-red)] focus-visible:ring-[var(--ios-red)]/20 dark:bg-[var(--ios-red)]/20 dark:focus-visible:ring-[var(--ios-red)]/40 [a]:hover:bg-[var(--ios-red)]/20",
        outline:
          "border-[var(--ios-separator)] text-[var(--ios-label-secondary)] [a]:hover:bg-[var(--ios-fill-quaternary)] [a]:hover:text-[var(--ios-label)]",
        ghost:
          "hover:bg-[var(--ios-fill-quaternary)] hover:text-[var(--ios-label-secondary)] dark:hover:bg-[var(--ios-fill-tertiary)]",
        link: "text-[var(--ios-blue)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export { badgeVariants }
