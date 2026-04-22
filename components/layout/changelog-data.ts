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
    version: "1.5.12",
    date: "2026-04-22",
    changes: [
      {
        type: "improved",
        text: "Equipment Used service model now uses Is Loading, Is Offloading, Provider Name, and Gear fields across form and table views",
      },
      {
        type: "removed",
        text: "Removed forklift, crane, and stevedore charge default fields from Equipment Used service payload and checklist/report displays",
      },
      {
        type: "improved",
        text: "Equipment Used form layout updated to grouped rows with dedicated Is Loading and Is Offloading lines for tally sheet and loading/offloading values",
      },
      {
        type: "improved",
        text: "Equipment Used loading/offloading rows now show section status badges and enable inputs only when the related checkbox is turned on",
      },
      {
        type: "improved",
        text: "Equipment Used Loading and Offloading badges were moved to each section header line for clearer grouped form layout",
      },
      {
        type: "improved",
        text: "Equipment Used Loading and Offloading sections now render side by side on wider screens",
      },
      {
        type: "improved",
        text: "Equipment Used loading/offloading section headers now place checkbox and colored badge title side by side",
      },
      {
        type: "improved",
        text: "Equipment Used form now groups MAFI and Gear into a single two-field span row for cleaner alignment",
      },
    ],
  },
  {
    version: "1.5.11",
    date: "2026-04-22",
    changes: [
      {
        type: "improved",
        text: "Tariff dialogs and form grids are now responsive across screen sizes to reduce inconsistent horizontal scrollbar behavior on different systems",
      },
      {
        type: "fixed",
        text: "Tariff table Actions header checkbox interaction is now reliable by excluding the Actions header from drag-handle behavior",
      },
    ],
  },
  {
    version: "1.5.10",
    date: "2026-04-13",
    changes: [
      {
        type: "fixed",
        text: "Debit Note detail amount and VAT amount now support both negative and positive values in line item calculations and validation",
      },
    ],
  },
  {
    version: "1.5.9",
    date: "2026-04-13",
    changes: [
      {
        type: "added",
        text: "Added a dedicated same-origin auth login API route with request forwarding to backend auth endpoint",
      },
      {
        type: "improved",
        text: "Login API now includes per-IP rate limiting and forwards client IP/User-Agent metadata for backend audit fields",
      },
      {
        type: "fixed",
        text: "Login flow now avoids browser CORS issues by moving auth login calls from client-to-backend direct requests to server-side proxy",
      },
    ],
  },
  {
    version: "1.5.8",
    date: "2026-04-10",
    changes: [
      {
        type: "fixed",
        text: "AP Credit Note service category validation now matches AP Invoice and is enforced only when VAT amount is non-zero",
      },
    ],
  },
  {
    version: "1.5.7",
    date: "2026-04-09",
    changes: [
      {
        type: "fixed",
        text: "Resolved widespread master form lint warnings by removing unused Button imports and prefixing intentionally unused props",
      },
      {
        type: "fixed",
        text: "Restored form action buttons across master/admin forms with consistent Cancel and Add/Edit labels",
      },
      {
        type: "fixed",
        text: "GL Post Details history grids across AR/AP/CB/GL now show all posting rows by aligning page size with full result set",
      },
      {
        type: "fixed",
        text: "Tariff action column now shows row-selection checkboxes when bulk actions are available",
      },
    ],
  },
  {
    version: "1.5.6",
    date: "2026-04-08",
    changes: [
      {
        type: "improved",
        text: "Reduced changelog panel spacing for denser, more compact release list display",
      },
      {
        type: "improved",
        text: "Changelog sheet header layout refined by moving current version badge to a separate row for cleaner alignment",
      },
      {
        type: "fixed",
        text: "Resolved changelog sheet header overlap between current version badge and close icon",
      },
      {
        type: "improved",
        text: "Changelog header icon notification switched from numeric badge to a subtle glowing dot",
      },
      {
        type: "improved",
        text: "Changelog panel made more uniform with consistent version row and entry badge sizing",
      },
      {
        type: "improved",
        text: "Changelog history scrolling improved for long release lists with explicit scrollbar support",
      },
      {
        type: "improved",
        text: "Changelog side panel UI refreshed with cleaner cards, spacing, and visual hierarchy",
      },
      {
        type: "improved",
        text: "Release entries now use clearer shadcn badge styling for Added/Improved/Fixed/Removed types",
      },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-08",
    changes: [
      {
        type: "improved",
        text: "Tariff, checklist, debit note, and job order updates deployed from April release stream",
      },
      {
        type: "added",
        text: "Development rule added: every day with changes must include changelog updates",
      },
      {
        type: "improved",
        text: "UI standard enforced to use shadcn/ui components for UI work",
      },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-07",
    changes: [
      {
        type: "improved",
        text: "History table UI redesign and tariff table improvements",
      },
      {
        type: "improved",
        text: "Master screens completed with search input and search button patterns",
      },
      {
        type: "fixed",
        text: "Date range defaults adjusted from 1st January in related views",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-03-10",
    changes: [
      {
        type: "improved",
        text: "Multi-currency receipt flow matured across AR/AP scenarios",
      },
      {
        type: "improved",
        text: "UI density and table behavior refined across operational screens",
      },
      {
        type: "fixed",
        text: "Debit note, contra, and print-related issues addressed through March cycle",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-02-15",
    changes: [
      {
        type: "added",
        text: "Job transaction and activation/report-related screens expanded in February release",
      },
      {
        type: "improved",
        text: "Permissions, sidebar behavior, and list-table consistency improved",
      },
      {
        type: "fixed",
        text: "Bank transfer, receipt, setoff, and debit-note defects fixed during stabilization",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-02-01",
    changes: [
      {
        type: "improved",
        text: "Transition release from January patch stream into February feature stream",
      },
      {
        type: "improved",
        text: "Operations reporting and accounting flows prepared for larger February changes",
      },
    ],
  },
  {
    version: "1.0.20",
    date: "2026-01-31",
    changes: [
      {
        type: "improved",
        text: "Account-level updates and final January stability pass completed",
      },
    ],
  },
  {
    version: "1.0.19",
    date: "2026-01-30",
    changes: [
      {
        type: "improved",
        text: "Debit note updates and multiselection component refinements",
      },
    ],
  },
  {
    version: "1.0.18",
    date: "2026-01-29",
    changes: [
      {
        type: "added",
        text: "Year-end process flow and screen updates delivered",
      },
      {
        type: "improved",
        text: "Opening balance and operations reports enhancements",
      },
    ],
  },
  {
    version: "1.0.17",
    date: "2026-01-28",
    changes: [
      {
        type: "improved",
        text: "AR invoice behavior updates and transaction flow refinements",
      },
    ],
  },
  {
    version: "1.0.16",
    date: "2026-01-27",
    changes: [
      {
        type: "added",
        text: "Operations report screen introduced with sidebar icon refresh",
      },
      {
        type: "improved",
        text: "Rounding and account decimal configuration improvements",
      },
    ],
  },
  {
    version: "1.0.15",
    date: "2026-01-26",
    changes: [
      {
        type: "improved",
        text: "Operations and CB/AP workflows tuned for daily transactions",
      },
    ],
  },
  {
    version: "1.0.14",
    date: "2026-01-25",
    changes: [
      {
        type: "improved",
        text: "Operations checklist processing updated for better throughput",
      },
    ],
  },
  {
    version: "1.0.13",
    date: "2026-01-24",
    changes: [
      {
        type: "improved",
        text: "Checklist flow improvements and processing consistency updates",
      },
    ],
  },
  {
    version: "1.0.12",
    date: "2026-01-22",
    changes: [
      {
        type: "improved",
        text: "Consignment import/export and operations code refinement",
      },
    ],
  },
  {
    version: "1.0.11",
    date: "2026-01-20",
    changes: [
      { type: "added", text: "Freight and transportation screens added" },
      {
        type: "improved",
        text: "Account history and operations table updates",
      },
    ],
  },
  {
    version: "1.0.10",
    date: "2026-01-19",
    changes: [
      {
        type: "improved",
        text: "AccountBaseTable and table-account empty-state rendering refactored",
      },
      {
        type: "added",
        text: "useReactSelectScrollToSelected hook added for improved dropdown alignment",
      },
    ],
  },
  {
    version: "1.0.9",
    date: "2026-01-16",
    changes: [
      {
        type: "improved",
        text: "Report and shared code updates across core accounting areas",
      },
    ],
  },
  {
    version: "1.0.8",
    date: "2026-01-14",
    changes: [
      {
        type: "improved",
        text: "Schema validation and report parameter updates for amount constraints",
      },
      { type: "fixed", text: "Outstanding dialog behavior corrected" },
    ],
  },
  {
    version: "1.0.7",
    date: "2026-01-13",
    changes: [
      {
        type: "improved",
        text: "Report code updates for consistency and maintainability",
      },
    ],
  },
  {
    version: "1.0.6",
    date: "2026-01-12",
    changes: [
      {
        type: "improved",
        text: "Account action button naming and usability adjustments",
      },
    ],
  },
  {
    version: "1.0.5",
    date: "2026-01-09",
    changes: [
      {
        type: "improved",
        text: "Accounting workflow updates and quality fixes",
      },
    ],
  },
  {
    version: "1.0.4",
    date: "2026-01-08",
    changes: [
      {
        type: "improved",
        text: "Invoice tables and sortable headers refined for readability and cleaner styling",
      },
      {
        type: "fixed",
        text: "Search query synchronization improved in invoice and dialog data tables",
      },
    ],
  },
  {
    version: "1.0.3",
    date: "2026-01-07",
    changes: [
      {
        type: "improved",
        text: "Checklist table behavior updated with bank transfer-related improvements",
      },
    ],
  },
  {
    version: "1.0.2",
    date: "2026-01-06",
    changes: [
      {
        type: "improved",
        text: "Checklist workflow updates and interaction fixes",
      },
    ],
  },
  {
    version: "1.0.1",
    date: "2026-01-02",
    changes: [
      {
        type: "added",
        text: "Charge screen support for transport flag and enhanced AR invoice search behavior",
      },
      {
        type: "fixed",
        text: "Debit note import casing and focus behavior corrections across tables/forms",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-01",
    changes: [
      {
        type: "added",
        text: "Initial ERP release baseline with accounting and operations foundations",
      },
      {
        type: "added",
        text: "Core table, report, and transactional architecture initialized",
      },
    ],
  },
]
