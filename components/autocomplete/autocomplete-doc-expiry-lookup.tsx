"use client"

import React from "react"
import {
  IDocExpiryDocumentCategoryLookup,
  IDocExpiryDocumentTypeLookup,
} from "@/interfaces/lookup"
import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react"
import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form"
import Select, {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  OptionProps,
  SingleValue,
  StylesConfig,
  components,
} from "react-select"

import { cn } from "@/lib/utils"
import {
  useDocExpiryDocumentCategoryLookup,
  useDocExpiryDocumentTypeLookup,
} from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

interface FieldOption {
  value: string
  label: string
}

type DocExpiryLookupKind = "documentType" | "documentCategory"

const FIELD_NAMES: Record<
  DocExpiryLookupKind,
  "documentTypeId" | "documentCategoryId"
> = {
  documentType: "documentTypeId",
  documentCategory: "documentCategoryId",
}

const PLACEHOLDERS: Record<DocExpiryLookupKind, string> = {
  documentType: "Select document type...",
  documentCategory: "Select category...",
}

const EMPTY_OPTION_VALUE = "__empty__"

const ALL_LABELS: Record<DocExpiryLookupKind, string> = {
  documentType: "All types",
  documentCategory: "All categories",
}

interface DocExpiryLookupAutocompleteProps<T extends FieldValues> {
  form: UseFormReturn<T>
  kind: DocExpiryLookupKind
  name?: Path<T>
  label?: string
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  optional?: boolean
  optionalLabel?: string
  onDocumentTypeChange?: (item: IDocExpiryDocumentTypeLookup | null) => void
}

function useLookupOptions(kind: DocExpiryLookupKind) {
  const types = useDocExpiryDocumentTypeLookup()
  const categories = useDocExpiryDocumentCategoryLookup()

  const query = kind === "documentType" ? types : categories

  const options: FieldOption[] = React.useMemo(() => {
    const rows = query.data ?? []
    if (kind === "documentType") {
      return (rows as IDocExpiryDocumentTypeLookup[]).map((r) => ({
        value: String(r.documentTypeId),
        label: `${r.documentTypeCode} - ${r.documentTypeName}`,
      }))
    }
    return (rows as IDocExpiryDocumentCategoryLookup[]).map((r) => ({
      value: String(r.documentCategoryId),
      label: `${r.documentCategoryCode} - ${r.documentCategoryName}`,
    }))
  }, [kind, query.data])

  return { options, isLoading: query.isLoading, types: types.data ?? [] }
}

function useDocExpirySelectUi(isRequired: boolean) {
  const DropdownIndicator = React.memo(
    (props: DropdownIndicatorProps<FieldOption>) => (
      <components.DropdownIndicator {...props} innerProps={{ ...props.innerProps, tabIndex: -1 }}>
        <IconChevronDown size={12} className="size-4 shrink-0 opacity-50" />
      </components.DropdownIndicator>
    )
  )
  DropdownIndicator.displayName = "DropdownIndicator"

  const ClearIndicator = React.memo((props: ClearIndicatorProps<FieldOption>) => (
    <components.ClearIndicator {...props} innerProps={{ ...props.innerProps, tabIndex: -1 }}>
      <IconX size={10} className="size-3 shrink-0" />
    </components.ClearIndicator>
  ))
  ClearIndicator.displayName = "ClearIndicator"

  const Option = React.memo((props: OptionProps<FieldOption>) => (
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
  ))
  Option.displayName = "Option"

  const selectClassNames = React.useMemo(
    () => ({
      control: (state: { isFocused: boolean; isDisabled: boolean }) =>
        cn(
          "border-gray-400 dark:border-gray-500 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent pl-2 pr-0 py-0.5 text-xs shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          state.isFocused ? "border-ring ring-ring/50 ring-[3px]" : "",
          state.isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          isRequired && !state.isDisabled && "bg-yellow-50 dark:bg-yellow-950/20",
          "h-7.5 min-h-7.5"
        ),
      menu: () =>
        cn(
          "bg-popover text-popover-foreground relative z-[9999] min-w-[8rem] overflow-hidden rounded-md border shadow-md mt-1"
        ),
      menuList: () => cn("p-1 overflow-auto"),
      option: (state: { isFocused: boolean; isSelected: boolean }) =>
        cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1 pl-2 pr-8 text-xs outline-none",
          state.isFocused && "bg-accent text-accent-foreground",
          state.isSelected && "bg-accent text-accent-foreground"
        ),
      placeholder: () => cn("text-muted-foreground"),
      singleValue: () => cn("text-foreground"),
      valueContainer: () => cn("px-0 py-0.5 gap-1"),
      input: () => cn("text-foreground m-0 p-0"),
      clearIndicator: () => cn("text-muted-foreground hover:text-foreground p-1 rounded-sm"),
      dropdownIndicator: () => cn("text-muted-foreground p-1 rounded-sm"),
    }),
    [isRequired]
  )

  const customStyles: StylesConfig<FieldOption, false> = React.useMemo(
    () => ({
      control: () => ({}),
      menu: () => ({}),
      option: () => ({}),
      indicatorSeparator: () => ({ display: "none" }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }),
    []
  )

  return {
    DropdownIndicator,
    ClearIndicator,
    Option,
    selectClassNames,
    customStyles,
  }
}

export function DocExpiryLookupAutocomplete<T extends FieldValues>({
  form,
  kind,
  name,
  label,
  className,
  isDisabled = false,
  isRequired = false,
  optional = false,
  optionalLabel,
  onDocumentTypeChange,
}: DocExpiryLookupAutocompleteProps<T>) {
  const fieldName = (name ?? FIELD_NAMES[kind]) as Path<T>
  const { options: baseOptions, isLoading, types } = useLookupOptions(kind)
  const watchedValue = form.watch(fieldName)
  const options = React.useMemo(() => {
    if (!optional) return baseOptions
    return [
      {
        value: EMPTY_OPTION_VALUE,
        label: optionalLabel ?? "All document types",
      },
      ...baseOptions,
    ]
  }, [baseOptions, optional, optionalLabel])

  const { DropdownIndicator, ClearIndicator, Option, selectClassNames, customStyles } =
    useDocExpirySelectUi(isRequired)

  const getValue = React.useCallback(() => {
    if (optional && (watchedValue == null || watchedValue === 0)) {
      return (
        options.find((o) => o.value === EMPTY_OPTION_VALUE) ?? null
      )
    }
    return options.find((o) => o.value === watchedValue?.toString()) ?? null
  }, [options, watchedValue, optional])

  const handleChange = React.useCallback(
    (option: SingleValue<FieldOption>) => {
      if (optional && (!option || option.value === EMPTY_OPTION_VALUE)) {
        form.setValue(fieldName, null as PathValue<T, Path<T>>)
        if (kind === "documentType" && onDocumentTypeChange) {
          onDocumentTypeChange(null)
        }
        return
      }
      const value = option ? Number(option.value) : 0
      form.setValue(fieldName, value as PathValue<T, Path<T>>)
      if (kind === "documentType" && onDocumentTypeChange) {
        const selected = option
          ? types.find((t) => t.documentTypeId === Number(option.value)) ?? null
          : null
        onDocumentTypeChange(selected)
      }
    },
    [form, fieldName, kind, onDocumentTypeChange, types, optional]
  )

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      {label && (
        <Label className={cn("text-xs font-medium", isRequired && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <FormField
        control={form.control}
        name={fieldName}
        render={({ fieldState }) => (
          <FormItem className="flex flex-col">
            <Select
              options={options}
              value={getValue()}
              onChange={handleChange}
              placeholder={PLACEHOLDERS[kind]}
              isDisabled={isDisabled || isLoading}
              isClearable
              isSearchable
              styles={customStyles}
              classNames={selectClassNames}
              components={{ DropdownIndicator, ClearIndicator, Option }}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
              isLoading={isLoading}
              instanceId={String(fieldName)}
            />
            {fieldState.error && (
              <p className="text-destructive mt-1 text-xs">{fieldState.error.message}</p>
            )}
          </FormItem>
        )}
      />
    </div>
  )
}

export function DocExpiryDocumentTypeAutocomplete<T extends FieldValues>(
  props: Omit<DocExpiryLookupAutocompleteProps<T>, "kind"> & {
    onChangeEvent?: (item: IDocExpiryDocumentTypeLookup | null) => void
  }
) {
  return (
    <DocExpiryLookupAutocomplete
      {...props}
      kind="documentType"
      onDocumentTypeChange={props.onChangeEvent}
    />
  )
}

export function DocExpiryDocumentCategoryAutocomplete<T extends FieldValues>(
  props: Omit<DocExpiryLookupAutocompleteProps<T>, "kind">
) {
  return <DocExpiryLookupAutocomplete {...props} kind="documentCategory" />
}

export function DocExpiryLookupFilterSelect({
  kind,
  value,
  onChange,
  allowAll = true,
  allLabel,
  className,
  isDisabled = false,
  placeholder,
}: {
  kind: DocExpiryLookupKind
  value: number | null
  onChange: (id: number | null) => void
  allowAll?: boolean
  allLabel?: string
  className?: string
  isDisabled?: boolean
  placeholder?: string
}) {
  const { options: baseOptions, isLoading } = useLookupOptions(kind)
  const { DropdownIndicator, ClearIndicator, Option, selectClassNames, customStyles } =
    useDocExpirySelectUi(false)

  const options = React.useMemo(() => {
    if (!allowAll) return baseOptions
    return [
      { value: EMPTY_OPTION_VALUE, label: allLabel ?? ALL_LABELS[kind] },
      ...baseOptions,
    ]
  }, [allowAll, allLabel, baseOptions, kind])

  const selected = React.useMemo(() => {
    if (allowAll && value == null) {
      return options.find((o) => o.value === EMPTY_OPTION_VALUE) ?? null
    }
    return options.find((o) => o.value === String(value)) ?? null
  }, [allowAll, options, value])

  return (
    <div className={cn("min-w-[180px]", className)}>
      <Select
        options={options}
        value={selected}
        onChange={(option: SingleValue<FieldOption>) => {
          if (!option || option.value === EMPTY_OPTION_VALUE) {
            onChange(null)
            return
          }
          onChange(Number(option.value))
        }}
        placeholder={placeholder ?? PLACEHOLDERS[kind]}
        isDisabled={isDisabled || isLoading}
        isClearable={!allowAll}
        isSearchable
        styles={customStyles}
        classNames={selectClassNames}
        components={{ DropdownIndicator, ClearIndicator, Option }}
        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
        menuPosition="fixed"
        isLoading={isLoading}
        instanceId={`doc-expiry-filter-${kind}`}
      />
    </div>
  )
}
