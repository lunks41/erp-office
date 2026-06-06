"use client"

import * as React from "react"
import { SelectInstance } from "react-select"

import {
  buildSearchableSelectOptions,
  filterSearchableSelectOption,
  isPinnedPreviousSelectOption,
  resolveOptionOnTabSelect,
  type SearchableFieldOption,
} from "./searchable-field-option"
import { createSearchableSelectOption } from "./searchable-select-option"
import { useReactSelectTabNavigation } from "./use-react-select-tab-navigation"

function getTypedValueFromControl(container: HTMLElement | null): string {
  const input = container?.querySelector("input") as HTMLInputElement | null
  return input?.value?.trim() ?? ""
}

export function useReactSelectSearchableField({
  baseOptions,
  selectedOptionId,
  onTabSelectOption,
}: {
  baseOptions: SearchableFieldOption[]
  selectedOptionId: string | null
  onTabSelectOption?: (option: SearchableFieldOption) => void
}) {
  const selectRef = React.useRef<SelectInstance<SearchableFieldOption, false>>(
    null
  )
  const focusedOptionRef = React.useRef<SearchableFieldOption | null>(null)
  const [menuInputValue, setMenuInputValue] = React.useState("")
  const hasActiveSearch = menuInputValue.trim().length > 0
  const onTabSelectRef = React.useRef(onTabSelectOption)
  onTabSelectRef.current = onTabSelectOption

  const {
    selectControlRef,
    handleMenuClose,
    handleKeyDown,
    resetOnMenuOpen,
    markOptionSelected,
  } = useReactSelectTabNavigation()

  const options = React.useMemo(
    () =>
      buildSearchableSelectOptions(
        baseOptions,
        menuInputValue,
        selectedOptionId
      ),
    [baseOptions, menuInputValue, selectedOptionId]
  )

  const SearchableOption = React.useMemo(
    () => createSearchableSelectOption(hasActiveSearch, focusedOptionRef),
    [hasActiveSearch]
  )

  const focusFirstSearchMatch = React.useCallback(() => {
    requestAnimationFrame(() => {
      selectRef.current?.focusOption("down")
    })
  }, [])

  const handleInputChange = React.useCallback(
    (value: string, actionMeta: { action: string }) => {
      if (actionMeta.action === "input-change") {
        setMenuInputValue(value)
        if (value.trim()) {
          focusFirstSearchMatch()
        }
      }
      if (
        actionMeta.action === "menu-close" ||
        actionMeta.action === "set-value"
      ) {
        setMenuInputValue("")
      }
    },
    [focusFirstSearchMatch]
  )

  React.useEffect(() => {
    if (!hasActiveSearch) return
    const hasPinned = options.some((o) => o.isPinnedPrevious)
    const hasMatch = options.some((o) => !o.isPinnedPrevious)
    if (hasPinned && hasMatch) {
      focusFirstSearchMatch()
    }
  }, [hasActiveSearch, options, focusFirstSearchMatch])

  const clearMenuInput = React.useCallback(() => {
    setMenuInputValue("")
  }, [])

  const handleSearchableMenuClose = React.useCallback(() => {
    focusedOptionRef.current = null
    setMenuInputValue("")
    handleMenuClose()
  }, [handleMenuClose])

  const resolveTabSelectMatch = React.useCallback(
    (rawInput: string, selectContainer: HTMLElement | null) =>
      resolveOptionOnTabSelect({
        baseOptions,
        filteredOptions: options,
        rawInput,
        keyboardFocusedOption: focusedOptionRef.current,
        selectContainer,
      }),
    [baseOptions, options]
  )

  const handleSearchableKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Tab" && !event.shiftKey) {
        const container =
          selectControlRef.current ?? (event.currentTarget as HTMLElement)
        const typed = getTypedValueFromControl(container)

        if (typed) {
          const matched = resolveTabSelectMatch(typed, container)
          if (matched && matched.value !== selectedOptionId) {
            setMenuInputValue("")
            onTabSelectRef.current?.(matched)
            markOptionSelected(true)
            selectRef.current?.blur()
          }
        }
      }

      handleKeyDown(event)
    },
    [
      resolveTabSelectMatch,
      selectedOptionId,
      handleKeyDown,
      selectControlRef,
      markOptionSelected,
    ]
  )

  const shouldSkipMenuOpenScroll = hasActiveSearch

  const wrapOnChange = React.useCallback(<T,>(handler: (option: T) => void) => {
    return (option: T) => {
      setMenuInputValue("")
      handler(option)
    }
  }, [])

  const searchableSelectProps = React.useMemo(
    () => ({
      ref: selectRef,
      options,
      onInputChange: handleInputChange,
      onMenuClose: handleSearchableMenuClose,
      isOptionDisabled: isPinnedPreviousSelectOption,
      filterOption: filterSearchableSelectOption,
      tabSelectsValue: false as const,
    }),
    [options, handleInputChange, handleSearchableMenuClose]
  )

  return {
    options,
    hasActiveSearch,
    menuInputValue,
    SearchableOption,
    selectControlRef,
    handleSearchableKeyDown,
    clearMenuInput,
    wrapOnChange,
    resetOnMenuOpen,
    markOptionSelected,
    searchableSelectProps,
    resolveTabSelectMatch,
    shouldSkipMenuOpenScroll,
    /** @deprecated Use searchableSelectProps — kept for gradual migration */
    selectRef,
    handleSearchableMenuClose,
    handleInputChange,
    filterSearchableOption: filterSearchableSelectOption,
    isPinnedPreviousOption: isPinnedPreviousSelectOption,
  }
}
