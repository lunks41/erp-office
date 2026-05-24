"use client"

import * as React from "react"

const FOCUSABLE_SELECTOR =
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]):not([disabled])'

function isVisible(el: HTMLElement): boolean {
  return el.offsetParent !== null || el.getClientRects().length > 0
}

function getTabScope(container: HTMLElement): ParentNode {
  return (
    container.closest("form") ??
    container.closest('[role="dialog"]') ??
    container.closest("[data-radix-dialog-content]") ??
    document
  )
}

function getFocusableInScope(scope: ParentNode): HTMLElement[] {
  return Array.from(
    scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => isVisible(el))
}

function findControlIndex(
  focusable: HTMLElement[],
  container: HTMLElement
): number {
  const input = container.querySelector("input") as HTMLElement | null

  if (input) {
    const byInput = focusable.findIndex(
      (el) => el === input || el.contains(input) || input.contains(el)
    )
    if (byInput !== -1) return byInput
  }

  return focusable.findIndex(
    (el) =>
      el === container ||
      container.contains(el) ||
      el.contains(container) ||
      !!el.closest(".react-select-container")?.contains(container)
  )
}

function focusRelative(
  container: HTMLElement,
  direction: "next" | "prev"
): void {
  const scope = getTabScope(container)
  const focusable = getFocusableInScope(scope)
  if (focusable.length === 0) return

  const currentIndex = findControlIndex(focusable, container)
  const delta = direction === "next" ? 1 : -1
  const targetIndex =
    currentIndex === -1
      ? direction === "next"
        ? 0
        : focusable.length - 1
      : currentIndex + delta

  if (targetIndex < 0 || targetIndex >= focusable.length) return

  const input = container.querySelector("input") as HTMLElement | null
  input?.blur()
  focusable[targetIndex]?.focus()
}

/** Shared Tab + menu-close behavior for react-select autocompletes. */
export function useReactSelectTabNavigation() {
  const selectControlRef = React.useRef<HTMLDivElement>(null)
  const isTabPressedRef = React.useRef(false)
  const isOptionSelectedRef = React.useRef(false)

  const handleMenuClose = React.useCallback(() => {
    if (!isTabPressedRef.current && isOptionSelectedRef.current) {
      requestAnimationFrame(() => {
        if (!selectControlRef.current) return
        const input = selectControlRef.current.querySelector(
          "input"
        ) as HTMLElement | null
        if (!input) return

        const activeElement = document.activeElement as HTMLElement
        const form = selectControlRef.current.closest("form")

        if (
          activeElement !== input &&
          form &&
          (activeElement === form ||
            activeElement === document.body ||
            !form.contains(activeElement) ||
            activeElement.tagName === "BODY")
        ) {
          input.focus()
        }
      })
    }

    requestAnimationFrame(() => {
      isTabPressedRef.current = false
      isOptionSelectedRef.current = false
    })
  }, [])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Tab") return

      isTabPressedRef.current = true
      const container =
        selectControlRef.current ?? (event.currentTarget as HTMLElement)
      if (!container) return

      event.preventDefault()
      event.stopPropagation()
      focusRelative(container, event.shiftKey ? "prev" : "next")
    },
    []
  )

  const resetOnMenuOpen = React.useCallback(() => {
    isOptionSelectedRef.current = false
  }, [])

  const markOptionSelected = React.useCallback((selected: boolean) => {
    isTabPressedRef.current = false
    isOptionSelectedRef.current = selected
  }, [])

  return {
    selectControlRef,
    handleMenuClose,
    handleKeyDown,
    resetOnMenuOpen,
    markOptionSelected,
  }
}
