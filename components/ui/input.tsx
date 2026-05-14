import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-7.5 w-full min-w-0 rounded-md border border-gray-400 bg-muted/5 px-2 py-0.5 text-xs shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-5 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:bg-muted/10",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "disabled:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:border-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
