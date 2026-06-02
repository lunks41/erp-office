"use client"

import React from "react"
import { IPortRegionLookup } from "@/interfaces/lookup"
import { IconChevronDown, IconX } from "@tabler/icons-react"
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
import { usePortRegionLookup } from "@/hooks/use-lookup"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

type FieldOption = SearchableFieldOption

export default function PortRegionAutocomplete<
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
  onChangeEvent?: (selectedOption: IPortRegionLookup | null) => void
}) {
  const { data: portRegions = [], isLoading } = usePortRegionLookup()
  // Memoize options to prevent unnecessary recalculations
  const baseOptions: FieldOption[] = React.useMemo(
    () =>
      portRegions.map((portRegion: IPortRegionLookup) => ({
        value: portRegion.portRegionId.toString(),
        label: portRegion.portRegionName,
      })),
    [portRegions]
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
      menuList: () =>
        cn(
          "p-1 overflow-auto max-h-[200px]" // SCROLLBAR ISSUE FIX: Added max-height and overflow-auto for scrollable dropdown
        ),
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
      indicatorsContainer: () => cn(""), // Gap removed
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
      menu: (base) => ({
        ...base,
        zIndex: 9999,
        pointerEvents: "auto", // SCROLLBAR ISSUE FIX: Ensures mouse wheel events are captured
        // backgroundColor: "black", // SCROLLBAR ISSUE FIX: Added black background as requested
        // Ensure mouse wheel events work
        "&:hover": {
          pointerEvents: "auto",
        },
      }), // Handled by classNames
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
      // Enhanced menuList styles for better scrolling
      menuList: (base) => ({
        ...base,
        maxHeight: "200px", // SCROLLBAR ISSUE FIX: Sets explicit height for scrollable area
        overflowY: "auto", // SCROLLBAR ISSUE FIX: Enables vertical scrolling
        overflowX: "hidden", // SCROLLBAR ISSUE FIX: Prevents horizontal scrolling
        scrollbarWidth: "thin", // SCROLLBAR ISSUE FIX: Thin scrollbar for better UX
        scrollbarColor: "var(--border) transparent", // SCROLLBAR ISSUE FIX: Custom scrollbar colors
        // Ensure mouse wheel events work
        pointerEvents: "auto", // SCROLLBAR ISSUE FIX: Critical for mouse wheel event capture
        // Additional properties for better cross-browser support
        WebkitOverflowScrolling: "touch", // SCROLLBAR ISSUE FIX: Better scrolling on WebKit browsers
        "&::-webkit-scrollbar": {
          width: "6px", // SCROLLBAR ISSUE FIX: Custom scrollbar width
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent", // SCROLLBAR ISSUE FIX: Transparent track
        },
        "&::-webkit-scrollbar-thumb": {
          background: "var(--border)", // SCROLLBAR ISSUE FIX: Custom thumb color
          borderRadius: "3px", // SCROLLBAR ISSUE FIX: Rounded scrollbar
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: "var(--muted-foreground)", // SCROLLBAR ISSUE FIX: Hover effect
        },
        // Ensure mouse wheel events are captured
        "&:hover": {
          overflowY: "auto", // SCROLLBAR ISSUE FIX: Maintains scroll on hover
        },
      }),
      // Container style to ensure mouse wheel events work
      container: (base) => ({
        ...base,
        pointerEvents: "auto", // SCROLLBAR ISSUE FIX: Ensures container captures mouse events
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

      if (form && name) {
        // Set the value as a number
        const value = selectedOption ? Number(selectedOption.value) : 0
        form.setValue(name, value as PathValue<T, Path<T>>)
      }
      if (onChangeEvent) {
        const selectedPortRegion = selectedOption
          ? portRegions.find(
              (u: IPortRegionLookup) =>
                u.portRegionId.toString() === selectedOption.value
            ) || null
          : null
        onChangeEvent(selectedPortRegion)
      }
    },
    [form, name, onChangeEvent, portRegions, markOptionSelected]
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
                                        value={getValue()}
                    onChange={handleChange}
                    onKeyDown={handleSearchableKeyDown}
                    placeholder="Select PortRegion..."
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
                    menuPortalTarget={null} // SCROLLBAR ISSUE FIX: Changed from document.body to null for better event handling
                    menuPosition="absolute" // SCROLLBAR ISSUE FIX: Changed from "fixed" to "absolute" positioning
                    isLoading={isLoading}
                    loadingMessage={() => "Loading portRegions..."}
                    maxMenuHeight={200} // SCROLLBAR ISSUE FIX: Sets maximum height for scrollable dropdown
                    menuShouldScrollIntoView={true} // SCROLLBAR ISSUE FIX: Ensures selected items are visible
                    menuShouldBlockScroll={false} // SCROLLBAR ISSUE FIX: Prevents dropdown from blocking page scroll
                    closeMenuOnScroll={false} // SCROLLBAR ISSUE FIX: Prevents dropdown from closing when scrolling
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
                              onChange={handleChange}
          onKeyDown={handleSearchableKeyDown}
          placeholder="Select PortRegion..."
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
          menuPortalTarget={null} // SCROLLBAR ISSUE FIX: Changed from document.body to null for better event handling
          menuPosition="absolute" // SCROLLBAR ISSUE FIX: Changed from "fixed" to "absolute" positioning
          isLoading={isLoading}
          loadingMessage={() => "Loading portRegions..."}
          maxMenuHeight={200} // SCROLLBAR ISSUE FIX: Sets maximum height for scrollable dropdown
          menuShouldScrollIntoView={true} // SCROLLBAR ISSUE FIX: Ensures selected items are visible
          menuShouldBlockScroll={false} // SCROLLBAR ISSUE FIX: Prevents dropdown from blocking page scroll
          closeMenuOnScroll={false} // SCROLLBAR ISSUE FIX: Prevents dropdown from closing when scrolling
          blurInputOnSelect={true}
        />
      </div>
    </div>
  )
}
