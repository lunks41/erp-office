"use client"

import React from "react"
import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react"
import { Path, UseFormReturn } from "react-hook-form"
import Select, {
  ClearIndicatorProps,
  DropdownIndicatorProps,
  OptionProps,
  SingleValueProps,
  components,
} from "react-select"

import { cn } from "@/lib/utils"

import { FormField, FormItem } from "../ui/form"
import { Label } from "../ui/label"

interface AttendanceStatusOption {
  value: string
  label: string
  description: string
  color: string
}

interface AttendanceStatusAutocompleteProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name?: Path<T>
  label?: string
  className?: string
  isDisabled?: boolean
  isRequired?: boolean
  onChangeEvent?: (selectedOption: AttendanceStatusOption | null) => void
}

// Attendance status options
const attendanceStatusOptions: AttendanceStatusOption[] = [
  {
    value: "P",
    label: "Present",
    description: "Employee is present",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "A",
    label: "Absent",
    description: "Employee is absent",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    value: "WK",
    label: "Weekend",
    description: "Weekend/Non-working day",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  {
    value: "VL",
    label: "Vacation Leave",
    description: "Employee on vacation leave",
    color: "bg-yellow-100 text-yellow-800 border-gray-200",
  },
]

export default function AttendanceStatusAutocomplete<
  T extends Record<string, unknown>,
>({
  form,
  label,
  name,
  isDisabled = false,
  className,
  isRequired = false,
  onChangeEvent,
}: AttendanceStatusAutocompleteProps<T>) {
  // Custom components with display names
  const DropdownIndicator = React.memo(
    (props: DropdownIndicatorProps<AttendanceStatusOption>) => {
      return (
        <components.DropdownIndicator {...props} innerProps={{ ...props.innerProps, tabIndex: -1 }}>
          <IconChevronDown size={12} className="size-4 shrink-0 opacity-50" />
        </components.DropdownIndicator>
      )
    }
  )
  DropdownIndicator.displayName = "DropdownIndicator"

  const ClearIndicator = React.memo(
    (props: ClearIndicatorProps<AttendanceStatusOption>) => {
      return (
        <components.ClearIndicator {...props} innerProps={{ ...props.innerProps, tabIndex: -1 }}>
          <IconX size={10} className="size-3 shrink-0" />
        </components.ClearIndicator>
      )
    }
  )
  ClearIndicator.displayName = "ClearIndicator"

  const Option = React.memo((props: OptionProps<AttendanceStatusOption>) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium ${props.data.color}`}
          >
            {props.data.value}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{props.data.label}</span>
            <span className="text-muted-foreground text-xs">
              {props.data.description}
            </span>
          </div>
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

  const SingleValue = React.memo(
    (props: SingleValueProps<AttendanceStatusOption>) => {
      const selectedOption = attendanceStatusOptions.find(
        (option) => option.value === props.data.value
      )
      return (
        <components.SingleValue {...props}>
          <div className="flex items-center gap-2">
            {selectedOption && (
              <div
                className={`flex h-5 w-5 items-center justify-center rounded text-xs font-medium ${selectedOption.color}`}
              >
                {selectedOption.value}
              </div>
            )}
            <span>{selectedOption?.label || props.children}</span>
          </div>
        </components.SingleValue>
      )
    }
  )
  SingleValue.displayName = "SingleValue"

  const selectClassNames = React.useMemo(
    () => ({
      control: (state: { isFocused: boolean; isDisabled: boolean }) =>
        cn(
          "border-gray-400 dark:border-gray-500 data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50",
          "flex w-full items-center justify-between gap-2 rounded-md border bg-transparent pl-3 pr-0 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none",
          state.isFocused && "ring-2 ring-ring/50 border-ring",
          state.isDisabled && "cursor-not-allowed opacity-50",
          isRequired && !state.isDisabled && "bg-yellow-50 border-gray-400 dark:bg-yellow-950/20 dark:border-gray-500",
          className
        ),
      menu: () =>
        cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          "relative z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md"
        ),
      menuList: () => "max-h-[300px] overflow-y-auto",
      option: (state: { isSelected: boolean; isFocused: boolean }) =>
        cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          state.isFocused && "bg-accent text-accent-foreground",
          state.isSelected && "bg-accent text-accent-foreground"
        ),
      singleValue: () => "text-foreground",
      placeholder: () => "text-muted-foreground",
      input: () => "text-foreground",
      valueContainer: () => "gap-1",
      indicatorsContainer: () => "gap-1",
      indicatorSeparator: () => "bg-border",
    }),
    [className, isRequired]
  )

  return (
    <FormField
      control={form.control}
      name={name as Path<T>}
      render={({ field }) => (
        <FormItem className="w-full">
          {label && (
            <Label className={cn("text-sm font-medium", isRequired && "text-red-500")}>
              {label}
              {isRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <Select<AttendanceStatusOption>
            value={
              attendanceStatusOptions.find(
                (option) => option.value === field.value
              ) || null
            }
            onChange={(selectedOption) => {
              field.onChange(selectedOption?.value || "")
              onChangeEvent?.(selectedOption)
            }}
            options={attendanceStatusOptions}
            isDisabled={isDisabled}
            isClearable={!isRequired}
            placeholder="Select attendance status..."
            components={{
              DropdownIndicator,
              ClearIndicator,
              Option,
              SingleValue,
            }}
            classNames={selectClassNames}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "40px",
              }),
            }}
          />
        </FormItem>
      )}
    />
  )
}
