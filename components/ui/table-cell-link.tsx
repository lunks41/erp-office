"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type TableCellLinkProps = React.ComponentProps<"button">

/** Link-styled control for data-grid cells — uses `text-primary` via `.table-cell-link`. */
export function TableCellLink({
  className,
  type = "button",
  ...props
}: TableCellLinkProps) {
  return (
    <button type={type} className={cn("table-cell-link", className)} {...props} />
  )
}
