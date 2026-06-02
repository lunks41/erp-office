"use client"

import React from "react"
import { IChartOfAccountLookup } from "@/interfaces/lookup"
import { IconChevronDown, IconRefresh, IconX } from "@tabler/icons-react"
import { Path, PathValue, UseFormReturn } from "react-hook-form"
import Select, {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  MenuListProps,
  MultiValue,
  SingleValue,
  components,
} from "react-select"

import { cn } from "@/lib/utils"
import {
  createMultiSelectStyles,
  getMultiSelectClassNames,
  MultiSelectCheckboxOption,
  type MultiSelectFieldOption,
} from "@/components/react-select-multiselect-theme"
import { useChartOfAccountLookup } from "@/hooks/use-lookup"
import { useMultiSelectSearchFilter } from "@/hooks/use-multi-select-search-filter"
import { FormField, FormItem } from "@/components/ui/form"
import { Label } from "@/components/ui/label"

type FieldOption = MultiSelectFieldOption

const selectClassNames = getMultiSelectClassNames()

type ScrollAwareSelectProps = {
  scrollToValueAfterSelect?: string | null
  clearScrollToValue?: () => void
}

function ScrollAwareMenuList(props: MenuListProps<FieldOption, true>) {
  const { innerRef, children, selectProps } = props
  const { scrollToValueAfterSelect, clearScrollToValue } =
    selectProps as typeof selectProps & ScrollAwareSelectProps
  const optsRef = React.useRef<FieldOption[]>([])
  optsRef.current = Array.isArray(selectProps.options)
    ? [...selectProps.options]
    : []

  React.useEffect(() => {
    if (!scrollToValueAfterSelect || !innerRef || typeof innerRef === "function")
      return
    const el = (innerRef as React.RefObject<HTMLDivElement>)?.current
    if (!el?.children?.length) return

    const index = optsRef.current.findIndex(
      (o) => o.value === scrollToValueAfterSelect
    )
    if (index < 0) return

    const nextIndex = Math.min(index + 1, el.children.length - 1)
    const child = el.children[nextIndex] as HTMLElement
    child?.scrollIntoView?.({ block: "nearest", behavior: "smooth" })
    clearScrollToValue?.()
  }, [scrollToValueAfterSelect, innerRef, clearScrollToValue])

  return <components.MenuList {...props}>{children}</components.MenuList>
}

export default function ChartOfAccountMultiSelect<
  T extends Record<string, unknown>,
>({
  form,
  label,
  name,
  isDisabled = false,
  className,
  isRequired = false,
  onChangeEvent,
  companyId = 0,
}: {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOptions: IChartOfAccountLookup[]) => void
  companyId?: number
}) {
  const {
    data: chartOfAccounts = [],
    isLoading,
    refetch,
  } = useChartOfAccountLookup(companyId || 0)

  // Handle refresh with animation
  const handleRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (error) {
      console.error("Error refreshing chart of accounts:", error)
    }
  }, [refetch])

  // Memoize options to prevent unnecessary recalculations
  const options: FieldOption[] = React.useMemo(
    () =>
      chartOfAccounts.map((account: IChartOfAccountLookup) => ({
        value: account.glId.toString(),
        label: account.glCode + " - " + account.glName,
      })),
    [chartOfAccounts]
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

  const selectControlRef = React.useRef<HTMLDivElement>(null)
  const [menuWidth, setMenuWidth] = React.useState<number | undefined>(undefined)

  const customStyles = React.useMemo(
    () => createMultiSelectStyles(menuWidth),
    [menuWidth]
  )

  const handleMenuOpen = React.useCallback(() => {
    if (selectControlRef.current) {
      setMenuWidth(selectControlRef.current.getBoundingClientRect().width)
    }
  }, [])

  const [scrollToValueAfterSelect, setScrollToValueAfterSelect] =
    React.useState<string | null>(null)

  const {
    filterInput,
    handleInputChange,
    clearInputAfterSelect,
    resetSearchFilter,
    filterOption,
  } = useMultiSelectSearchFilter()

  // Memoize handleChange to handle comma-separated string storage
  const handleChange = React.useCallback(
    (option: SingleValue<FieldOption> | MultiValue<FieldOption>) => {
      const selectedOptions = Array.isArray(option)
        ? option
        : option
          ? [option]
          : []
      isOptionSelectedRef.current = selectedOptions.length > 0

      if (selectedOptions.length > 0) {
        clearInputAfterSelect()
      } else {
        resetSearchFilter()
      }

      // Scroll menu to show next code after selected (so list doesn't reset to top)
      if (selectedOptions.length > 0) {
        const lastSelected = selectedOptions[selectedOptions.length - 1]
        setScrollToValueAfterSelect(lastSelected.value)
      }

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
        const selectedAccounts = selectedOptions
          .map((opt) =>
            chartOfAccounts.find(
              (u: IChartOfAccountLookup) => u.glId.toString() === opt.value
            )
          )
          .filter(
            (account): account is IChartOfAccountLookup => account !== undefined
          )
        onChangeEvent(selectedAccounts)
      }
    },
    [
      form,
      name,
      onChangeEvent,
      chartOfAccounts,
      clearInputAfterSelect,
      resetSearchFilter,
    ]
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

  const isTabPressedRef = React.useRef(false)
  const isOptionSelectedRef = React.useRef(false)

  const handleMenuClose = React.useCallback(() => {
    resetSearchFilter()

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
  }, [resetSearchFilter])

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
          render={({ field: _field, fieldState: { error } }) => {
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
                      title="Refresh chart of accounts"
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
                    onMenuOpen={handleMenuOpen}
                    onMenuClose={handleMenuClose}
                    value={getValue()}
                    inputValue={filterInput}
                    onInputChange={handleInputChange}
                    filterOption={filterOption}
                    placeholder="Select Chart of Account..."
                    isDisabled={isDisabled || isLoading}
                    isClearable={true}
                    isSearchable={true}
                    styles={customStyles}
                    classNames={selectClassNames}
                    components={{
                      DropdownIndicator,
                      ClearIndicator,
                      Option: MultiSelectCheckboxOption,
                      MenuList: ScrollAwareMenuList,
                    }}
                    {...({
                      scrollToValueAfterSelect,
                      clearScrollToValue: () =>
                        setScrollToValueAfterSelect(null),
                    } as Record<string, unknown>)}
                    className="react-select-container"
                    classNamePrefix="react-select__"
                    menuPortalTarget={
                      typeof document !== "undefined" ? document.body : null
                    }
                    menuPosition="fixed"
                    isLoading={isLoading}
                    loadingMessage={() => "Loading chart of accounts..."}
                    closeMenuOnSelect={false}
                    blurInputOnSelect={false}
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
            title="Refresh chart of accounts"
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
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
          value={getValue()}
          inputValue={filterInput}
          onInputChange={handleInputChange}
          filterOption={filterOption}
          placeholder="Select Chart of Account..."
          isDisabled={isDisabled || isLoading}
          isClearable={true}
          isSearchable={true}
          styles={customStyles}
          classNames={selectClassNames}
          components={{
            DropdownIndicator,
            ClearIndicator,
            Option: MultiSelectCheckboxOption,
            MenuList: ScrollAwareMenuList,
          }}
          {...({
            scrollToValueAfterSelect,
            clearScrollToValue: () => setScrollToValueAfterSelect(null),
          } as Record<string, unknown>)}
          className="react-select-container"
          classNamePrefix="react-select__"
          menuPortalTarget={
            typeof document !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          isLoading={isLoading}
          loadingMessage={() => "Loading chart of accounts..."}
          closeMenuOnSelect={false}
          blurInputOnSelect={false}
        />
      </div>
    </div>
  )
}
