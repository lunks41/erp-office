# Debit Note – Edit Button Flow

Steps and function execution order when the user clicks the **Edit** button on a debit note table row.

---

## 1. User clicks Edit (pencil icon)

**Location:** Table row → Actions column → Pencil button

**Component:** `DebitNoteTableActions`  
**File:** `components/table/table-debitnote-action.tsx`

- **Line 85:** `onClick={() => !hasValidDebitNoteId && onEditAction?.(row)}`
- If the row has a valid `debitNoteId` (saved), Edit is disabled; otherwise `onEditAction(row)` is called.
- **`row`** = full table row object (`IDebitNoteDt`), i.e. the detail being edited.

---

## 2. Table passes the handler down

**Component:** `DebitNoteBaseTable` (table-debitnote.tsx)  
**File:** `components/table/table-debitnote.tsx`

- **Line 293:** `onEditAction={onEditAction}` is passed into `DebitNoteTableActions`.
- So the Edit button calls whatever `onEditAction` the parent passed to the table.

**Component:** `DebitNoteTable`  
**File:** `app/(root)/[companyId]/operations/checklist/[joborderId]/components/services-combined/debit-note-table.tsx`

- **Line 165:** `onEditAction={onEditAction}` is passed from props into `DebitNoteBaseTable`.
- So the handler comes from the dialog.

---

## 3. Dialog provides the edit handler

**Component:** `DebitNoteDialog`  
**File:** `app/(root)/[companyId]/operations/checklist/[joborderId]/components/services-combined/debit-note-dialog.tsx`

- **Line 1111:** `<DebitNoteTable ... onEditAction={handleEditDebitNoteDetail} />`
- **Lines 215–221:** `handleEditDebitNoteDetail`:

```ts
const handleEditDebitNoteDetail = useCallback(
  (debitNoteDetail: IDebitNoteDt) => {
    setModalMode("edit")
    setSelectedDebitNoteDetail(debitNoteDetail)
  },
  []
)
```

**Execution when Edit is clicked:**

1. `handleEditDebitNoteDetail(debitNoteDetail)` is called with the row (`IDebitNoteDt`).
2. `setModalMode("edit")` → dialog is in edit mode.
3. `setSelectedDebitNoteDetail(debitNoteDetail)` → dialog stores the row to edit.

React re-renders the dialog with:

- `modalMode === "edit"`
- `selectedDebitNoteDetail` = that row.

---

## 4. Dialog re-renders and passes edit data to the form

**Same file:** `debit-note-dialog.tsx`

- **Lines 1079–1101:** `<DebitNoteForm ... />` is rendered with:

| Prop              | Value in edit mode |
|-------------------|---------------------|
| `key`             | `edit-${selectedDebitNoteDetail?.itemNo}-${selectedDebitNoteDetail?.gstId}` (form remounts per row) |
| `editingDetail`   | `selectedDebitNoteDetail` (the row) |
| `existingDetails` | `details` (all table rows) |
| Other             | `debitNoteHd`, `submitAction`, `onCancelAction`, etc. |

Because `key` changes when you switch to edit (or to another row), **DebitNoteForm remounts** and gets fresh `defaultValues` from `useForm`.

---

## 5. Form initializes with the selected row (edit mode)

**Component:** `DebitNoteForm`  
**File:** `app/(root)/[companyId]/operations/checklist/[joborderId]/components/services-combined/debit-note-form.tsx`

- **Lines 119–147:** `useForm` is called with:

```ts
defaultValues: editingDetail
  ? {
      debitNoteId: editingDetail.debitNoteId ?? debitNoteHd?.debitNoteId ?? 0,
      debitNoteNo: editingDetail.debitNoteNo ?? debitNoteHd?.debitNoteNo ?? "",
      itemNo: editingDetail.itemNo ?? getNextItemNo(),
      refItemNo: editingDetail.refItemNo ?? 0,
      taskId: taskId,
      chargeId: editingDetail.chargeId ?? 0,
      qty: editingDetail.qty ?? 0,
      unitPrice: editingDetail.unitPrice ?? 0,
      totAmt: editingDetail.totAmt ?? 0,
      gstId: editingDetail.gstId ?? 0,
      gstPercentage: editingDetail.gstPercentage ?? 0,
      gstAmt: editingDetail.gstAmt ?? 0,
      totAmtAftGst: editingDetail.totAmtAftGst ?? 0,
      remarks: editingDetail.remarks ?? "",
      editVersion: editingDetail.editVersion ?? 0,
      totLocalAmt: editingDetail.totLocalAmt ?? 0,
      isServiceCharge: editingDetail.isServiceCharge ?? false,
      serviceCharge: editingDetail.serviceCharge ?? 0,
    }
  : createDefaultValues(getNextItemNo()),
```

Because `editingDetail` is the row you clicked:

- Form is created with **defaultValues = that row’s data** (with fallbacks to header and `getNextItemNo()` where needed).
- No separate `form.reset()` is required on first load for that row; the form mounts already in edit state for that detail.

---

## 6. Optional: VAT % / amount when gstId is set but values are 0

**Same file:** `debit-note-form.tsx`

- **useEffect (e.g. ~lines 258–268):** When `editingDetail?.gstId` is set and `allGst` is loaded, if `gstPercentage` or `gstAmt` is 0, the form runs `calculateGstAmt()` so VAT % and Vat Amt are filled from the GST lookup.
- So even if the row has only `gstId` and no percentage/amount, the form can still show correct VAT % and amount after this effect.

---

## Flow summary (order of execution)

| Step | Where | What runs |
|------|--------|-----------|
| 1 | User | Clicks Edit (pencil) on a table row. |
| 2 | `DebitNoteTableActions` | `onClick` → `onEditAction?.(row)` with that row. |
| 3 | `DebitNoteTable` / `DebitNoteBaseTable` | Pass through; `onEditAction` is the dialog’s handler. |
| 4 | `DebitNoteDialog` | `handleEditDebitNoteDetail(debitNoteDetail)` runs: `setModalMode("edit")`, `setSelectedDebitNoteDetail(debitNoteDetail)`. |
| 5 | React | Dialog re-renders; `DebitNoteForm` gets new `key` and `editingDetail={selectedDebitNoteDetail}`. |
| 6 | `DebitNoteForm` | Form **remounts** (new `key`), `useForm` runs with `defaultValues: editingDetail ? { ...editingDetail } : createDefaultValues(...)`, so form shows the selected row’s data. |
| 7 | `DebitNoteForm` | If needed, useEffect runs `calculateGstAmt()` to fill VAT % / Vat Amt from `allGst`. |

End result: the form shows the chosen row in edit mode, and the user can change fields and click **Update** to submit.
