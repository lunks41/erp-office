"use client"

import React from "react"
import { IBankAddress } from "@/interfaces/bank"
import { ICustomerAddress } from "@/interfaces/customer"
import { ISupplierAddress } from "@/interfaces/supplier"
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
import {
  useBankAddressLookup,
  useCustomerAddressLookup,
  useSupplierAddressLookup,
} from "@/hooks/use-lookup"
import { FormField, FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"

type FieldOption = SearchableFieldOption

// Union type for all address interfaces
type AddressType = ICustomerAddress | ISupplierAddress | IBankAddress

// Entity types enum
export enum EntityType {
  CUSTOMER = "customer",
  SUPPLIER = "supplier",
  BANK = "bank",
}

interface DynamicAddressAutocompleteProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  entityId: number
  entityType: EntityType
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOption: AddressType | null) => void
}

export default function DynamicAddressAutocomplete<
  T extends Record<string, unknown>,
>({
  form,
  label,
  name,
  entityId,
  entityType,
  isDisabled = false,
  className,
  isRequired = false,
  onChangeEvent,
}: DynamicAddressAutocompleteProps<T>) {
  // Use the appropriate hook based on entity type
  const customerAddressData = useCustomerAddressLookup(
    entityType === EntityType.CUSTOMER ? entityId : 0
  )
  const supplierAddressData = useSupplierAddressLookup(
    entityType === EntityType.SUPPLIER ? entityId : 0
  )
  const bankAddressData = useBankAddressLookup(
    entityType === EntityType.BANK ? entityId : 0
  )

  // Get the appropriate data and refetch based on entity type
  const {
    data: addresses = [],
    isLoading,
    refetch,
  } = React.useMemo(() => {
    switch (entityType) {
      case EntityType.CUSTOMER:
        return customerAddressData
      case EntityType.SUPPLIER:
        return supplierAddressData
      case EntityType.BANK:
        return bankAddressData
      default:
        return { data: [], isLoading: false, refetch: async () => ({}) }
    }
  }, [entityType, customerAddressData, supplierAddressData, bankAddressData])

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing addresses:", error)
    }
  }, [refetch])

  // Memoize options to prevent unnecessary recalculations
  const baseOptions: FieldOption[] = React.useMemo(
    () =>
      addresses.map((address: AddressType) => ({
        value: address.addressId.toString(),
        label:
          address.billName +
          " - " +
          address.address1 +
          " - " +
          address.address2,
      })),
    [addresses]
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

  const customStyles = searchableSelectWrapStyles


const handleChange = wrapOnChange(
    React.useCallback(
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
      const selectedOption = Array.isArray(option) ? option[0] : option
      // Mark that an option was selected (not just cleared)
      markOptionSelected(!!selectedOption)

      if (form && name) {
        const value = selectedOption ? Number(selectedOption.value) : 0
        form.setValue(name, value as PathValue<T, Path<T>>)
      }
      if (onChangeEvent) {
        const selectedAddress = selectedOption
          ? addresses.find(
              (u: AddressType) =>
                u.addressId.toString() === selectedOption.value
            ) || null
          : null
        onChangeEvent(selectedAddress)
      }
    },
    [form, name, onChangeEvent, addresses, markOptionSelected]
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


  const getPlaceholder = () => {
    switch (entityType) {
      case EntityType.CUSTOMER:
        return "Select Customer Address..."
      case EntityType.SUPPLIER:
        return "Select Supplier Address..."
      case EntityType.BANK:
        return "Select Bank Address..."
      default:
        return "Select Address..."
    }
  }

  const getLoadingMessage = () => {
    switch (entityType) {
      case EntityType.CUSTOMER:
        return "Loading customer addresses..."
      case EntityType.SUPPLIER:
        return "Loading supplier addresses..."
      case EntityType.BANK:
        return "Loading bank addresses..."
      default:
        return "Loading addresses..."
    }
  }

  if (form && name) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        <div className="flex items-center gap-1">
          {label && (
            <Label
              htmlFor={name}
              className={cn(
                "text-xs font-medium",
                isRequired && "text-red-500"
              )}
            >
              {label}
              {isRequired && <span className="ml-1 text-red-500">*</span>}
            </Label>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            tabIndex={-1}
            className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
            title="Refresh addresses"
          >
            <IconRefresh
              size={12}
              className={`text-muted-foreground hover:text-foreground transition-colors ${
                isLoading ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
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

                    onKeyDown={handleSearchableKeyDown}
                    placeholder={getPlaceholder()}
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
                    loadingMessage={() => getLoadingMessage()}
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
      <div className="flex items-center gap-1">
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
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          tabIndex={-1}
          className="hover:bg-accent flex items-center justify-center rounded-sm p-0.5 transition-colors disabled:opacity-50"
          title="Refresh addresses"
        >
          <IconRefresh
            size={12}
            className={`text-muted-foreground hover:text-foreground transition-colors ${
              isLoading ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
      <div ref={selectControlRef} onKeyDown={handleSearchableKeyDown}>
        <Select
                    {...searchableSelectProps}
                              onChange={handleChange}

          onKeyDown={handleSearchableKeyDown}
          placeholder={getPlaceholder()}
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
          loadingMessage={() => getLoadingMessage()}
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
