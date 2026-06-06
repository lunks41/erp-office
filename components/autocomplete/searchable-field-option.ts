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

function getNameFromSelectLabel(label: string): string {
  const idx = label.indexOf(" - ")
  return (idx >= 0 ? label.slice(idx + 3) : label).trim()
}

function pickUniqueMatch(
  matches: SearchableFieldOption[]
): SearchableFieldOption | null {
  return matches.length === 1 ? matches[0] : null
}

/** Match by code, full label, or name segment when the filter narrows to one row. */
export function findOptionByTypedSearch(
  options: SearchableFieldOption[],
  rawInput: string
): SearchableFieldOption | null {
  const query = rawInput.trim().toLowerCase()
  if (!query) return null

  const byCode = findOptionByTypedCode(options, rawInput)
  if (byCode) return byCode

  const searchable = options.filter((o) => !o.isPinnedPrevious)

  return (
    pickUniqueMatch(
      searchable.filter((o) => o.label.toLowerCase() === query)
    ) ??
    pickUniqueMatch(
      searchable.filter((o) => o.label.toLowerCase().includes(query))
    ) ??
    pickUniqueMatch(
      searchable.filter((o) =>
        getNameFromSelectLabel(o.label).toLowerCase().includes(query)
      )
    ) ??
    pickUniqueMatch(
      searchable.filter((o) =>
        getNameFromSelectLabel(o.label).toLowerCase().startsWith(query)
      )
    ) ??
    pickUniqueMatch(
      searchable.filter((o) => o.label.toLowerCase().startsWith(query))
    )
  )
}

function matchOptionByElementText(
  enabledOptions: SearchableFieldOption[],
  element: HTMLElement | null
): SearchableFieldOption | null {
  if (!element) return null

  const text = (element.textContent ?? "").trim()
  if (!text) return null

  return (
    enabledOptions.find((o) => text === o.label) ??
    enabledOptions.find((o) => text.endsWith(o.label)) ??
    enabledOptions.find((o) => o.label.includes(text) || text.includes(o.label)) ??
    null
  )
}

/** Keyboard-focused row in the open react-select menu (portal-safe). */
export function getFocusedSelectOption(
  filteredOptions: SearchableFieldOption[],
  container?: HTMLElement | null
): SearchableFieldOption | null {
  const enabledOptions = filteredOptions.filter((o) => !o.isPinnedPrevious)
  if (enabledOptions.length === 0) return null

  if (container) {
    const input = container.querySelector("input")
    const activeId = input?.getAttribute("aria-activedescendant")
    if (activeId) {
      const byAria = matchOptionByElementText(
        enabledOptions,
        document.getElementById(activeId)
      )
      if (byAria) return byAria
    }
  }

  const focusedEl = document.querySelector(
    ".react-select__option--is-focused"
  ) as HTMLElement | null
  if (focusedEl && !focusedEl.classList.contains("react-select__option--is-disabled")) {
    const menuList = focusedEl.closest(".react-select__menu-list")
    if (menuList) {
      const enabledEls = menuList.querySelectorAll(
        ".react-select__option:not(.react-select__option--is-disabled)"
      )
      const idx = Array.from(enabledEls).indexOf(focusedEl)
      if (idx >= 0 && idx < enabledOptions.length) {
        return enabledOptions[idx]
      }
    }

    const byDom = matchOptionByElementText(enabledOptions, focusedEl)
    if (byDom) return byDom
  }

  return null
}

/** Resolve Tab selection: code/name search, else highlighted row, else sole visible match. */
export function resolveOptionOnTabSelect({
  baseOptions,
  filteredOptions,
  rawInput,
  keyboardFocusedOption,
  selectContainer,
}: {
  baseOptions: SearchableFieldOption[]
  filteredOptions: SearchableFieldOption[]
  rawInput: string
  keyboardFocusedOption?: SearchableFieldOption | null
  selectContainer?: HTMLElement | null
}): SearchableFieldOption | null {
  const query = rawInput.trim()
  if (!query) return null

  const visible = filteredOptions.filter((o) => !o.isPinnedPrevious)

  const bySearch = findOptionByTypedSearch(baseOptions, query)
  if (bySearch) return bySearch

  if (
    keyboardFocusedOption &&
    !keyboardFocusedOption.isPinnedPrevious &&
    visible.some((o) => o.value === keyboardFocusedOption.value)
  ) {
    return keyboardFocusedOption
  }

  const focused = getFocusedSelectOption(filteredOptions, selectContainer)
  if (focused) return focused

  if (visible.length === 1) return visible[0]

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
