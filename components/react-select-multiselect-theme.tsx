"use client"

import React from "react"
import { IconCheck } from "@tabler/icons-react"
import {
  components,
  type GroupBase,
  type OptionProps,
  type StylesConfig,
} from "react-select"

import { cn } from "@/lib/utils"

export interface MultiSelectFieldOption {
  value: string
  label: string
}

/** Tailwind classNames — uses theme tokens (light + dark via CSS variables). */
export function getMultiSelectClassNames() {
  return {
    control: () =>
      cn(
        "flex min-h-[80px] w-full items-start justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
        "hover:border-accent-foreground/50",
        "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50"
      ),
    menu: () =>
      cn(
        "relative z-50 max-h-[300px] min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
      ),
    menuList: () => cn("max-h-[300px] overflow-auto bg-popover p-1"),
    option: () =>
      cn(
        "flex cursor-pointer items-start gap-2 rounded-sm px-3 py-2 text-sm text-popover-foreground whitespace-normal wrap-break-word"
      ),
    valueContainer: () =>
      cn("flex min-w-0 flex-1 flex-wrap items-start gap-1 bg-transparent py-1"),
    multiValue: () =>
      cn(
        "bg-muted text-muted-foreground mr-1 mt-1 inline-flex max-w-full items-start gap-1 rounded px-2 py-0.5 text-xs"
      ),
    multiValueLabel: () =>
      cn("text-xs leading-snug wrap-break-word whitespace-normal text-muted-foreground"),
    multiValueRemove: () =>
      cn(
        "ml-1 shrink-0 cursor-pointer rounded-sm hover:bg-destructive hover:text-destructive-foreground"
      ),
    placeholder: () => cn("text-muted-foreground"),
    input: () => cn("text-foreground"),
    noOptionsMessage: () => cn("text-muted-foreground py-2 px-3 text-sm"),
    loadingMessage: () => cn("text-muted-foreground py-2 px-3 text-sm"),
  }
}

/** Merge with react-select base styles — never return `{}` without spreading base. */
export function createMultiSelectStyles(
  menuWidth?: number
): StylesConfig<MultiSelectFieldOption, true, GroupBase<MultiSelectFieldOption>> {
  return {
    control: (base, { isFocused, isDisabled }) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: isDisabled
        ? "var(--border)"
        : isFocused
          ? "var(--ring)"
          : "var(--input)",
      borderStyle: "solid",
      borderWidth: 1,
      borderRadius: "var(--radius)",
      boxShadow: isFocused ? "0 0 0 1px var(--ring)" : undefined,
      minHeight: undefined,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.15)",
      ...(menuWidth ? { width: menuWidth, maxWidth: menuWidth } : {}),
    }),
    menuList: (base) => ({
      ...base,
      backgroundColor: "var(--popover)",
      padding: 0,
    }),
    option: (base) => ({
      ...base,
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      whiteSpace: "normal",
      wordBreak: "break-word",
      backgroundColor: "transparent",
      color: "var(--popover-foreground)",
      cursor: "pointer",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: 0,
      backgroundColor: "transparent",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: "var(--foreground)",
      backgroundColor: "transparent",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "var(--muted)",
      maxWidth: "100%",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "var(--muted-foreground)",
      whiteSpace: "normal",
      wordBreak: "break-word",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
      pointerEvents: "auto",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
    loadingMessage: (base) => ({
      ...base,
      color: "var(--muted-foreground)",
    }),
  } satisfies StylesConfig<
    MultiSelectFieldOption,
    true,
    GroupBase<MultiSelectFieldOption>
  >
}

export const MultiSelectCheckboxOption = React.memo(
  (props: OptionProps<MultiSelectFieldOption, true>) => {
    const { isSelected, isFocused, data } = props
    return (
      <components.Option
        {...props}
        className={cn(
          "flex cursor-pointer items-start gap-2 px-3 py-2 text-sm text-popover-foreground transition-colors",
          isFocused && "bg-accent text-accent-foreground",
          isSelected && !isFocused && "bg-accent/50 text-popover-foreground"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 box-border flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2",
            isSelected
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : cn(
                  "border-foreground/55 bg-background shadow-sm ring-1 ring-inset ring-foreground/20",
                  isFocused && "border-foreground/80 bg-card"
                )
          )}
        >
          {isSelected && <IconCheck size={12} stroke={2.5} />}
        </span>
        <span className="min-w-0 flex-1 leading-snug wrap-break-word whitespace-normal">
          {data.label}
        </span>
      </components.Option>
    )
  }
)
MultiSelectCheckboxOption.displayName = "MultiSelectCheckboxOption"
