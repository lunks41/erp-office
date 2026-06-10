"use client"

import React, { useCallback, useState } from "react"
import { ITallyServiceLookup } from "@/interfaces/lookup"
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
  components,
} from "react-select"
import type { SearchableFieldOption } from "./searchable-field-option"
import { useReactSelectSearchableField } from "./use-react-select-searchable-field"
import {
  createSearchableSelectClassNames,
  searchableSelectWrapStyles,
} from "./react-select-searchable-styles"

import { cn } from "@/lib/utils"
import { useTallyServiceDynamicLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

type FieldOption = SearchableFieldOption

export default function DynamicTallyServiceAutocomplete<
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
  onChangeEvent?: (selectedOption: ITallyServiceLookup | null) => void
}) {
  const [query, setQuery] = useState("")
  const [selectedJobOrder, setSelectedJobOrder] =
    useState<ITallyServiceLookup | null>(null)
  const [justSelected, setJustSelected] = useState(false)

  // Determine tally service no field from id
  const tallyServiceNoField =
    form && name ? (`${name.toString().replace("Id", "No")}` as Path<T>) : null
  const currenttallyServiceNo = tallyServiceNoField
    ? String(form.getValues(tallyServiceNoField) || "")
    : ""

  // Use tally service no for edit mode prefill, otherwise query from typing
  // Don't make API call if user just selected (to prevent clearing)
  const searchString = justSelected
    ? undefined
    : currenttallyServiceNo && !query
      ? currenttallyServiceNo
      : query || undefined

  const {
    data: tallyServices = [],
    isLoading,
    refetch,
  } = useTallyServiceDynamicLookup({
    searchString,
  })

  // Use tally services from dynamic lookup
  const displaytallyServices = tallyServices

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing tally services:", error)
    }
  }, [refetch])

  // Memoize options to prevent unnecessary recalculations
  const baseOptions: FieldOption[] = React.useMemo(
    () =>
      displaytallyServices.map((jobOrder: ITallyServiceLookup) => ({
        value: jobOrder.tallyServiceId.toString(),
        label: jobOrder.tallyServiceNo,
      })),
    [displaytallyServices]
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

  // Ensure the currently selected tally service is present in options
  const mergedOptions: FieldOption[] = React.useMemo(() => {
    if (selectedJobOrder) {
      const exists = searchableOptions.some(
        (o) => o.value === selectedJobOrder.tallyServiceId.toString()
      )
      if (!exists) {
        return [
          {
            value: selectedJobOrder.tallyServiceId.toString(),
            label: selectedJobOrder.tallyServiceNo,
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
    () => createSearchableSelectClassNames(isRequired),
    [isRequired]
  )

  // We still need some styles for things that can't be controlled via className
  const customStyles = searchableSelectWrapStyles


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
        // Set the tallyServiceId value
        const value = selectedOption ? Number(selectedOption.value) : 0
        form.setValue(name, value as PathValue<T, Path<T>>)

        // Also set the tallyServiceNo field
        if (selectedOption) {
          const jo = displaytallyServices.find(
            (u: ITallyServiceLookup) =>
              u.tallyServiceId.toString() === selectedOption.value
          )
          if (jo && tallyServiceNoField) {
            form.setValue(
              tallyServiceNoField,
              jo.tallyServiceNo as PathValue<T, Path<T>>
            )
          }
        } else if (tallyServiceNoField) {
          // Clear tallyServiceNo when no option selected
          form.setValue(tallyServiceNoField, "" as PathValue<T, Path<T>>)
        }
      }
      if (onChangeEvent) {
        const selectedJobOrder = selectedOption
          ? displaytallyServices.find(
              (u: ITallyServiceLookup) =>
                u.tallyServiceId.toString() === selectedOption.value
            ) || null
          : null
        onChangeEvent(selectedJobOrder)
      }
      // Persist the selected tally service locally so it remains visible
      if (selectedOption) {
        const jo = displaytallyServices.find(
          (u: ITallyServiceLookup) =>
            u.tallyServiceId.toString() === selectedOption.value
        )
        if (jo) {
          setSelectedJobOrder(jo)
        }
      } else {
        // Clear selected tally service when option is cleared
        setSelectedJobOrder(null)
      }
    },
    [form, name, onChangeEvent, displaytallyServices, tallyServiceNoField, markOptionSelected]
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
              title="Refresh tally services"
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
                    loadingMessage={() => "Loading tallyServices..."}
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
            title="Refresh tally services"
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
          loadingMessage={() => "Loading tallyServices..."}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
