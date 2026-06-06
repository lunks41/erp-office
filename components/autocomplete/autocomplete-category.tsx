"use client"

import React from "react"
import { ICategoryLookup } from "@/interfaces/lookup"
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
import { useCategoryLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

type FieldOption = SearchableFieldOption

interface CategoryAutocompleteProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOption: ICategoryLookup | null) => void
  nextFieldName?: Path<T>
}

export default function CategoryAutocomplete<
  T extends Record<string, unknown>,
>({
  form,
  label,
  name,
  isDisabled = false,
  className,
  isRequired = false,
  onChangeEvent,
  nextFieldName,
}: CategoryAutocompleteProps<T>) {
  const { data: categorys = [], isLoading } = useCategoryLookup()

  const baseOptions: FieldOption[] = React.useMemo(
    () =>
      categorys.map((category: ICategoryLookup) => ({
        value: category.categoryId.toString(),
        label: category.categoryName,
      })),
    [categorys]
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
    options,
    SearchableOption,
    selectControlRef,
    handleSearchableKeyDown,
    wrapOnChange,
    markOptionSelected,
    resolveTabSelectMatch,
    searchableSelectProps,
  } = useReactSelectSearchableField({
    baseOptions,
    selectedOptionId,
    onTabSelectOption: (option) =>
      handleChangeRef.current(option as SingleValue<FieldOption>),
  })

  const handleCategoryKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Tab" && nextFieldName && !event.shiftKey) {
        const container =
          selectControlRef.current ?? (event.currentTarget as HTMLElement)
        const input = container?.querySelector("input") as HTMLInputElement | null
        const typed = input?.value?.trim() ?? ""

        if (typed) {
          const matched = resolveTabSelectMatch(typed, container)
          if (matched && matched.value !== selectedOptionId) {
            handleChangeRef.current(matched as SingleValue<FieldOption>)
            return
          }
        }

        event.preventDefault()
        form.setFocus(nextFieldName)
        return
      }

      handleSearchableKeyDown(event)
    },
    [
      nextFieldName,
      form,
      resolveTabSelectMatch,
      selectedOptionId,
      handleSearchableKeyDown,
      selectControlRef,
    ]
  )

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

  const customStyles = searchableSelectWrapStyles

  const handleChange = wrapOnChange(
    React.useCallback(
      (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
        const selectedOption = Array.isArray(option) ? option[0] : option
        markOptionSelected(!!selectedOption)

        if (form && name) {
          const value = selectedOption ? Number(selectedOption.value) : 0
          form.setValue(name, value as PathValue<T, Path<T>>)
        }
        if (onChangeEvent) {
          const selectedCategory = selectedOption
            ? categorys.find(
                (u: ICategoryLookup) =>
                  u.categoryId.toString() === selectedOption.value
              ) || null
            : null
          onChangeEvent(selectedCategory)
        }
      },
      [form, name, onChangeEvent, categorys, markOptionSelected]
    )
  )

  handleChangeRef.current = handleChange

  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      return (
        options.find((option) => option.value === formValue?.toString()) || null
      )
    }
    return null
  }, [form, name, options])

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
                <div ref={selectControlRef} onKeyDown={handleCategoryKeyDown}>
                  <Select
                    {...searchableSelectProps}
                    value={getValue()}
                    onChange={handleChange}
                    onKeyDown={handleCategoryKeyDown}
                    placeholder="Select Category..."
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
                    loadingMessage={() => "Loading categories..."}
                    tabIndex={0}
                    blurInputOnSelect={true}
                    instanceId={name || "category-select"}
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
      <div ref={selectControlRef} onKeyDown={handleCategoryKeyDown}>
        <Select
          {...searchableSelectProps}
          onChange={handleChange}
          onKeyDown={handleCategoryKeyDown}
          placeholder="Select Category..."
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
          loadingMessage={() => "Loading categories..."}
          tabIndex={0}
          blurInputOnSelect={true}
          instanceId={name || "category-select"}
        />
      </div>
    </div>
  )
}
