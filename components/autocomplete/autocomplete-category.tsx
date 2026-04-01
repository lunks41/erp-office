"use client"

import React from "react"
import { ICategoryLookup } from "@/interfaces/lookup"
import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react"
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
import { useCategoryLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

interface FieldOption {
  value: string
  label: string
}

interface CategoryAutocompleteProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOption: ICategoryLookup | null) => void
  nextFieldName?: Path<T> // Added to specify the next field to focus
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
  nextFieldName, // Destructured from props
}: CategoryAutocompleteProps<T>) {
  const { data: categorys = [], isLoading } = useCategoryLookup()

  // Memoize options to prevent unnecessary recalculations
  const options: FieldOption[] = React.useMemo(
    () =>
      categorys.map((category: ICategoryLookup) => ({
        value: category.categoryId.toString(),
        label: category.categoryName,
      })),
    [categorys]
  )

  // Handle Tab key press to focus the next field
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Tab" && nextFieldName) {
      event.preventDefault() // Prevent default Tab behavior
      form.setFocus(nextFieldName) // Focus the next field using react-hook-form
    }
  }

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
  Option.displayName = "Option"

  // Custom classNames for React Select (aligned with shadcn select.tsx)
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
      singleValue: () => cn("text-foreground"),
      valueContainer: () => cn("px-0 py-0.5 gap-1"),
      input: () =>
        cn("text-foreground placeholder:text-muted-foreground m-0 p-0"),
      indicatorsContainer: () => cn(""),
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

  // Custom styles for React Select
  const customStyles: StylesConfig<FieldOption, boolean> = React.useMemo(
    () => ({
      control: () => ({}),
      menu: () => ({}),
      option: () => ({}),
      indicatorSeparator: () => ({
        display: "none",
      }),
      valueContainer: (provided) => ({
        ...provided,
        padding: undefined,
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
      menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
        pointerEvents: "auto",
      }),
    }),
    []
  )

  // Handle selection change
  const handleChange = React.useCallback(
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
      const selectedOption = Array.isArray(option) ? option[0] : option
      if (form && name) {
        // Set the value as a number
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
    [form, name, onChangeEvent, categorys]
  )

  // Get current value from form
  const getValue = React.useCallback(() => {
    if (form && name) {
      const formValue = form.getValues(name)
      return options.find((option) => option.value === formValue) || null
    }
    return null
  }, [form, name, options])

  // Form-integrated version
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
                <Select
                  options={options}
                  value={getValue()}
                  onChange={handleChange}
                  placeholder="Select Category..."
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
                  loadingMessage={() => "Loading categories..."}
                  onKeyDown={handleKeyDown} // Attach the keydown handler
                  tabIndex={0}
                />
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
      <Select
        options={options}
        onChange={handleChange}
        placeholder="Select Category..."
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
        loadingMessage={() => "Loading categories..."}
        onKeyDown={handleKeyDown} // Attach the keydown handler
        tabIndex={0}
      />
    </div>
  )
}
