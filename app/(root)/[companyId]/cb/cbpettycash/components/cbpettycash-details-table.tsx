"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ICbPettyCashDt } from "@/interfaces"
import { IDocType } from "@/interfaces/lookup"
import { IVisibleFields } from "@/interfaces/setting"
import { useAuthStore } from "@/stores/auth-store"
import { useQueryClient } from "@tanstack/react-query"
import { CellContext, ColumnDef } from "@tanstack/react-table"
import { format, isValid } from "date-fns"
import { Circle, Paperclip } from "lucide-react"
import { toast } from "sonner"

import { Admin } from "@/lib/api-routes"
import { parseDate } from "@/lib/date-utils"
import { formatNumber } from "@/lib/format-utils"
import {
  CBTransactionId,
  ModuleId,
  TableName,
  cn,
} from "@/lib/utils"
import { useGet } from "@/hooks/use-common"
import DocumentManager from "@/components/document-manager"
import { AccountBaseTablev1 } from "@/components/table/table-account-v1"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Use flexible data type that can work with form data
interface CbPettyCashDetailsTableProps {
  data: ICbPettyCashDt[]
  /** Header payment id — documents are loaded per payment and split by line itemNo */
  paymentId: string
  paymentNo: string
  companyId: number
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onEditAction?: (template: ICbPettyCashDt) => void
  onCloneAction?: (template: ICbPettyCashDt) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: ICbPettyCashDt[]) => void
  visible: IVisibleFields
  isCancelled?: boolean
  /** Shown in footer next to total amount (e.g. AED) */
  currencyCode?: string
}

const DOC_QUERY_PREFIX = (paymentId: string) =>
  `documents-${ModuleId.cb}-${CBTransactionId.cbpettycash}-${paymentId}`

export default function CbPettyCashDetailsTable({
  data,
  paymentId,
  paymentNo,
  companyId,
  onDeleteAction,
  onBulkDeleteAction,
  onEditAction,
  onCloneAction,
  onRefreshAction,
  onFilterChange,
  onDataReorder,
  visible,
  isCancelled = false,
  currencyCode = "AED",
}: CbPettyCashDetailsTableProps) {
  const [mounted, setMounted] = useState(false)
  const [docManagerOpen, setDocManagerOpen] = useState(false)
  const [docContextItemNo, setDocContextItemNo] = useState<number | null>(null)
  const [docContextRemarks, setDocContextRemarks] = useState<string>("")
  const { decimals } = useAuthStore()
  const queryClient = useQueryClient()
  const amtDec = decimals?.[0]?.amtDec || 2
  const priceDec = decimals?.[0]?.priceDec || 2
  const locAmtDec = decimals?.[0]?.locAmtDec || 2
  const dateFormat = decimals?.[0]?.dateFormat || "dd/MM/yyyy"

  const isSavedPayment = Boolean(paymentId && paymentId !== "0")
  const { data: documentsResponse, refetch: refetchDocuments } = useGet<IDocType>(
    `${Admin.getDocumentById}/${ModuleId.cb}/${CBTransactionId.cbpettycash}/${paymentId}`,
    DOC_QUERY_PREFIX(paymentId),
    undefined,
    { enabled: isSavedPayment }
  )

  const docCountByItemNo = useMemo(() => {
    const m = new Map<number, number>()
    const d = documentsResponse?.data
    if (!d || !Array.isArray(d)) return m
    for (const doc of d) {
      if (!doc || typeof doc.itemNo !== "number") continue
      m.set(doc.itemNo, (m.get(doc.itemNo) ?? 0) + 1)
    }
    return m
  }, [documentsResponse?.data])

  const lineTotal = useMemo(
    () => data.reduce((s, r) => s + (Number(r.totAmt) || 0), 0),
    [data]
  )

  const invalidateLineDocuments = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: [DOC_QUERY_PREFIX(paymentId)],
    })
    void refetchDocuments()
  }, [paymentId, queryClient, refetchDocuments])

  const openDocumentManager = useCallback(
    (lineItemNo: number, remarks: string) => {
      if (!isSavedPayment) {
        toast.error("Save the petty cash voucher before adding documents")
        return
      }
      setDocContextItemNo(lineItemNo)
      setDocContextRemarks(remarks)
      setDocManagerOpen(true)
    },
    [isSavedPayment]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wrapper functions to convert string to number
  const handleDelete = (itemId: string) => {
    if (onDeleteAction) {
      onDeleteAction(Number(itemId))
    }
  }

  const handleBulkDelete = (selectedIds: string[]) => {
    if (onBulkDeleteAction) {
      onBulkDeleteAction(selectedIds.map((id) => Number(id)))
    }
  }

  // Column placed first so it appears immediately to the right of the sticky Actions column
  const lineDocsColumn: ColumnDef<ICbPettyCashDt> = {
    id: "lineDocuments",
    header: "Docs",
    size: 88,
    minSize: 80,
    cell: ({ row }: { row: { original: ICbPettyCashDt } }) => {
      const n = row.original.itemNo
      const count = docCountByItemNo.get(n) ?? 0
      const hasDocs = count > 0
      return (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer gap-0.5 px-1"
            onClick={() => openDocumentManager(n, row.original.remarks ?? "")}
            title={
              hasDocs
                ? `${count} document(s) — open document manager`
                : "No documents — open document manager"
            }
          >
            <Paperclip
              className={cn(
                "size-3.5 shrink-0",
                hasDocs
                  ? "text-green-600"
                  : "text-muted-foreground"
              )}
            />
            {hasDocs && (
              <span
                className={cn(
                  "text-xs",
                  "text-green-600"
                )}
              >
                ({count})
              </span>
            )}
          </Button>
        </div>
      )
    },
  }

  // Define columns with visible prop checks
  const columns: ColumnDef<ICbPettyCashDt>[] = [
    lineDocsColumn,
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }: { row: { original: ICbPettyCashDt } }) => (
        <div className="truncate text-right">{row.original.seqNo}</div>
      ),
    },
    {
      accessorKey: "glCode",
      header: "Code",
      size: 100,
    },
    {
      accessorKey: "glName",
      header: "Account",
      size: 100,
    },
    ...(visible?.m_InvoiceDate
      ? [
          {
            accessorKey: "invoiceDate",
            header: "Invoice Date",
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => {
              const dateValue = row.getValue("invoiceDate")
              if (!dateValue) return "-"

              let date: Date | null = null
              if (typeof dateValue === "string") {
                date = parseDate(dateValue)
              } else if (dateValue instanceof Date) {
                date = dateValue
              }

              if (date && isValid(date)) {
                return format(date, dateFormat)
              }
              return "-"
            },
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_InvoiceNo
      ? [
          {
            accessorKey: "invoiceNo",
            header: "Invoice No",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_SupplierName
      ? [
          {
            accessorKey: "supplierName",
            header: "Supplier Name",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_Remarks
      ? [
          {
            accessorKey: "remarks",
            header: "Remarks",
            size: 200,
          },
        ]
      : []),

    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 100,
      cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totAmt"), amtDec)}
        </div>
      ),
    },

    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstPercentage",
            header: "VAT %",
            size: 50,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstPercentage"), priceDec)}
              </div>
            ),
          },
          {
            accessorKey: "gstAmt",
            header: "VAT Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstAmt"), amtDec)}
              </div>
            ),
          },
        ]
      : []),

    ...(visible?.m_DepartmentId
      ? [
          {
            accessorKey: "departmentName",
            header: "Department",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_JobOrderId
      ? [
          {
            accessorKey: "jobOrderNo",
            header: "Job Order",
            size: 100,
          },

          {
            accessorKey: "taskName",
            header: "Task",
            size: 100,
          },

          {
            accessorKey: "serviceItemNoName",
            header: "Service",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_GstNo
      ? [
          {
            accessorKey: "supplierRegNo",
            header: "TRN No",
            size: 100,
          },
        ]
      : []),
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 100,
      cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
        <div className="truncate text-right">
          {formatNumber(row.getValue("totLocalAmt"), locAmtDec)}
        </div>
      ),
    },

    ...(visible?.m_CtyCurr
      ? [
          {
            accessorKey: "totCtyAmt",
            header: "Country Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("totCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<ICbPettyCashDt>,
        ]
      : []),
    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstName",
            header: "Gst",
            size: 100,
          },
        ]
      : []),
    ...(visible?.m_GstId
      ? [
          {
            accessorKey: "gstLocalAmt",
            header: "VAT Local Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstLocalAmt"), locAmtDec)}
              </div>
            ),
          },
        ]
      : []),
    ...(visible?.m_CtyCurr && visible?.m_GstId
      ? [
          {
            accessorKey: "gstCtyAmt",
            header: "GST Country Amount",
            size: 100,
            cell: ({ row }: CellContext<ICbPettyCashDt, unknown>) => (
              <div className="truncate text-right">
                {formatNumber(row.getValue("gstCtyAmt"), locAmtDec)}
              </div>
            ),
          } as ColumnDef<ICbPettyCashDt>,
        ]
      : []),

    ...(visible?.m_ServiceCategoryId
      ? [
          {
            accessorKey: "serviceCategoryName",
            header: "Service Category",
            size: 100,
          },
        ]
      : []),

    ...(visible?.m_EmployeeId
      ? [
          {
            accessorKey: "employeeName",
            header: "Employee",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_PortId
      ? [
          {
            accessorKey: "portName",
            header: "Port",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_VesselId
      ? [
          {
            accessorKey: "vesselName",
            header: "Vessel",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_BargeId
      ? [
          {
            accessorKey: "bargeName",
            header: "Barge",
            size: 200,
          },
        ]
      : []),
    ...(visible?.m_VoyageId
      ? [
          {
            accessorKey: "voyageNo",
            header: "Voyage",
            size: 200,
          },
        ]
      : []),
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }: { row: { original: ICbPettyCashDt } }) => (
        <div className="truncate text-right">{row.original.itemNo}</div>
      ),
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full px-2 pt-1 pb-2">
      <AccountBaseTablev1
        data={data}
        columns={columns}
        moduleId={ModuleId.cb}
        transactionId={CBTransactionId.cbpettycash}
        tableName={TableName.cbPettyCashDt}
        emptyMessage="No cbPettyCash details found."
        accessorId="itemNo"
        enableSorting={false}
        onRefreshAction={onRefreshAction}
        onFilterChange={onFilterChange}
        onBulkDeleteAction={handleBulkDelete}
        onBulkSelectionChange={() => {}}
        onDataReorder={onDataReorder}
        onEditAction={onEditAction}
        onDeleteAction={handleDelete}
        onCloneAction={onCloneAction}
        showHeader={true}
        showActions={true}
        hideEdit={isCancelled}
        hideDelete={isCancelled}
        hideCheckbox={isCancelled}
        disableOnAccountExists={false}
        maxHeight="220px"
        pageSizeOption={12}
        freezeSecondColumn={true}
      />
      <div
        className="mt-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-t-0 border-border/80 bg-muted/30 px-2 py-2 text-xs"
        data-testid="cbpettycash-details-table-footer"
      >
        <span className="shrink-0">Total Lines: {data.length}</span>
        <div className="text-muted-foreground flex min-w-0 flex-1 flex-wrap items-center justify-center gap-4 sm:gap-6">
          <span className="inline-flex items-center gap-1.5">
            <Paperclip
              className="size-3.5 shrink-0 text-green-600"
              aria-hidden
            />
            <span>Documents Available</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Paperclip
              className="text-muted-foreground size-3.5 shrink-0"
              aria-hidden
            />
            <span>No Documents</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Circle
              className="size-3.5 shrink-0 text-orange-500"
              strokeWidth={2}
            />
            <span>No Invoice Linked</span>
          </span>
        </div>
        <span className="text-primary shrink-0 text-sm font-semibold">
          Total Amount: {formatNumber(lineTotal, amtDec)} {currencyCode}
        </span>
      </div>
      <Dialog
        open={docManagerOpen}
        onOpenChange={(open) => {
          setDocManagerOpen(open)
          if (!open) {
            setDocContextItemNo(null)
            setDocContextRemarks("")
            invalidateLineDocuments()
          }
        }}
      >
        <DialogContent
          className="flex h-[min(90vh,880px)] w-[min(100vw-1rem,72rem)] max-w-none sm:max-w-none flex-col gap-0 overflow-hidden p-0"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b px-4 py-4 pr-14 sm:pr-12">
            <DialogTitle>
              Document manager
              {paymentNo ? ` — ${paymentNo}` : ""}
              {docContextItemNo != null
                ? ` (line ${docContextItemNo})`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {isSavedPayment && (
              <DocumentManager
                moduleId={ModuleId.cb}
                transactionId={CBTransactionId.cbpettycash}
                recordId={paymentId}
                recordNo={paymentNo}
                companyId={companyId}
                maxFileSize={10}
                maxFiles={10}
                defaultDocTypeKeyword="invoice"
                defaultRemarks={docContextRemarks}
                onUploadSuccess={invalidateLineDocuments}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
