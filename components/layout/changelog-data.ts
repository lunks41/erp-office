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
    version: "1.5.34",
    date: "2026-05-07",
    changes: [
      {
        type: "fixed",
        text: "Hardened company switch flow for startup race conditions: when switch is triggered before company list hydration, company-store now auto-fetches companies and exits safely instead of throwing runtime errors",
      },
      {
        type: "fixed",
        text: "Company switching now recovers from stale persisted tab company IDs by falling back to the first available company instead of throwing `Company with ID ... not found` runtime errors",
      },
      {
        type: "fixed",
        text: "Resolved top navigation hydration mismatch by deferring NavHeader menu render until client mount, preventing SSR/client permission-state divergence in NavigationMenu items",
      },
      {
        type: "fixed",
        text: "Proxy route secure header forwarding now omits `X-Company-Id` when empty, preventing `/admin/getusercompany` 400 validation failures on company-select before a company is chosen",
      },
      {
        type: "fixed",
        text: "Final build warning cleanup removed unused company-store imports from checklist details variants and documented the react-pdf logo image a11y lint suppression to keep production build output clean",
      },
      {
        type: "improved",
        text: "Completed remaining store migration in app screens by moving all `decimals/currentCompany/companies` consumers from auth-store to company-store (AR/AP/CB/GL, inquiry, admin, checklist, logistics, and company landing) while preserving auth-store for user/session-only reads",
      },
      {
        type: "fixed",
        text: "Post-migration cleanup removed obsolete auth-store imports in migrated files and validated zero remaining company-context destructures from `useAuthStore` with clean workspace typecheck/lint results",
      },
      {
        type: "fixed",
        text: "Parallel stabilization pass resolved remaining compile blockers across HR payrun payslip image props, GST/Tax master search-submit handlers, ServiceType filter sortOrder typing, and Inquiry AP/AR/GL visible/table typings",
      },
      {
        type: "fixed",
        text: "Shared utility/component type issues were corrected (transaction autocomplete numeric moduleId normalization and duplicate object keys in date picker class maps), bringing the workspace back to clean TypeScript compilation",
      },
      {
        type: "fixed",
        text: "Removed stale `./approval` barrel export from interfaces index to match current interface module set and clear missing-module compile failure",
      },
      {
        type: "fixed",
        text: "Setting schema decimal validators were updated to remove unsupported Zod `required_error` number options, restoring compatibility with current Zod typings",
      },
      {
        type: "fixed",
        text: "Equipment Used legacy compatibility fields (`loadingRefNo`, loading/offloading crane-forklift-stevedore summaries) were restored as optional in interfaces and schema to unblock older tab/helper flows while detail-line model remains active",
      },
      {
        type: "fixed",
        text: "Checklist Transportation save payload now guarantees `serviceItemNoName` in `data_details` rows, preventing SerTransportation detail type violations during submit/update flows",
      },
      {
        type: "fixed",
        text: "Equipment Used form/schema typing was aligned by introducing optional UI section toggles (`isLoading`/`isOffloading`) in schema and tightening RHF resolver typing to remove form generic mismatch compile errors",
      },
      {
        type: "fixed",
        text: "Master form components now consistently alias destructured props from onCancelAction/isSubmitting to internal underscore variables, removing TS2339 regressions introduced by prop rename mismatches; related missing date-fns `format` imports were restored in affected detail forms",
      },
      {
        type: "fixed",
        text: "Master forms type-safety cleanup: Charge form resolver typing was aligned with schema output and duplicate checkbox wrapper markup was removed to restore stable compile-time form typing",
      },
      {
        type: "fixed",
        text: "Account Setup and Account Setup Detail forms now map destructured props to existing interface names (onCancelAction/isSubmitting), and Currency Detail form now imports date-fns `format` used for validFrom defaults/resets",
      },
      {
        type: "fixed",
        text: "Next document delete/serve catch-all API routes were updated to Next.js App Router context typing (`params` Promise) to remove route handler type validation failures",
      },
      {
        type: "fixed",
        text: "Operations reports page no longer declares server-style `params` props in a client component, and AP Debit Note component imports were aligned to consistent file casing to avoid duplicate-file typecheck conflicts",
      },
      {
        type: "fixed",
        text: "AR Overview page duplicate content block was removed to restore a single valid module implementation and eliminate duplicate identifier/runtime compilation failures",
      },
      {
        type: "improved",
        text: "Safe company-context consumers in custom date inputs, loan hook company selection, and AP/AR/CB/GL plus operations report views now read company fields (currentCompany/companies/decimals) from company-store instead of auth-store with unchanged behavior",
      },
      {
        type: "improved",
        text: "Low-risk overview/read-only consumers now read decimal formatting settings from company-store instead of auth-store (employee overview/forms, AP/AR outstanding tables, and document manager tables) while preserving existing output formatting",
      },
      {
        type: "improved",
        text: "AR/AP/CB/GL Overview pages were rebuilt to use live module API routes for date-range driven data, replacing static mock blocks with real transactional summaries",
      },
      {
        type: "improved",
        text: "Overview data loading now calls dedicated proxy endpoints for each module (`/ar/*`, `/ap/*`, `/gl/*`, `/cb/*`) including KPI, chart sources, and today/week transaction feeds",
      },
      {
        type: "improved",
        text: "Overview dashboards now include chart-style visual bars for top entities and period distributions using shadcn card layouts for consistent ERP theming",
      },
      {
        type: "improved",
        text: "A reusable TanStack-based overview data table component was introduced and wired into all four overview modules (AR/AP/CB/GL) with tab-based filtering",
      },
      {
        type: "added",
        text: "New module dashboard Zustand stores were added (useArDashboardStore/useApDashboardStore/useCbDashboardStore/useGlDashboardStore) with reusable layout state factory support for widget visibility, position updates, and company-scoped local layout persistence",
      },
      {
        type: "improved",
        text: "State architecture was split toward reference parity by introducing dedicated company-store and session-store modules, with auth-store delegating company/decimal/permission and session queue/analytics workflows to these focused stores while preserving backward compatibility",
      },
    ],
  },
  {
    version: "1.5.32",
    date: "2026-05-07",
    changes: [
      {
        type: "improved",
        text: "Checklist Transportation was migrated to SerTransportationHd/SerTransportationDt contracts across interfaces, zod schemas, forms, tabs, and save payloads (including itemNo-based detail rows via data_details)",
      },
      {
        type: "fixed",
        text: "Transportation edit/save flow now preserves and submits transportationId from selected table rows, keeps Service Item values hydrated in edit forms, and prevents empty data_details on submit",
      },
      {
        type: "fixed",
        text: "Transportation table Services column now renders reliably from serviceItemNoName and data_details fallbacks, and transportationId is hidden from visible table columns",
      },
      {
        type: "improved",
        text: "Charge form UX/validation was tightened by setting boolean defaults (isTransport/isMultiple/isActive), initializing isMultiple in create mode, and aligning checkbox layout into one row",
      },
      {
        type: "fixed",
        text: "Changelog side panel now wraps long entry text/identifiers within card width (no overflow clipping) for improved readability on narrower screens",
      },
      {
        type: "improved",
        text: "Global design tokens in app/globals.css were refreshed to a modern ERP accounting theme for both light and dark modes, with warm neutral surfaces, cleaner contrast, and consistent sidebar/semantic color harmony",
      },
      {
        type: "fixed",
        text: "Sidebar collapsed icon mode now hides top-level menu labels (including Master) and chevrons, preventing text from appearing when the sidebar is collapsed",
      },
      {
        type: "fixed",
        text: "Checklist Equipment Used numeric detail inputs now enforce explicit keyboard tab order so focus moves reliably from Crane to ForkLift in loading/offloading lines",
      },
    ],
  },
  {
    version: "1.5.31",
    date: "2026-05-06",
    changes: [
      {
        type: "improved",
        text: "AP Invoice, AP Debit Note, and AP Credit Note transaction toolbars now hide the Print action button/menu",
      },
      {
        type: "fixed",
        text: "Checklist Equipment Used form now correctly resolves loading/offloading section enablement state so the page compiles and section controls no longer reference undefined flags",
      },
    ],
  },
  {
    version: "1.5.30",
    date: "2026-05-04",
    changes: [
      {
        type: "fixed",
        text: "Equipment Used detail line contract now aligns with the updated Ser_EquipmentUsedDt table by using itemNo (instead of detailsId) in TypeScript interfaces, zod schema, and form/helper payload mapping",
      },
    ],
  },
  {
    version: "1.5.29",
    date: "2026-05-03",
    changes: [
      {
        type: "fixed",
        text: "Equipment Used edit form now reads API `data_details` (as well as `details`) when rebuilding tally lines so every loading/offloading row returned from get-by-id is shown, not only the first line of each type from header fields",
      },
      {
        type: "added",
        text: "Checklist Equipment Used form now supports multiple loading and offloading tally lines via a `details` array aligned with `Ser_EquipmentUsedDt` (add/remove lines, submit sends `details` plus legacy header summary from the first line of each type)",
      },
      {
        type: "fixed",
        text: "Checklist Equipment Used: cloning a row from the table now clears loading and offloading tally sheet numbers and equipment quantities (and debit note linkage) so the new record starts with empty tally lines instead of duplicating the previous row",
      },
    ],
  },
  {
    version: "1.5.28",
    date: "2026-05-01",
    changes: [
      {
        type: "improved",
        text: "Default public site URL and app URL now target the internal dev host http://172.16.31.6:4000 (replacing https://erp.com) in .env and layout metadata fallbacks so manifest and OG URLs stay same-origin and avoid CORS errors",
      },
      {
        type: "improved",
        text: "AR Receipt and AR Receipt Multi Currency summary strips now include a Balance Local badge, showing total local balance from detail rows alongside Balance Amt",
      },
      {
        type: "fixed",
        text: "AR Receipt and AR Receipt Multi Currency now keep Rec Total Local Amount and Total Local Amount strictly synchronized during recalculation to prevent one-cent rounding mismatches",
      },
      {
        type: "improved",
        text: "Git ignore rules now exclude local AI/tooling artifacts by ignoring .graphify, .graphiy, .claude, and claude.md to keep repository commits clean",
      },
    ],
  },
  {
    version: "1.5.27",
    date: "2026-04-28",
    changes: [
      {
        type: "improved",
        text: "Bank and Supplier master screens now apply the same compact spacing as Customer by reducing form wrapper gaps, card shell padding, tabs spacing, and address/contact tab content vertical whitespace",
      },
      {
        type: "improved",
        text: "Customer master vertical whitespace was further reduced by tightening card shell padding/gaps and compacting audit trail accordion top/bottom spacing and row paddings",
      },
      {
        type: "improved",
        text: "Customer master cards were tightened by removing top/bottom card content padding and reducing customer form vertical gaps to achieve a denser layout",
      },
      {
        type: "improved",
        text: "AR Invoice print menu now includes a new 3. PrePrinted option wired to ar/ArInvoice_PrePrinted.trdp with dedicated report type parameter mapping",
      },
      {
        type: "improved",
        text: "PDA History and Timeline tabs were merged into a single History & Timeline tab, rendering both sections side-by-side in a responsive two-column layout",
      },
      {
        type: "improved",
        text: "PDA history tab now matches checklist history presentation with a two-card layout showing Creation Details, Last Modified info, and a compact version/status history table",
      },
      {
        type: "improved",
        text: "PDA timeline tab now uses a checklist-style activity timeline card with icon markers, connector line, and Done/Current/Pending badges instead of plain bullet text",
      },
      {
        type: "improved",
        text: "PDA summary header now renders PDA Reference and PDA Date using disabled CustomInput controls to keep all header fields on the shared custom form input style",
      },
      {
        type: "improved",
        text: "PDA header summary now uses autocomplete controls for Job Order, Vessel, Customer, Port, and Status via shared components/autocomplete, with form-bound ids for consistent selection behavior",
      },
      {
        type: "improved",
        text: "PDA summary form fields were aligned with checklist-style input presentation by switching editable fields to custom input/date components and tightening label/field spacing for consistent operations UI",
      },
      {
        type: "improved",
        text: "PDA list now uses a dedicated operations-style table component aligned with checklist service table behavior, including row actions and inline approve handling",
      },
      {
        type: "improved",
        text: "PDA editor top area was restyled to match AR Invoice's compact toolbar pattern with slim tabs, inline status badges, and small action buttons on a single header bar",
      },
      {
        type: "improved",
        text: "PDA feature components were moved from shared components/Operations/Pda into app/(root)/[companyId]/operations/pda/components and route imports were updated to use the new module-local structure",
      },
      {
        type: "improved",
        text: "Operations PDA routes were refactored to match existing module structure patterns using thinner page shells with route-local page components for list/create/detail composition",
      },
      {
        type: "fixed",
        text: "PDA editor type issues were resolved by aligning Zod form input types with React Hook Form and updating PDA detail query key usage after usePdaById signature changes",
      },
      {
        type: "improved",
        text: "PDA hooks now use centralized route constants from lib/api-routes.ts (including LoadFromTariff) instead of local inline endpoint strings",
      },
      {
        type: "improved",
        text: "Sidebar now hardcodes an Operations PDA menu item so PDA is always visible even when transaction-rights data does not return the PDA entry",
      },
      {
        type: "improved",
        text: "Canonical Tailwind utility class names were aligned across AR Invoice, Checklist, Debit Note dialog, and navigation header to clear editor intellisense style warnings",
      },
      {
        type: "improved",
        text: "PDA grouped charge grid now runs in strict mode by blocking orphan sub-rows, allowing sub-row creation only for valid sections, and keeping section amounts fully computed/read-only from child row totals",
      },
      {
        type: "improved",
        text: "PDA charge grid now renders grouped section headers and sub-rows (RowType/ParentItemNo) with section-level subtotal rollups, qty-only editable sub-rows, inline add-section/add-sub-row actions, and warning/estimate comment indicators",
      },
      {
        type: "improved",
        text: "PDA detail lines now support database grouping fields RowType and ParentItemNo, including section-header rows and parent-child line linking in the charge grid",
      },
      {
        type: "added",
        text: "Operations module now includes Proforma Disbursement Account (PDA) screens with list/create/detail routes, charge grid editing, tariff load flow, approval flow, clone/delete actions, and status-driven Draft/Approved/Converted UI",
      },
      {
        type: "fixed",
        text: "Checklist Debit Note detail form now defaults VAT from Job Order GST (gstId and gstPercentage) when the job is taxable with valid GST settings",
      },
      {
        type: "added",
        text: "Checklist Equipment Used now supports Barge and AME Tally fields in schema/interface, form entry, and list table display",
      },
      {
        type: "removed",
        text: "AR Invoice header model no longer includes the unused isModuleFrom field in schema, interface, defaults, and page mappings",
      },
      {
        type: "added",
        text: "Customer master now supports the Is Oversease flag across schema, interface model, customer form checkbox, and customer list table column",
      },
    ],
  },
  {
    version: "1.5.26",
    date: "2026-04-27",
    changes: [
      {
        type: "fixed",
        text: "GL AR/AP Contra save validation now enforces Remarks only when the Remarks field is visible and marked mandatory, preventing hidden-field validation failures",
      },
    ],
  },
  {
    version: "1.5.25",
    date: "2026-04-24",
    changes: [
      {
        type: "improved",
        text: "Sidebar navigation now removes the separate Activation section and places Transaction Recovery and Checklist Overrides under Admin",
      },
      {
        type: "fixed",
        text: "Removed hardcoded sidebar injection for Transaction Recovery and Checklist Overrides so Admin links come only from user transactions/permissions",
      },
      {
        type: "improved",
        text: "Rule guidance now enforces day-wise versioning so all updates on the same date stay under a single release version entry",
      },
      {
        type: "improved",
        text: "Renamed Checklist Overrides component file/symbols to align with its feature folder naming",
      },
      {
        type: "improved",
        text: "Renamed Transaction Recovery component file/symbols to match its feature folder naming for clearer admin module structure",
      },
      {
        type: "improved",
        text: "Removed unused admin activation routes after migrating to Transaction Recovery and Checklist Overrides screens",
      },
      {
        type: "added",
        text: "New Admin Company screen added under /admin/company with list, create/edit/view modal form, delete and save confirmations, currency selection, and permissions-based actions",
      },
      {
        type: "improved",
        text: "Admin activation screens are separated into dedicated routes: Transaction Recovery and Checklist Overrides, with legacy activation URLs redirected for compatibility",
      },
      {
        type: "improved",
        text: "CB Petty Cash details grid adds a Docs column (after Actions) with per-line attachment counts, document manager from each row, and a footer with total lines, legend, and total amount",
      },
      {
        type: "improved",
        text: "CB Petty Cash line document upload now defaults document type to Invoice and pre-fills upload remarks from the selected detail row remarks",
      },
      {
        type: "fixed",
        text: "Document Manager modal layout: wider dialog, scroll containment, min-width/overflow on grid and record badge to stop overlap and the documents list table squashing",
      },
      {
        type: "improved",
        text: "Checklist Purchase dialog Document No now opens the source accounting transaction in a new tab via history-doc navigation (with fallback to existing job-transaction edit dialog)",
      },
      {
        type: "improved",
        text: "Checklist Purchase table adds a pin-based Preview column that shows multiple pins when multiple rows share the same accounting source document",
      },
      {
        type: "improved",
        text: "Checklist Purchase preview icons now use green paperclip styling to match the requested visual indicator",
      },
      {
        type: "fixed",
        text: "Checklist Purchase behavior updated so Document No opens Job Transaction form, while Preview pin opens accounting document preview",
      },
    ],
  },
  {
    version: "1.5.24",
    date: "2026-04-22",
    changes: [
      {
        type: "fixed",
        text: "CB Petty Cash history Account Details now correctly displays Created/Edited/Cancelled/Approved dates by parsing user-format datetime strings",
      },
      {
        type: "fixed",
        text: "Tariff detail Line Description field is now editable only when Custom Description is enabled",
      },
      {
        type: "improved",
        text: "Tariff detail second-row desktop alignment refined with explicit column spans so Custom Description, Line Description, Calculate by Qty, and action buttons match the requested reference positioning",
      },
      {
        type: "improved",
        text: "Tariff detail second-row layout now uses a single-line Line Description input between Custom Description and Calculate by Qty to match the compact reference UI",
      },
      {
        type: "improved",
        text: "Tariff form now auto-sets Unit (uomId) when a charge is selected using charge lookup defaults",
      },
      {
        type: "improved",
        text: "Tariff detail editor now places Custom Description, Line Description, and Calculate by Qty controls on a dedicated second row",
      },
      {
        type: "improved",
        text: "Tariff detail action buttons (Cancel/Edit) are now aligned within the second row for cleaner in-row editing layout",
      },
      {
        type: "improved",
        text: "Charge master form now includes UOM autocomplete bound to uomId, with schema/interface support and existing record load mapping",
      },
      {
        type: "improved",
        text: "Tariff detail model now supports lineDescription and isCustomDescription, including schema validation plus create/edit form inputs and table display columns",
      },
      {
        type: "improved",
        text: "Equipment Used was refactored to use Is Loading/Is Offloading, Provider Name, and Gear fields, replacing old forklift/crane/stevedore charge defaults, with updated checklist/report tables and a cleaner form layout including grouped sections, side-by-side loading/offloading cards, colored header badges with checkbox controls, conditional section editability, and aligned MAFI/Gear inputs",
      },
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
    version: "1.5.23",
    date: "2026-04-13",
    changes: [
      {
        type: "fixed",
        text: "Debit Note detail amount and VAT amount now support both negative and positive values in line item calculations and validation",
      },
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
    version: "1.5.22",
    date: "2026-04-10",
    changes: [
      {
        type: "fixed",
        text: "AP Credit Note service category validation now matches AP Invoice and is enforced only when VAT amount is non-zero",
      },
    ],
  },
  {
    version: "1.5.21",
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
    version: "1.5.20",
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
