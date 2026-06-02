/** React-select option shape used by searchable autocompletes. */
export interface SearchableFieldOption {
  value: string
  label: string
  /** While searching: previous selection pinned at top, not keyboard-focused */
  isPinnedPrevious?: boolean
}

/** Code segment before `" - "` in labels like `FA008 - Customer Name`. */
export function extractCodeFromSelectLabel(label: string): string {
  const idx = label.indexOf(" - ")
  return (idx >= 0 ? label.slice(0, idx) : label).trim()
}

export function findOptionByTypedCode(
  options: SearchableFieldOption[],
  rawInput: string
): SearchableFieldOption | null {
  const query = rawInput.trim().toLowerCase()
  if (!query) return null

  const withCode = options
    .filter((o) => extractCodeFromSelectLabel(o.label).length > 0)
    .map((o) => ({
      o,
      code: extractCodeFromSelectLabel(o.label).toLowerCase(),
    }))

  const exact = withCode.find((x) => x.code === query)
  if (exact) return exact.o

  const prefixMatches = withCode.filter((x) => x.code.startsWith(query))
  if (prefixMatches.length === 1) return prefixMatches[0].o

  return null
}

export function buildSearchableSelectOptions(
  baseOptions: SearchableFieldOption[],
  menuInputValue: string,
  selectedOptionId: string | null
): SearchableFieldOption[] {
  const searchQuery = menuInputValue.trim().toLowerCase()

  if (!searchQuery) {
    if (!selectedOptionId) return baseOptions
    const selectedOption = baseOptions.find(
      (opt) => opt.value === selectedOptionId
    )
    if (!selectedOption) return baseOptions
    const otherOptions = baseOptions.filter(
      (opt) => opt.value !== selectedOptionId
    )
    return [selectedOption, ...otherOptions]
  }

  const matches = baseOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery)
  )
  const selectedOption = selectedOptionId
    ? baseOptions.find((opt) => opt.value === selectedOptionId)
    : undefined
  const selectedInMatches =
    selectedOption &&
    matches.some((opt) => opt.value === selectedOption.value)

  if (selectedOption && !selectedInMatches) {
    return [{ ...selectedOption, isPinnedPrevious: true }, ...matches]
  }

  return matches
}

export function filterSearchableSelectOption(
  option: { label: string; data: SearchableFieldOption },
  inputValue: string
): boolean {
  if (option.data.isPinnedPrevious) {
    return true
  }
  return option.label.toLowerCase().includes(inputValue.toLowerCase())
}

export function isPinnedPreviousSelectOption(
  option: SearchableFieldOption
): boolean {
  return option.isPinnedPrevious === true
}
