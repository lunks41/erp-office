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

export default function JobOrderServiceItemNoMultiSelect<
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
    const { isSelected, isFocused, innerRef, innerProps, data } = props
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className={cn(
          "hover:bg-accent flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors",
          isFocused && "bg-accent",
          isSelected && "bg-accent/50"
        )}
      >
        <div
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded border",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input"
          )}
        >
          {isSelected && <IconCheck size={12} />}
        </div>
        <span className="flex-1">{data.label}</span>
      </div>
    )
  })
  Option.displayName = "Option"

  const selectClassNames = React.useMemo(
    () => ({
      control: () =>
        cn(
          "flex min-h-[80px] w-full items-start justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
          "hover:border-accent-foreground/50",
          "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50"
        ),
      menu: () =>
        cn(
          "relative z-50 max-h-[300px] min-w-[8rem] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        ),
      option: () =>
        cn("relative cursor-pointer select-none rounded-sm px-2 py-1.5"),
      multiValue: () =>
        cn(
          "bg-muted text-muted-foreground mr-1 mt-1 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs"
        ),
      multiValueLabel: () => cn("text-xs"),
      multiValueRemove: () =>
        cn(
          "ml-1 rounded-sm hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
        ),
      placeholder: () => cn("text-muted-foreground"),
      input: () => cn("text-foreground"),
    }),
    []
  )

  const customStyles: StylesConfig<FieldOption, true> = React.useMemo(
    () => ({
      control: () => ({}), // Handled by classNames
      menu: () => ({}), // Handled by classNames
      option: () => ({}), // Handled by classNames
      indicatorSeparator: () => ({
        display: "none", // Hide the indicator separator
      }),
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
      multiValue: (provided) => ({
        ...provided,
        wordBreak: "break-word",
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        pointerEvents: "auto",
      }),
    }),
    []
  )

  // Memoize handleChange to handle comma-separated string storage
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
        // Convert array to comma-separated string
        const values = selectedOptions.map((opt) => opt.value)
        const commaSeparatedString = values.join(",")
        form.setValue(
          name,
          (commaSeparatedString || "") as PathValue<T, Path<T>>
        )
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

  // Memoize getValue to convert comma-separated string to array
  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      if (
        !formValue ||
        (typeof formValue === "string" && formValue.trim() === "")
      ) {
        return null
      }
      // Handle comma-separated string
      const valueString =
        typeof formValue === "string" ? formValue : String(formValue)
      const values = valueString
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v && Number(v) > 0)

      if (values.length === 0) {
        return null
      }

      return options.filter((option) => values.includes(option.value))
    }
    return null
  }, [form, name, options])

  // Handle menu close to maintain focus on the control
  const selectControlRef = React.useRef<HTMLDivElement>(null)
  const isTabPressedRef = React.useRef(false)
  const isOptionSelectedRef = React.useRef(false)

  const handleMenuClose = React.useCallback(() => {
    if (!isTabPressedRef.current && isOptionSelectedRef.current) {
      requestAnimationFrame(() => {
        if (selectControlRef.current) {
          const input = selectControlRef.current.querySelector(
            "input"
          ) as HTMLElement
          if (input) {
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
          }
        }
      })
    }

    requestAnimationFrame(() => {
      isTabPressedRef.current = false
      isOptionSelectedRef.current = false
    })
  }, [])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Tab") {
        isTabPressedRef.current = true
        const target = event.currentTarget
        if (target) {
          const input = target.querySelector("input") as HTMLElement
          if (input && document.activeElement === input) {
            event.preventDefault()
            const form = target.closest("form")
            let targetElement: HTMLElement | null = null
            if (form) {
              const formElements = Array.from(
                form.querySelectorAll<HTMLElement>(
                  "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
                )
              )
              const currentIndex = formElements.indexOf(input)
              const nextIndex = event.shiftKey
                ? currentIndex - 1
                : currentIndex + 1
              if (nextIndex >= 0 && nextIndex < formElements.length) {
                targetElement = formElements[nextIndex]
              }
            }
            input.blur()
            if (targetElement) {
              setTimeout(() => targetElement?.focus(), 0)
            }
          }
        }
      }
    },
    []
  )

  // Form version
  if (form && name) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <FormField
          control={form.control}
          name={name}
          render={({ field, fieldState: { error } }) => {
            const showError = !!error
            return (
              <FormItem>
                {label && (
                  <div className="flex items-center gap-1">
                    <Label
                      htmlFor={name}
                      className={cn(
                        "text-sm font-medium",
                        isDisabled && "text-muted-foreground opacity-70"
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
                      <span
                        className="text-destructive text-sm"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    )}
                  </div>
                )}
                <div ref={selectControlRef} onKeyDown={handleKeyDown}>
                  <Select<FieldOption, true>
                    isMulti
                    options={options}
                    onChange={handleChange}
                    onMenuClose={handleMenuClose}
                    value={getValue()}
                    placeholder="Select Service Item No..."
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
        <Select<FieldOption, true>
          isMulti
          options={options}
          onChange={handleChange}
          onMenuClose={handleMenuClose}
          value={getValue()}
          placeholder="Select Service Item No..."
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
          loadingMessage={() => "Loading services..."}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
