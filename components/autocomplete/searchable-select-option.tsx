"use client"

import React from "react"
import { IconCheck } from "@tabler/icons-react"
import { components, OptionProps } from "react-select"

import { cn } from "@/lib/utils"

import type { SearchableFieldOption } from "./searchable-field-option"

export function createSearchableSelectOption(hasActiveSearch: boolean) {
  const SearchableSelectOption = React.memo(
    (props: OptionProps<SearchableFieldOption>) => {
      const isPinnedPrevious = props.data.isPinnedPrevious === true
      const showFocusHighlight = props.isFocused && !isPinnedPrevious
      const showTick =
        isPinnedPrevious ||
        (props.isSelected && !showFocusHighlight && !hasActiveSearch)

      return (
        <components.Option
          {...props}
          className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1 pl-2 pr-8 text-xs outline-none",
            showFocusHighlight && "bg-accent text-accent-foreground",
            isPinnedPrevious && "bg-muted/50 text-muted-foreground",
            !hasActiveSearch &&
              props.isSelected &&
              !showFocusHighlight &&
              "bg-muted/40"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {isPinnedPrevious && hasActiveSearch && (
              <span className="text-muted-foreground shrink-0 text-[10px] font-medium uppercase">
                Current
              </span>
            )}
            <span className="truncate">{props.data.label}</span>
          </div>
          {showTick && (
            <span className="absolute right-2 flex size-3.5 items-center justify-center">
              <IconCheck className="text-muted-foreground size-4" />
            </span>
          )}
        </components.Option>
      )
    }
  )
  SearchableSelectOption.displayName = "SearchableSelectOption"
  return SearchableSelectOption
}
