export type ChangeType = "added" | "improved" | "fixed" | "removed"

export interface ChangeEntry {
  type: ChangeType
  text: string
}

export interface ChangelogVersion {
  version: string
  date: string
  changes: ChangeEntry[]
}

/**
 * HOW TO UPDATE CHANGELOG DYNAMICALLY:
 * ─────────────────────────────────────
 * Simply add a new object at the TOP of the `changelog` array below.
 * Format:
 *   {
 *     version: "x.y.z",
 *     date: "YYYY-MM-DD",
 *     changes: [
 *       { type: "added",    text: "Description of new feature" },
 *       { type: "improved", text: "Description of improvement" },
 *       { type: "fixed",    text: "Description of bug fix" },
 *       { type: "removed",  text: "Description of removed feature" },
 *     ],
 *   },
 *
 * Available change types: "added" | "improved" | "fixed" | "removed"
 */
export const changelog: ChangelogVersion[] = [
  {
    version: "1.3.0",
    date: "2026-03-26",
    changes: [
      { type: "added",    text: "Changelog sidebar with version history" },
      { type: "improved", text: "Active tab highlighted with blue color for better visibility" },
      { type: "improved", text: "Action icon buttons spacing increased for easier clicking" },
      { type: "fixed",    text: "Print button (DropdownMenuTrigger) size now matches other toolbar buttons" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-20",
    changes: [
      { type: "improved", text: "Compact button heights and padding applied across entire ERP" },
      { type: "improved", text: "Table row heights standardised to h-7 across all modules" },
      { type: "improved", text: "Column resize handles wider and easier to grab" },
      { type: "fixed",    text: "Select All checkbox no longer selects rows with existing Debit Notes" },
      { type: "fixed",    text: "Text truncation with hover tooltip in all table cells" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-10",
    changes: [
      { type: "improved", text: "Global table font size reduced to 0.75rem for denser data display" },
      { type: "improved", text: "AR/AP invoice multi-currency receipt support" },
      { type: "improved", text: "ARAP Contra UI improvements" },
      { type: "fixed",    text: "Debit Note number assignment and sorting" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-02-15",
    changes: [
      { type: "added", text: "Initial ERP release with AR, AP, CB, GL modules" },
      { type: "added", text: "Operations / Checklist module with job order management" },
      { type: "added", text: "Role-based permission system" },
      { type: "added", text: "Telerik report viewer integration" },
      { type: "added", text: "Dark mode support" },
    ],
  },
]
