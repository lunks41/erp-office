"use client"

import React from "react"
import { IconChevronDown, IconX } from "@tabler/icons-react"
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

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

type FieldOption = SearchableFieldOption

// File type options - PDF and Image formats only
const fileTypeOptions: FieldOption[] = [
  { value: "PDF", label: "PDF Document (.pdf)" },
  { value: "JPEG", label: "JPEG Image (.jpeg)" },
  { value: "PNG", label: "PNG Image (.png)" },
  { value: "JPG", label: "JPG Image (.jpg)" },
]

export default function FileTypeAutocomplete<
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
  onChangeEvent?: (selectedOption: string | null) => void
}) {
  const baseOptions = fileTypeOptions

  const watchedValue = form && name ? form.watch(name) : null

  const selectedOptionId =
    form && name && watchedValue && watchedValue !== 0
      ? watchedValue.toString()
      : null

  const handleChangeRef = React.useRef<
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => void
  >(() => {})

  const {
    SearchableOption,
    selectControlRef,
    handleSearchableKeyDown,
    wrapOnChange,
    markOptionSelected,
    searchableSelectProps,
  } = useReactSelectSearchableField({
    baseOptions,
    selectedOptionId,
    onTabSelectOption: (option) =>
      handleChangeRef.current(option as SingleValue<FieldOption>),
  })


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


  // Custom classNames for React Select (aligned with shadcn select.tsx)
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

      if (form && name) {
        // Set the value as a string
        const value = selectedOption ? selectedOption.value : ""
        form.setValue(name, value as PathValue<T, Path<T>>)
      }
      if (onChangeEvent) {
        onChangeEvent(selectedOption ? selectedOption.value : null)
      }
    },
    [form, name, onChangeEvent, markOptionSelected]
    )
  )

  handleChangeRef.current = handleChange
  // Memoize getValue to prevent unnecessary recalculations
  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      return (
        fileTypeOptions.find((option) => option.value === formValue) || null
      )
    }
    return null
  }, [form, name])


  if (form && name) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        {label && (
          <Label
            htmlFor={name}
            className={cn("text-xs font-medium", isRequired && "text-red-500")}
          >
            {label}
            {isRequired && <span className="ml-1 text-red-500">*</span>}
          </Label>
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
                    options={fileTypeOptions}
                    value={getValue()}
                    onChange={handleChange}
                    onKeyDown={handleSearchableKeyDown}
                    placeholder="Select File Type..."
                    isDisabled={isDisabled}
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
        <div
          className={cn(
            "text-xs font-medium",
            isDisabled && "text-muted-foreground opacity-70"
          )}
        >
          {label}
          {isRequired && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
        </div>
      )}
      <div ref={selectControlRef} onKeyDown={handleSearchableKeyDown}>
        <Select
          {...searchableSelectProps}
          options={fileTypeOptions}
          onChange={handleChange}
          onKeyDown={handleSearchableKeyDown}
          placeholder="Select File Type..."
          isDisabled={isDisabled}
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
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
