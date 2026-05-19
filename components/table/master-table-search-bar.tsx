"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type MasterTableSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
  isLoading?: boolean
  placeholder?: string
}

export function MasterTableSearchBar({
  value,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  placeholder = "Search...",
}: MasterTableSearchBarProps) {
  return (
    <div className="bg-card mb-2 rounded-lg border p-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onSearch()
            }
          }}
          className="h-9 w-full sm:w-[200px]"
        />
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9"
          onClick={onSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2 text-primary-foreground" />
              Loading...
            </>
          ) : (
            "Search"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={onClear}
          disabled={isLoading}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
