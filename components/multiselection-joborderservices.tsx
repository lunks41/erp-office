"use client"

import React from "react"
import { IServiceItemNoLookup } from "@/interfaces/lookup"
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
import { useJobOrderChargeLookup } from "@/hooks/use-lookup"
import { FormField, FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"

interface FieldOption {
  value: string
  label: string
}

export default function JobOrderServiceMultiSelect<
  T extends Record<string, unknown>,
>({
  form,
  label,
  name,
  jobOrderId,
  taskId,
  isDisabled = false,
  className,
  isRequired = false,
  onChangeEvent,
}: {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  jobOrderId: number
  taskId: number
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOptions: IServiceItemNoLookup[]) => void
}) {
  const {
    data: services = [],
    isLoading,
    refetch,
  } = useJobOrderChargeLookup(jobOrderId, taskId)

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing services:", error)
    }
  }, [refetch])

  // Memoize options to prevent unnecessary recalculations
  const options: FieldOption[] = React.useMemo(
    () =>
      services.map((service: IServiceItemNoLookup) => ({
        value: service.serviceItemNo.toString(),
        label: service.serviceItemNoName,
      })),
    [services]
  )

  // Custom components with display names
  const DropdownIndicator = React.memo(
    (props: DropdownIndicatorProps<FieldOption>) => {
      return (
        <components.DropdownIndicator {...props}>
          <IconChevronDown size={12} className="size-4 shrink-0 opacity-50" />
        </components.DropdownIndicator>
      )
    }
  )
  DropdownIndicator.displayName = "DropdownIndicator"

  const ClearIndicator = React.memo(
    (props: ClearIndicatorProps<FieldOption>) => {
      return (
        <components.ClearIndicator {...props}>
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
          "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50",
          "flex w-full items-center justify-between gap-2 rounded-md border bg-transparent pl-3 pr-0 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          state.isFocused
            ? "border-ring ring-[3px] ring-ring/50"
            : "border-input",
          state.isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          "h-9 min-h-9"
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
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none",
          state.isFocused && "bg-accent text-accent-foreground",
          state.isSelected && "bg-accent text-accent-foreground"
        ),
      noOptionsMessage: () => cn("text-muted-foreground py-2 px-3 text-sm"),
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
      multiValueLabel: () => cn("py-0.5 pl-2 pr-1 text-sm"),
      multiValueRemove: () =>
        cn(
          "hover:bg-destructive/90 hover:text-destructive-foreground px-1 rounded-sm"
        ),
    }),
    []
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
        minHeight: "2rem",
        display: "flex",
        flexWrap: "wrap",
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
      multiValue: (provided) => ({
        ...provided,
        maxWidth: "100%",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        whiteSpace: "normal",
        wordBreak: "break-word",
      }),
    }),
    []
  )

  // Memoize handleChange to prevent unnecessary recreations
  const handleChange = React.useCallback(
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
      const selectedOptions = Array.isArray(option)
        ? option
        : option
          ? [option]
          : []
      // Mark that an option was selected (not just cleared)
      isOptionSelectedRef.current = selectedOptions.length > 0

      if (form && name) {
        const values = selectedOptions.map((opt) => Number(opt.value))
        form.setValue(name, values as PathValue<T, Path<T>>)
      }
      if (onChangeEvent) {
        const selectedServices = selectedOptions
          .map((opt) =>
            services.find(
              (u: IServiceItemNoLookup) =>
                u.serviceItemNo.toString() === opt.value
            )
          )
          .filter(
            (service): service is IServiceItemNoLookup => service !== undefined
          )
        onChangeEvent(selectedServices)
      }
    },
    [form, name, onChangeEvent, services]
  )

  // Memoize getValue to prevent unnecessary recalculations
  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      if (!formValue || (Array.isArray(formValue) && formValue.length === 0)) {
        return null
      }
      // Handle array of values
      const values = Array.isArray(formValue)
        ? formValue.filter((v) => v && Number(v) > 0)
        : []

      if (values.length === 0) {
        return null
      }

      return options.filter((option) =>
        values.some((val) => option.value === val.toString())
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
      <div className={cn("flex flex-col gap-1", className)}>
        {label && (
          <div className="flex items-center gap-1">
            <Label htmlFor={name} className="text-sm font-medium">
              {label}
            </Label>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              tabIndex={-1}
              className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
              title="Refresh services"
            >
              <IconRefresh
                size={12}
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
            {isRequired && <span className="text-sm text-red-500">*</span>}
          </div>
        )}
        <FormField
          control={form.control}
          name={name}
          render={({
            fieldState,
          }: {
            fieldState: { error?: { message?: string } }
          }) => {
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
                    placeholder="Select Charge..."
                    isDisabled={isDisabled || isLoading}
                    isClearable={true}
                    isSearchable={true}
                    isMulti={true}
                    filterOption={(option, inputValue) => {
                      // Always show selected options, even if they don't match search
                      const formValue =
                        form && name ? form.getValues(name) : null
                      if (formValue) {
                        const values = Array.isArray(formValue)
                          ? formValue
                          : [formValue]
                        if (
                          values.some((val) => option.value === val.toString())
                        ) {
                          return true
                        }
                      }
                      // For other options, use default filtering
                      return option.label
                        .toLowerCase()
                        .includes(inputValue.toLowerCase())
                    }}
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
                    loadingMessage={() => "Loading services..."}
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
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <div className="flex items-center gap-1">
          <div
            className={cn(
              "text-sm font-medium",
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
            title="Refresh services"
          >
            <IconRefresh
              size={12}
              className={`text-muted-foreground hover:text-foreground transition-colors ${
                isLoading ? "animate-spin" : ""
              }`}
            />
          </button>
          {isRequired && (
            <span className="text-destructive text-sm" aria-hidden="true">
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
          placeholder="Select Charge..."
          isDisabled={isDisabled || isLoading}
          isClearable={true}
          isSearchable={true}
          isMulti={true}
          filterOption={(option, inputValue) => {
            // Always show selected options, even if they don't match search
            const formValue = form && name ? form.getValues(name) : null
            if (formValue) {
              const values = Array.isArray(formValue) ? formValue : [formValue]
              if (values.some((val) => option.value === val.toString())) {
                return true
              }
            }
            // For other options, use default filtering
            return option.label.toLowerCase().includes(inputValue.toLowerCase())
          }}
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
          loadingMessage={() => "Loading services..."}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
