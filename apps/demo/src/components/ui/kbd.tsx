import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-[var(--ios-radius-sm)] bg-[var(--ios-fill-tertiary)] px-1.5 font-sans text-[10px] font-semibold tracking-wide text-[var(--ios-label-secondary)] select-none in-data-[slot=tooltip-content]:bg-[var(--ios-bg-secondary)]/20 in-data-[slot=tooltip-content]:text-[var(--ios-bg-secondary)] dark:in-data-[slot=tooltip-content]:bg-[var(--ios-bg-secondary)]/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
