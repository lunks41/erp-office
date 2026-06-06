"use client"

import React from "react"
import { IChargeLookup } from "@/interfaces/lookup"
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
import { useTransportChargeLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

type FieldOption = SearchableFieldOption

export default function TransportChargeAutocomplete<
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
  onChangeEvent?: (selectedOption: IChargeLookup | null) => void
}) {
  const {
    data: allTransportCharges = [],
    isLoading: isLoadingAll,
    refetch,
  } = useTransportChargeLookup()

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing charges:", error)
    }
  }, [refetch])

  // Memoize base options to prevent unnecessary recalculations
  const baseOptions: FieldOption[] = React.useMemo(
    () =>
      allTransportCharges.map((charge: IChargeLookup) => ({
        value: charge.chargeId.toString(),
        label: charge.chargeName,
      })),
    [allTransportCharges]
  )

  // Watch form value to make it reactive
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
    resetOnMenuOpen,
    shouldSkipMenuOpenScroll,
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
        // Set the value as a number
        const value = selectedOption ? Number(selectedOption.value) : 0
        form.setValue(name, value as PathValue<T, Path<T>>)
      }
      if (onChangeEvent) {
        const selectedCharge = selectedOption
          ? allTransportCharges.find(
              (u: IChargeLookup) =>
                u.chargeId.toString() === selectedOption.value
            ) || null
          : null
        onChangeEvent(selectedCharge)
      }
    },
    [form, name, onChangeEvent, allTransportCharges, markOptionSelected]
    )
  )

  handleChangeRef.current = handleChange
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


  // Handle menu open to scroll to selected option
  const handleMenuOpen = React.useCallback(() => {
    // Reset the option selected flag when menu opens
    resetOnMenuOpen()

    if (shouldSkipMenuOpenScroll) {
      return
    }

    // Use setTimeout to ensure the menu is fully rendered
    setTimeout(() => {
      const selectedValue = form && name ? form.getValues(name) : null
      if (selectedValue) {
        // Try multiple selectors to find the menu
        const selectors = [
          `[id*="${name || "charge-select"}"] .react-select__menu-list`,
          ".react-select__menu-list",
          '[class*="react-select__menu-list"]',
        ]

        let menuList: HTMLElement | null = null
        for (const selector of selectors) {
          menuList = document.querySelector(selector) as HTMLElement
          if (menuList) break
        }

        if (menuList) {
          const selectedOption = menuList.querySelector(
            '.react-select__option[aria-selected="true"]'
          ) as HTMLElement
          if (selectedOption) {
            // Scroll the selected option to the top of the visible area
            menuList.scrollTop = selectedOption.offsetTop - menuList.offsetTop
          }
        }
      }
    }, 150)
  }, [form, name, resetOnMenuOpen, shouldSkipMenuOpenScroll])

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
              disabled={isLoadingAll}
              tabIndex={-1}
              className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
              title="Refresh charges"
            >
              <IconRefresh
                size={12}
                className={`text-muted-foreground hover:text-foreground transition-colors ${
                  isLoadingAll ? "animate-spin" : ""
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
                                        value={getValue()}
                    onChange={handleChange}
                    onMenuOpen={handleMenuOpen}

                    onKeyDown={handleSearchableKeyDown}
                    placeholder="Select Charge..."
                    isDisabled={isDisabled || isLoadingAll}
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
                    menuShouldScrollIntoView={true}
                    isLoading={isLoadingAll}
                    loadingMessage={() => "Loading charges..."}
                    instanceId={name}
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
            disabled={isLoadingAll}
            tabIndex={-1}
            className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
            title="Refresh charges"
          >
            <IconRefresh
              size={12}
              className={`text-muted-foreground hover:text-foreground transition-colors ${
                isLoadingAll ? "animate-spin" : ""
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
                              onChange={handleChange}
          onMenuOpen={handleMenuOpen}

          onKeyDown={handleSearchableKeyDown}
          placeholder="Select Charge..."
          isDisabled={isDisabled || isLoadingAll}
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
          menuShouldScrollIntoView={true}
          isLoading={isLoadingAll}
          loadingMessage={() => "Loading charges..."}
          instanceId={name}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
