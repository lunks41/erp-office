"use client"

import React from "react"
import { IGeoLocationLookup } from "@/interfaces/lookup"
import {
  IconCheck,
  IconChevronDown,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { Path, PathValue, UseFormReturn } from "react-hook-form"
import Select, {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  MultiValue,
  OptionProps,
  SingleValue,
  StylesConfig,
  components,
} from "react-select"

import { cn } from "@/lib/utils"
import { useGeoLocationLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

interface FieldOption {
  value: string
  label: string
}

export default function GeoLocationAutocomplete<
  T extends Record<string, unknown>,
>({
  form,
  label,
  name,
  isDisabled = false,
  className,
  isRequired = false,
  onChangeEvent,
}: {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOption: IGeoLocationLookup | null) => void
}) {
  const { data: geolocations = [], isLoading, refetch } = useGeoLocationLookup()

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing geo locations:", error)
    }
  }, [refetch])

  // Memoize options to prevent unnecessary recalculations
  const options: FieldOption[] = React.useMemo(
    () =>
      geolocations.map((geolocation: IGeoLocationLookup) => ({
        value: geolocation.geoLocationId.toString(),
        label: geolocation.geoLocationName,
      })),
    [geolocations]
  )

  // Custom components with display names
  const DropdownIndicator = React.memo(
    (props: DropdownIndicatorProps<FieldOption>) => {
      return (
        <components.DropdownIndicator
          {...props}
          innerProps={{ ...props.innerProps, tabIndex: -1 }}
        >
          <IconChevronDown size={12} className="size-4 shrink-0 opacity-50" />
        </components.DropdownIndicator>
      )
    }
  )
  DropdownIndicator.displayName = "DropdownIndicator"

  const ClearIndicator = React.memo(
    (props: ClearIndicatorProps<FieldOption>) => {
      return (
        <components.ClearIndicator
          {...props}
          innerProps={{ ...props.innerProps, tabIndex: -1 }}
        >
          <IconX size={10} className="size-3 shrink-0" />
        </components.ClearIndicator>
      )
    }
  )
  ClearIndicator.displayName = "ClearIndicator"

  const Option = React.memo((props: OptionProps<FieldOption>) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <span>{props.data.label}</span>
        </div>
        {props.isSelected && (
          <span className="absolute right-2 flex size-3.5 items-center justify-center">
            <IconCheck className="size-4" />
          </span>
        )}
      </components.Option>
    )
  })
  Option.displayName = "Option" // Custom classNames for React Select (aligned with shadcn select.tsx)

  const selectClassNames = React.useMemo(
    () => ({
      control: (state: { isFocused: boolean; isDisabled: boolean }) =>
        cn(
          "border-gray-400 dark:border-gray-500 data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50",
          "flex w-full items-center justify-between gap-2 rounded-md border bg-transparent pl-2 pr-0 py-1 text-xs whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          state.isFocused
            ? "border-ring ring-[3px] ring-ring/50"
            : "border-gray-400 dark:border-gray-500",
          state.isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          isRequired &&
            !state.isDisabled &&
            "bg-yellow-50 border-gray-400 dark:bg-yellow-950/20 dark:border-gray-500",
          "h-8 min-h-8"
        ),
      menu: () =>
        cn(
          "bg-popover text-popover-foreground",
          "relative z-[9999] min-w-[8rem] overflow-hidden rounded-md border shadow-md animate-in fade-in-80",
          "mt-1"
        ),
      menuList: () => cn("p-1 overflow-auto"),
      option: (state: { isFocused: boolean; isSelected: boolean }) =>
        cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1 pl-2 pr-8 text-xs outline-none",
          state.isFocused && "bg-accent text-accent-foreground",
          state.isSelected && "bg-accent text-accent-foreground"
        ),
      noOptionsMessage: () => cn("text-muted-foreground py-1.5 px-2 text-xs"),
      placeholder: () => cn("text-muted-foreground"),
      singleValue: () => cn("text-foreground"), // Fixed to match menu list
      valueContainer: () => cn("px-0 py-0.5 gap-1"),
      input: () =>
        cn("text-foreground placeholder:text-muted-foreground m-0 p-0"),
      indicatorsContainer: () => cn(""), // Gap removed
      clearIndicator: () =>
        cn("text-muted-foreground hover:text-foreground p-1 rounded-sm"),
      dropdownIndicator: () => cn("text-muted-foreground p-1 rounded-sm"),
      multiValue: () => cn("bg-accent rounded-sm m-1 overflow-hidden"),
      multiValueLabel: () => cn("py-0.5 pl-2 pr-1 text-xs"),
      multiValueRemove: () =>
        cn(
          "hover:bg-destructive/90 hover:text-destructive-foreground px-1 rounded-sm"
        ),
    }),
    [isRequired]
  )

  // We still need some styles for things that can't be controlled via className
  const customStyles: StylesConfig<FieldOption, boolean> = React.useMemo(
    () => ({
      control: () => ({}), // Handled by classNames
      menu: () => ({}), // Handled by classNames
      option: () => ({}), // Handled by classNames
      indicatorSeparator: () => ({
        display: "none", // Hide the indicator separator
      }),
      // These minimal styles ensure proper layout
      valueContainer: (provided) => ({
        ...provided,
        padding: undefined, // Use className padding
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
      }),
      // Fix for dropdown appearing behind dialog
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        pointerEvents: "auto",
      }),
    }),
    []
  )

  // Memoize handleChange to prevent unnecessary recreations
  const handleChange = React.useCallback(
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
      const selectedOption = Array.isArray(option) ? option[0] : option
      // Mark that an option was selected (not just cleared)
      isOptionSelectedRef.current = !!selectedOption

      if (form && name) {
        // Set the value as a number
        const value = selectedOption ? Number(selectedOption.value) : 0
        form.setValue(name, value as PathValue<T, Path<T>>)
      }
      if (onChangeEvent) {
        const selectedGeoLocation = selectedOption
          ? geolocations.find(
              (u: IGeoLocationLookup) =>
                u.geoLocationId.toString() === selectedOption.value
            ) || null
          : null
        onChangeEvent(selectedGeoLocation)
      }
    },
    [form, name, onChangeEvent, geolocations]
  )

  // Memoize getValue to prevent unnecessary recalculations
  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      // Convert form value to string for comparison
      return (
        options.find((option) => option.value === formValue?.toString()) || null
      )
    }
    return null
  }, [form, name, options])

  // Handle menu close to maintain focus on the control
  const selectControlRef = React.useRef<HTMLDivElement>(null)
  const isTabPressedRef = React.useRef(false)
  const isOptionSelectedRef = React.useRef(false)

  const handleMenuClose = React.useCallback(() => {
    // Only refocus if:
    // 1. Tab was NOT pressed (to allow Tab navigation)
    // 2. An option was actually selected (to distinguish from clicking outside)
    if (!isTabPressedRef.current && isOptionSelectedRef.current) {
      // Use requestAnimationFrame for smoother timing and less flicker
      requestAnimationFrame(() => {
        if (selectControlRef.current) {
          const input = selectControlRef.current.querySelector(
            "input"
          ) as HTMLElement
          if (input) {
            const activeElement = document.activeElement as HTMLElement
            const form = selectControlRef.current.closest("form")

            // Only refocus if:
            // 1. Focus is not already on the input
            // 2. Focus is on the form, body, or outside the form
            // 3. Focus is not on another form field
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
          }
        }
      })
    }

    // Reset flags after menu closes
    requestAnimationFrame(() => {
      isTabPressedRef.current = false
      isOptionSelectedRef.current = false
    })
  }, [])

  // Handle Tab key to close menu and allow normal tab navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Tab") {
        // Set flag to prevent onMenuClose from refocusing
        isTabPressedRef.current = true
        // Close the menu by blurring the input, then allow normal tab navigation
        const target = event.currentTarget
        if (target) {
          const input = target.querySelector("input") as HTMLElement
          if (input && document.activeElement === input) {
            event.preventDefault()
            const form = target.closest("form")
            let targetElement: HTMLElement | null = null
            if (form) {
              const allFocusable = Array.from(
                form.querySelectorAll<HTMLElement>(
                  "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([disabled]):not([tabindex='-1'])"
                )
              )
              // Find the input's position in the focusable elements
              const inputIndex = allFocusable.findIndex(
                (el) => el === input || el.contains(input)
              )

              if (event.shiftKey) {
                // Shift+Tab: go to previous element
                if (inputIndex !== -1 && inputIndex > 0) {
                  targetElement = allFocusable[inputIndex - 1]
                } else {
                  // Fallback: find previous element before wrapper div
                  const wrapperIndex = allFocusable.findIndex(
                    (el) => target.contains(el) || el.contains(target)
                  )
                  if (wrapperIndex !== -1 && wrapperIndex > 0) {
                    targetElement = allFocusable[wrapperIndex - 1]
                  }
                }
              } else {
                // Tab: go to next element
                if (inputIndex !== -1 && inputIndex < allFocusable.length - 1) {
                  targetElement = allFocusable[inputIndex + 1]
                } else {
                  // Fallback: find next element after wrapper div
                  const wrapperIndex = allFocusable.findIndex(
                    (el) => target.contains(el) || el.contains(target)
                  )
                  if (
                    wrapperIndex !== -1 &&
                    wrapperIndex < allFocusable.length - 1
                  ) {
                    targetElement = allFocusable[wrapperIndex + 1]
                  }
                }
              }
            }
            // Blur to close menu and immediately focus target element to prevent flicker
            if (targetElement) {
              // Focus target element first (synchronously) to prevent form from receiving focus
              targetElement.focus()
              // Then blur to close menu (this won't affect the already-focused element)
              input.blur()
            } else {
              // If no target element found, just blur
              input.blur()
            }
          }
        }
      }
    },
    []
  )

  if (form && name) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        {label && (
          <div className="flex items-center gap-1">
            <Label
              htmlFor={name}
              className={cn(
                "text-xs font-medium",
                isRequired && "text-red-500"
              )}
            >
              {label}
            </Label>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              tabIndex={-1}
              className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
              title="Refresh geo locations"
            >
              <IconRefresh
                size={12}
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
            {isRequired && <span className="text-xs text-red-500">*</span>}
          </div>
        )}
        <FormField
          control={form.control}
          name={name}
          render={({ fieldState }) => {
            const { error } = fieldState
            const showError = !!error

            return (
              <FormItem className={cn("flex flex-col", className)}>
                <div ref={selectControlRef} onKeyDown={handleKeyDown}>
                  <Select
                    options={options}
                    value={getValue()}
                    onChange={handleChange}
                    onMenuClose={handleMenuClose}
                    placeholder="Select GeoLocation..."
                    isDisabled={isDisabled || isLoading}
                    isClearable={true}
                    isSearchable={true}
                    styles={customStyles}
                    classNames={selectClassNames}
                    components={{
                      DropdownIndicator,
                      ClearIndicator,
                      Option,
                    }}
                    className="react-select-container"
                    classNamePrefix="react-select__"
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    isLoading={isLoading}
                    loadingMessage={() => "Loading geo locations..."}
                    blurInputOnSelect={true}
                  />
                </div>
                {showError && (
                  <p className="text-destructive mt-1 text-xs">
                    {error.message}
                  </p>
                )}
              </FormItem>
            )
          }}
        />
      </div>
    )
  }

  // Standalone version (no form)
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "text-xs font-medium",
              isDisabled && "text-muted-foreground opacity-70"
            )}
          >
            {label}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            tabIndex={-1}
            className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
            title="Refresh geo locations"
          >
            <IconRefresh
              size={12}
              className={`text-muted-foreground hover:text-foreground transition-colors ${
                isLoading ? "animate-spin" : ""
              }`}
            />
          </button>
          {isRequired && (
            <span className="text-destructive text-xs" aria-hidden="true">
              *
            </span>
          )}
        </div>
      )}
      <div ref={selectControlRef} onKeyDown={handleKeyDown}>
        <Select
          options={options}
          onChange={handleChange}
          onMenuClose={handleMenuClose}
          placeholder="Select GeoLocation..."
          isDisabled={isDisabled || isLoading}
          isClearable={true}
          isSearchable={true}
          styles={customStyles}
          classNames={selectClassNames}
          components={{
            DropdownIndicator,
            ClearIndicator,
            Option,
          }}
          className="react-select-container"
          classNamePrefix="react-select__"
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          isLoading={isLoading}
          loadingMessage={() => "Loading geo locations..."}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
