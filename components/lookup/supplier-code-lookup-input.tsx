"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { Path, PathValue, UseFormReturn } from "react-hook-form"
import { X } from "lucide-react"

import { ISupplierLookup } from "@/interfaces/lookup"
import { useSupplierCodeLookup } from "@/hooks/use-lookup"
import { cn } from "@/lib/utils"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const DEBOUNCE_MS = 300

export interface SupplierCodeLookupInputProps<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  name: Path<T>
  label?: string
  placeholder?: string
  className?: string
  isRequired?: boolean
  isDisabled?: boolean
  onSelect?: (supplierCode: string, supplierName: string) => void
}

export default function SupplierCodeLookupInput<
  T extends Record<string, unknown>,
>({
  form,
  name,
  label = "Supplier Code",
  placeholder,
  className,
  isRequired = false,
  isDisabled = false,
  onSelect,
}: SupplierCodeLookupInputProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [dropdownRect, setDropdownRect] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)

  const { data: options = [], isLoading } = useSupplierCodeLookup(debouncedSearch)

  const list = useMemo(
    () =>
      (options as ISupplierLookup[]).filter(
        (s) => s && (s.supplierCode != null || s.supplierId != null)
      ) as ISupplierLookup[],
    [options]
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(inputValue), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [inputValue])

  const formValue = form.watch(name)
  useEffect(() => {
    setInputValue(formValue != null ? String(formValue) : "")
  }, [formValue, name])

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node
    const outsideInput =
      containerRef.current && !containerRef.current.contains(target)
    const outsideDropdown =
      !dropdownRef.current || !dropdownRef.current.contains(target)
    if (outsideInput && outsideDropdown) {
      setOpen(false)
      setHighlightIndex(-1)
    }
  }, [])

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClickOutside])

  const updateDropdownRect = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDropdownRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  useLayoutEffect(() => {
    if (open && (list.length > 0 || isLoading)) {
      updateDropdownRect()
    } else {
      setDropdownRect(null)
    }
  }, [open, list.length, isLoading, updateDropdownRect])

  useEffect(() => {
    if (!open || !dropdownRect) return
    const onScrollOrResize = () => updateDropdownRect()
    window.addEventListener("scroll", onScrollOrResize, true)
    window.addEventListener("resize", onScrollOrResize)
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [open, dropdownRect, updateDropdownRect])

  const handleSelect = useCallback(
    (item: ISupplierLookup) => {
      const code = item.supplierCode ?? ""
      const displayName = item.supplierName ?? ""
      form.setValue(name, code as PathValue<T, Path<T>>)
      setInputValue(code)
      setOpen(false)
      setHighlightIndex(-1)
      onSelect?.(code, displayName)
    },
    [form, name, onSelect]
  )

  const handleClear = useCallback(() => {
    form.setValue(name, "" as PathValue<T, Path<T>>)
    setInputValue("")
    setDebouncedSearch("")
    setOpen(false)
    setHighlightIndex(-1)
    onSelect?.("", "")
  }, [form, name, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Escape") setOpen(true)
        return
      }
      if (e.key === "Escape") {
        setOpen(false)
        setHighlightIndex(-1)
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightIndex((i) => (i < list.length - 1 ? i + 1 : i))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightIndex((i) => (i > 0 ? i - 1 : -1))
        return
      }
      if (e.key === "Enter" && highlightIndex >= 0 && list[highlightIndex]) {
        e.preventDefault()
        handleSelect(list[highlightIndex])
      }
    },
    [open, list, highlightIndex, handleSelect]
  )

  return (
    <div
      className={cn("relative flex flex-col gap-1", className)}
      ref={containerRef}
    >
      {label && (
        <Label className={cn("text-sm font-medium", isRequired && "text-red-500")}>
          {label}
          {isRequired && <span className="ml-1">*</span>}
        </Label>
      )}
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={placeholder}
                  disabled={isDisabled}
                  value={inputValue}
                  onChange={(e) => {
                    const v = e.target.value
                    setInputValue(v)
                    field.onChange(v)
                    setOpen(true)
                    setHighlightIndex(-1)
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  className={cn("pr-8", isRequired && !isDisabled && "bg-yellow-50 border-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-700")}
                />
                {inputValue && !isDisabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                    onClick={handleClear}
                    aria-label="Clear"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {open &&
        (list.length > 0 || isLoading) &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="bg-popover z-[100] max-h-60 min-w-[8rem] overflow-auto rounded-md border shadow-md"
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
            }}
          >
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <ul className="p-1">
                {list.map((item, i) => (
                  <li key={item.supplierId ?? item.supplierCode ?? i}>
                    <button
                      type="button"
                      className={cn(
                        "w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        i === highlightIndex &&
                          "bg-accent text-accent-foreground"
                      )}
                      onMouseEnter={() => setHighlightIndex(i)}
                      onClick={() => handleSelect(item)}
                    >
                      {item.supplierCode}
                      {item.supplierName ? ` - ${item.supplierName}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
