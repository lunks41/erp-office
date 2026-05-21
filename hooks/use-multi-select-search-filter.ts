"use client"

import React from "react"

/** Keeps dropdown filtered after select while clearing visible search text in the control. */
export function useMultiSelectSearchFilter() {
  const [filterInput, setFilterInput] = React.useState("")
  const [menuSearch, setMenuSearch] = React.useState("")

  const handleInputChange = React.useCallback(
    (val: string, meta: { action: string }) => {
      if (meta.action === "input-change") {
        setFilterInput(val)
        setMenuSearch(val)
      } else if (meta.action === "select-option") {
        setFilterInput("")
      }
    },
    []
  )

  const clearInputAfterSelect = React.useCallback(() => {
    setFilterInput("")
  }, [])

  const resetSearchFilter = React.useCallback(() => {
    setFilterInput("")
    setMenuSearch("")
  }, [])

  const filterOption = React.useCallback(
    (option: { label: string }, _inputValue: string) => {
      const term = menuSearch.trim().toLowerCase()
      if (!term) return true
      return option.label.toLowerCase().includes(term)
    },
    [menuSearch]
  )

  return {
    filterInput,
    handleInputChange,
    clearInputAfterSelect,
    resetSearchFilter,
    filterOption,
  }
}
