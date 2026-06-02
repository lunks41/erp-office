"use client"

import React, { useCallback, useState } from "react"
import { IJobOrderLookup } from "@/interfaces/lookup"
import { IconChevronDown,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { Path, PathValue, UseFormReturn } from "react-hook-form"
import Select, {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  MultiValue,
  SingleValue,
  StylesConfig,
  components,
} from "react-select"
import type { SearchableFieldOption } from "./searchable-field-option"
import { useReactSelectSearchableField } from "./use-react-select-searchable-field"

import { cn } from "@/lib/utils"
import { useJobOrderDynamicLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

type FieldOption = SearchableFieldOption

export default function DynamicJobOrderAutocomplete<
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
  onChangeEvent?: (selectedOption: IJobOrderLookup | null) => void
}) {
  const [query, setQuery] = useState("")
  const [selectedJobOrder, setSelectedJobOrder] =
    useState<IJobOrderLookup | null>(null)
  const [justSelected, setJustSelected] = useState(false)

  // Determine job order no field from id
  const jobOrderNoField =
    form && name ? (`${name.toString().replace("Id", "No")}` as Path<T>) : null
  const currentJobOrderNo = jobOrderNoField
    ? String(form.getValues(jobOrderNoField) || "")
    : ""

  // Use job order no for edit mode prefill, otherwise query from typing
  // Don't make API call if user just selected (to prevent clearing)
  const searchString = justSelected
    ? undefined
    : currentJobOrderNo && !query
      ? currentJobOrderNo
      : query || undefined

  const {
    data: jobOrders = [],
    isLoading,
    refetch,
  } = useJobOrderDynamicLookup({
    searchString,
  })

  // Use job orders from dynamic lookup
  const displayJobOrders = jobOrders

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing job orders:", error)
    }
  }, [refetch])

  // Memoize options to prevent unnecessary recalculations
  const baseOptions: FieldOption[] = React.useMemo(
    () =>
      displayJobOrders.map((jobOrder: IJobOrderLookup) => ({
        value: jobOrder.jobOrderId.toString(),
        label: jobOrder.jobOrderNo,
      })),
    [displayJobOrders]
  )

  const watchedValue = form && name ? form.watch(name) : null

  const selectedOptionId =
    form && name && watchedValue && watchedValue !== 0
      ? watchedValue.toString()
      : null

  const handleChangeRef = React.useRef<
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => void
  >(() => {})

  const {
    options: searchableOptions,
    SearchableOption,
    selectControlRef,
    handleSearchableKeyDown,
    handleInputChange: handleSearchInputChange,
    wrapOnChange,
    markOptionSelected,
    searchableSelectProps,
  } = useReactSelectSearchableField({
    baseOptions,
    selectedOptionId,
    onTabSelectOption: (option) =>
      handleChangeRef.current(option as SingleValue<FieldOption>),
  })

  // Ensure the currently selected job order is present in options
  const mergedOptions: FieldOption[] = React.useMemo(() => {
    if (selectedJobOrder) {
      const exists = searchableOptions.some(
        (o) => o.value === selectedJobOrder.jobOrderId.toString()
      )
      if (!exists) {
        return [
          {
            value: selectedJobOrder.jobOrderId.toString(),
            label: selectedJobOrder.jobOrderNo,
          },
          ...searchableOptions,
        ]
      }
    }
    return searchableOptions
  }, [searchableOptions, selectedJobOrder])

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


  const selectClassNames = React.useMemo(
    () => ({
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
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1 pl-2 pr-8 text-xs outline-none"
        ),
      noOptionsMessage: () => cn("text-muted-foreground py-1.5 px-2 text-xs"),
      placeholder: () => cn("text-muted-foreground"),
      singleValue: () => cn("text-foreground"), // Fixed to match menu list
      valueContainer: () => cn("px-0 py-0.5 gap-1"),
      input: () =>
        cn("text-foreground placeholder:text-muted-foreground m-0 p-0"),
      indicatorsContainer: () => cn("flex gap-0.5"), // Reduced gap between indicators
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

const handleChange = wrapOnChange(
    React.useCallback(
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
      const selectedOption = Array.isArray(option) ? option[0] : option
      // Mark that an option was selected (not just cleared)
      markOptionSelected(!!selectedOption)

      // Don't clear query on selection - keep it for better UX
      // Query will be cleared when user starts typing again
      setJustSelected(true)

      if (form && name) {
        // Set the jobOrderId value
        const value = selectedOption ? Number(selectedOption.value) : 0
        form.setValue(name, value as PathValue<T, Path<T>>)

        // Also set the jobOrderNo field
        if (selectedOption) {
          const jo = displayJobOrders.find(
            (u: IJobOrderLookup) =>
              u.jobOrderId.toString() === selectedOption.value
          )
          if (jo && jobOrderNoField) {
            form.setValue(
              jobOrderNoField,
              jo.jobOrderNo as PathValue<T, Path<T>>
            )
          }
        } else if (jobOrderNoField) {
          // Clear jobOrderNo when no option selected
          form.setValue(jobOrderNoField, "" as PathValue<T, Path<T>>)
        }
      }
      if (onChangeEvent) {
        const selectedJobOrder = selectedOption
          ? displayJobOrders.find(
              (u: IJobOrderLookup) =>
                u.jobOrderId.toString() === selectedOption.value
            ) || null
          : null
        onChangeEvent(selectedJobOrder)
      }
      // Persist the selected job order locally so it remains visible
      if (selectedOption) {
        const jo = displayJobOrders.find(
          (u: IJobOrderLookup) =>
            u.jobOrderId.toString() === selectedOption.value
        )
        if (jo) {
          setSelectedJobOrder(jo)
        }
      } else {
        // Clear selected job order when option is cleared
        setSelectedJobOrder(null)
      }
    },
    [form, name, onChangeEvent, displayJobOrders, jobOrderNoField, markOptionSelected]
    )
  )

  handleChangeRef.current = handleChange
  // Handle input change for search
  const handleInputChange = useCallback(
    (inputValue: string, actionMeta: { action: string }) => {
      // If user just selected and input is being cleared, don't clear the query
      if (justSelected && inputValue === "") {
        return // Don't clear query, don't reset justSelected yet
      }

      // Reset justSelected flag when user starts typing
      if (justSelected) {
        setJustSelected(false)
      }

      setQuery(inputValue)
      handleSearchInputChange(inputValue, actionMeta)
    },
    [justSelected, handleSearchInputChange]
  )

  // Memoize getValue to prevent unnecessary recalculations
  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      // Convert form value to string for comparison
      const fromOptions = mergedOptions.find(
        (option) => option.value === formValue?.toString()
      )
      return fromOptions || null
    }
    return null
  }, [form, name, mergedOptions])


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
              title="Refresh job orders"
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
                <div ref={selectControlRef} onKeyDown={handleSearchableKeyDown}>
                  <Select
                    {...searchableSelectProps}
                    onInputChange={handleInputChange}
                    options={mergedOptions}
                    value={getValue()}
                    onChange={handleChange}
                    onKeyDown={handleSearchableKeyDown}
                    placeholder="Select JobOrder..."
                    isDisabled={isDisabled || isLoading}
                    isClearable={true}
                    isSearchable={true}
                    styles={customStyles}
                    classNames={selectClassNames}
                    components={{
                      DropdownIndicator,
                      ClearIndicator,
                      Option: SearchableOption,
                    }}
                    className="react-select-container"
                    classNamePrefix="react-select__"
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    isLoading={isLoading}
                    loadingMessage={() => "Loading jobOrders..."}
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
            title="Refresh job orders"
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
      <div ref={selectControlRef} onKeyDown={handleSearchableKeyDown}>
        <Select
          {...searchableSelectProps}
                    onInputChange={handleInputChange}
          options={mergedOptions}
          onChange={handleChange}
          onKeyDown={handleSearchableKeyDown}
          placeholder="Select JobOrder..."
          isDisabled={isDisabled || isLoading}
          isClearable={true}
          isSearchable={true}
          styles={customStyles}
          classNames={selectClassNames}
          components={{
            DropdownIndicator,
            ClearIndicator,
            Option: SearchableOption,
          }}
          className="react-select-container"
          classNamePrefix="react-select__"
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          isLoading={isLoading}
          loadingMessage={() => "Loading jobOrders..."}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
