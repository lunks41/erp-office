import { StylesConfig } from "react-select"

import { cn } from "@/lib/utils"

import type { SearchableFieldOption } from "./searchable-field-option"

/** Shared react-select classNames — original control size; list options wrap when open. */
export function createSearchableSelectClassNames(isRequired = false) {
  return {
    control: (state: { isFocused: boolean; isDisabled: boolean }) =>
      cn(
        "border-gray-400 dark:border-gray-500 data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50",
        "flex w-full items-center justify-between gap-2 rounded-md border bg-transparent pl-2 pr-0 py-0.5 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        state.isFocused
          ? "border-ring ring-[3px] ring-ring/50"
          : "border-gray-400 dark:border-gray-500",
        state.isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        isRequired &&
          !state.isDisabled &&
          "bg-yellow-50 border-gray-400 dark:bg-yellow-950/20 dark:border-gray-500",
        "h-7.5 min-h-7.5"
      ),
    menu: () =>
      cn(
        "bg-popover text-popover-foreground",
        "relative z-[9999] min-w-[8rem] overflow-hidden rounded-md border shadow-md animate-in fade-in-80",
        "mt-1"
      ),
    menuList: () => cn("p-1 overflow-auto"),
    option: () =>
      cn(
        "relative flex w-full cursor-default select-none items-start rounded-sm py-1.5 pl-2 pr-8 text-xs outline-none"
      ),
    noOptionsMessage: () => cn("text-muted-foreground py-1.5 px-2 text-xs"),
    placeholder: () => cn("text-muted-foreground"),
    singleValue: () => cn("text-foreground truncate"),
    valueContainer: () => cn("px-0 py-0.5 gap-1 min-w-0"),
    input: () =>
      cn("text-foreground placeholder:text-muted-foreground m-0 p-0"),
    indicatorsContainer: () => cn("flex shrink-0 gap-0.5"),
    clearIndicator: () =>
      cn("text-muted-foreground hover:text-foreground p-1 rounded-sm"),
    dropdownIndicator: () => cn("text-muted-foreground p-1 rounded-sm"),
    multiValue: () => cn("bg-accent rounded-sm m-1 overflow-hidden"),
    multiValueLabel: () => cn("py-0.5 pl-2 pr-1 text-xs"),
    multiValueRemove: () =>
      cn(
        "hover:bg-destructive/90 hover:text-destructive-foreground px-1 rounded-sm"
      ),
  }
}

/** Original inline styles + wrap text in open dropdown list only (menu matches control width). */
export const searchableSelectWrapStyles: StylesConfig<
  SearchableFieldOption,
  false
> = {
  control: () => ({}),
  indicatorSeparator: () => ({
    display: "none",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: undefined,
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    color: "var(--foreground)",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--foreground)",
    fontSize: "12px",
    height: "20px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
    pointerEvents: "auto",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.15)",
    width: base.width,
    maxWidth: base.width,
  }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
  }),
  option: (base, { isFocused, isDisabled }) => ({
    ...base,
    whiteSpace: "normal",
    wordBreak: "break-word",
    backgroundColor:
      isFocused && !isDisabled
        ? "var(--select-option-focus-bg)"
        : isDisabled
          ? "color-mix(in oklch, var(--muted) 50%, transparent)"
          : "transparent",
    color:
      isFocused && !isDisabled
        ? "var(--select-option-focus-fg)"
        : isDisabled
          ? "var(--muted-foreground)"
          : "var(--popover-foreground)",
    cursor: isDisabled ? "default" : "pointer",
  }),
}
