"use client"

import React from "react"
import { IconCheck } from "@tabler/icons-react"
import { components, OptionProps } from "react-select"

import { cn } from "@/lib/utils"

import type { SearchableFieldOption } from "./searchable-field-option"

export function createSearchableSelectOption(
  hasActiveSearch: boolean,
  focusedOptionRef?: React.MutableRefObject<SearchableFieldOption | null>
) {
  const SearchableSelectOption = React.memo(
    (props: OptionProps<SearchableFieldOption>) => {
      const isPinnedPrevious = props.data.isPinnedPrevious === true
      const showFocusHighlight = props.isFocused && !isPinnedPrevious

      if (focusedOptionRef && props.isFocused && !isPinnedPrevious) {
        focusedOptionRef.current = props.data
      }
      const showTick =
        isPinnedPrevious ||
        (props.isSelected && !showFocusHighlight && !hasActiveSearch)

      return (
        <components.Option
          {...props}
          data-focused={showFocusHighlight ? true : undefined}
          className={cn(
            "relative flex w-full cursor-default select-none items-start rounded-sm py-1.5 pl-2 pr-8 text-xs text-popover-foreground outline-none",
            isPinnedPrevious && "bg-muted/50 text-muted-foreground",
            !hasActiveSearch &&
              props.isSelected &&
              !showFocusHighlight &&
              "bg-muted/40 text-foreground"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {isPinnedPrevious && hasActiveSearch && (
              <span className="text-muted-foreground shrink-0 text-[10px] font-medium uppercase">
                Current
              </span>
            )}
            <span className="wrap-break-word whitespace-normal leading-snug">
              {props.data.label}
            </span>
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
