import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useParams } from "next/navigation"
import { ICbBankReconDt } from "@/interfaces"
import { IVisibleFields } from "@/interfaces/setting"
import { usePermissionStore } from "@/stores/permission-store"
import { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse, startOfToday } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import {
  APTransactionId,
  ARTransactionId,
  CBTransactionId,
  GLTransactionId,
  ModuleId,
  TableName,
  cn,
} from "@/lib/utils"
import { parseDate as parseClientDate } from "@/lib/date-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AccountEditableBaseTable } from "@/components/table/table-account-editable"

// Extended column definition with hide property
import { useCompanyStore } from "@/stores/company-store"
type ExtendedColumnDef<T> = ColumnDef<T> & {
  hidden?: boolean
}

// Use flexible data type that can work with form data
interface BankReconDetailsTableProps {
  data: ICbBankReconDt[]
  onDeleteAction?: (itemNo: number) => void
  onBulkDeleteAction?: (selectedItemNos: number[]) => void
  onRefreshAction?: () => void
  onFilterChange?: (filters: { search?: string; sortOrder?: string }) => void
  onDataReorder?: (newData: ICbBankReconDt[]) => void
  onCellUpdate?: (
    itemNo: number,
    field: keyof ICbBankReconDt,
    value: string | Date | boolean
  ) => void
  visible: IVisibleFields
}

export default function BankReconDetailsTable({
  data,
  onDeleteAction,
  onBulkDeleteAction,
  onRefreshAction,
  onFilterChange,
  onDataReorder,
  onCellUpdate,
  visible: _visible,
}: BankReconDetailsTableProps) {
  const params = useParams()
  const companyId = useMemo(() => {
    const value = params?.companyId
    return typeof value === "string" && value.trim() ? value.trim() : null
  }, [params])

  const { decimals } = useCompanyStore()
  const { hasPermission } = usePermissionStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const exhRateDec = decimals[0]?.exhRateDec || 6
  const dateFormat = decimals[0]?.dateFormat || "dd/MM/yyyy"

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper: format any date-like value using decimal date format
  const formatCellDate = useCallback(
    (value: Date | string | null | undefined): string => {
      if (!value) return "-"

      let date: Date | null = null

      if (value instanceof Date) {
        date = isValid(value) ? value : null
      } else if (typeof value === "string") {
        // 1) Try decimals dateFormat first
        try {
          const parsed = parse(value, dateFormat, new Date())
          if (isValid(parsed) && !isNaN(parsed.getTime())) {
            date = parsed
          }
        } catch {
          // ignore and try next strategy
        }

        // 2) Fall back to shared client parser (supports multiple formats)
        if (!date) {
          const parsed = parseClientDate(value)
          if (parsed && isValid(parsed) && !isNaN(parsed.getTime())) {
            date = parsed
          }
        }
      }

      if (!date || !isValid(date) || isNaN(date.getTime())) {
        return "-"
      }

      return format(date, dateFormat)
    },
    [dateFormat]
  )

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

  const canNavigateToTransaction = useCallback(
    (moduleIdValue: number, transactionIdValue: number) => {
      if (!Number.isFinite(moduleIdValue)) return false
      if (!Number.isFinite(transactionIdValue)) return false
      return hasPermission(moduleIdValue, transactionIdValue, "isRead")
    },
    [hasPermission]
  )

  const getTargetPath = useCallback(
    (moduleIdValue: number, transactionIdValue: number): string | null => {
      if (!companyId) return null

      switch (moduleIdValue) {
        case ModuleId.ar:
          switch (transactionIdValue) {
            case ARTransactionId.invoice:
              return `/${companyId}/ar/invoice`
            case ARTransactionId.invoicectm:
              return `/${companyId}/ar/invoicectm`
            case ARTransactionId.debitNote:
              return `/${companyId}/ar/debitnote`
            case ARTransactionId.creditNote:
              return `/${companyId}/ar/creditnote`
            case ARTransactionId.adjustment:
              return `/${companyId}/ar/adjustment`
            case ARTransactionId.receipt:
              return `/${companyId}/ar/receipt`
            case ARTransactionId.refund:
              return `/${companyId}/ar/refund`
            case ARTransactionId.docsetoff:
              return `/${companyId}/ar/docsetoff`
            default:
              return null
          }
        case ModuleId.ap:
          switch (transactionIdValue) {
            case APTransactionId.invoice:
              return `/${companyId}/ap/invoice`
            case APTransactionId.debitNote:
              return `/${companyId}/ap/debitnote`
            case APTransactionId.creditNote:
              return `/${companyId}/ap/creditnote`
            case APTransactionId.adjustment:
              return `/${companyId}/ap/adjustment`
            case APTransactionId.payment:
              return `/${companyId}/ap/payment`
            case APTransactionId.refund:
              return `/${companyId}/ap/refund`
            case APTransactionId.docsetoff:
              return `/${companyId}/ap/docsetoff`
            default:
              return null
          }
        case ModuleId.cb:
          switch (transactionIdValue) {
            case CBTransactionId.cbgenreceipt:
              return `/${companyId}/cb/cbgenreceipt`
            case CBTransactionId.cbgenpayment:
              return `/${companyId}/cb/cbgenpayment`
            case CBTransactionId.cbpettycash:
              return `/${companyId}/cb/cbpettycash`
            case CBTransactionId.cbbanktransfer:
              return `/${companyId}/cb/cbbanktransfer`
            case CBTransactionId.cbbanktransferctm:
              return `/${companyId}/cb/cbbanktransferctm`
            case CBTransactionId.cbbankrecon:
              return `/${companyId}/cb/cbbankrecon`
            default:
              return null
          }
        case ModuleId.gl:
          switch (transactionIdValue) {
            case GLTransactionId.journalentry:
              return `/${companyId}/gl/journalentry`
            case GLTransactionId.arapcontra:
              return `/${companyId}/gl/arapcontra`
            default:
              return null
          }
        default:
          return null
      }
    },
    [companyId]
  )

  const getStorageKey = useCallback((targetPath: string | null) => {
    return targetPath ? `history-doc:${targetPath}` : null
  }, [])

  const handleDocumentNavigation = useCallback(
    (detail: ICbBankReconDt) => {
      const moduleIdValue = Number(detail.moduleId)
      const transactionIdValue = Number(detail.transactionId)
      const documentId = detail.documentId?.toString().trim()

      if (
        !documentId ||
        !Number.isFinite(moduleIdValue) ||
        !Number.isFinite(transactionIdValue)
      ) {
        return
      }

      const targetPath = getTargetPath(moduleIdValue, transactionIdValue)
      if (!targetPath) return

      if (typeof window !== "undefined") {
        const storageKey = getStorageKey(targetPath)
        if (storageKey) {
          window.localStorage.setItem(storageKey, documentId)
        }
        window.open(targetPath, "_blank", "noopener,noreferrer")
      }
    },
    [getStorageKey, getTargetPath]
  )

  // Standalone date picker component for table cells (mimics CustomDateNew)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future table cell date editing
  const StandaloneDatePicker = ({
    value,
    onChange,
  }: {
    value: Date | null | undefined
    onChange: (date: Date | null) => void
  }) => {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [month, setMonth] = useState<Date | undefined>(undefined)
    const inputRef = useRef<HTMLInputElement>(null)

    // Format date for display
    const formatDateForDisplay = useCallback(
      (date: Date | undefined): string => {
        if (!date || !isValid(date)) return ""
        return format(date, dateFormat)
      },
      // dateFormat is an outer scope value that doesn't need to be in dependencies
      []
    )

    // Parse user input string to Date
    const parseUserInput = (input: string): Date | undefined => {
      if (!input || input.trim() === "") return undefined

      const formats = [
        dateFormat,
        "dd/MM/yyyy",
        "dd-MM-yyyy",
        "dd.MM.yyyy",
        "yyyy-MM-dd",
        "MM/dd/yyyy",
      ]

      for (const fmt of formats) {
        try {
          const parsed = parse(input, fmt, new Date())
          if (isValid(parsed) && !isNaN(parsed.getTime())) {
            return parsed
          }
        } catch {
          continue
        }
      }
      return undefined
    }

    // Initialize input value from prop
    useEffect(() => {
      if (value) {
        const date = value instanceof Date ? value : new Date(value)
        if (isValid(date) && !isNaN(date.getTime())) {
          setInputValue(formatDateForDisplay(date))
          setMonth(date)
        } else {
          setInputValue("")
        }
      } else {
        setInputValue("")
      }
    }, [value, formatDateForDisplay])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      setInputValue(inputVal)

      const parsedDate = parseUserInput(inputVal)
      if (parsedDate && isValid(parsedDate) && !isNaN(parsedDate.getTime())) {
        const formattedDate = formatDateForDisplay(parsedDate)
        setInputValue(formattedDate)
        setMonth(parsedDate)
        onChange(parsedDate)
      } else if (inputVal === "") {
        onChange(null)
      }
    }

    const handleInputBlur = () => {
      const parsedDate = parseUserInput(inputValue)
      if (parsedDate && isValid(parsedDate) && !isNaN(parsedDate.getTime())) {
        const formattedDate = formatDateForDisplay(parsedDate)
        setInputValue(formattedDate)
        onChange(parsedDate)
      } else if (inputValue === "") {
        onChange(null)
      } else {
        // Invalid date - reset to current value
        if (value) {
          const date = value instanceof Date ? value : new Date(value)
          if (isValid(date) && !isNaN(date.getTime())) {
            setInputValue(formatDateForDisplay(date))
          } else {
            setInputValue("")
          }
        } else {
          setInputValue("")
        }
      }
    }

    const handleCalendarSelect = (date: Date | undefined) => {
      if (date) {
        const formattedDate = formatDateForDisplay(date)
        setInputValue(formattedDate)
        setMonth(date)
        onChange(date)
        setOpen(false)
      }
    }

    const handleClear = () => {
      setInputValue("")
      onChange(null)
    }

    const handleTodayClick = () => {
      const today = startOfToday()
      const formattedDate = formatDateForDisplay(today)
      setInputValue(formattedDate)
      setMonth(today)
      onChange(today)
      setOpen(false)
    }

    const currentDate = value
      ? value instanceof Date
        ? value
        : new Date(value)
      : undefined

    return (
      <div className="relative flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          disabled={false}
          placeholder={dateFormat}
          className={cn(
            "hover:border-input focus:border-primary h-7 border-transparent bg-transparent px-2 pr-10 text-sm"
          )}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={(e) => {
            e.currentTarget.select()
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
            if (e.key === "Escape") {
              setOpen(false)
            }
          }}
        />

        {/* Clear Button */}
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            tabIndex={-1}
            className="absolute top-1/2 right-10 size-6 -translate-y-1/2 p-0"
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear date</span>
          </Button>
        )}

        {/* Calendar Popover */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              tabIndex={-1}
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={
                currentDate && isValid(currentDate) ? currentDate : undefined
              }
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect}
              fromYear={new Date().getFullYear() - 100}
              toYear={new Date().getFullYear() + 2}
              initialFocus
            />
            {/* Footer with Today button */}
            <div className="border-t p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleTodayClick}
              >
                Today
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Define columns - all fields from ICbBankReconDt in interface order
  const columns: ExtendedColumnDef<ICbBankReconDt>[] = [
    {
      accessorKey: "reconId",
      header: "Recon ID",
      size: 80,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.reconId ?? "-"}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "reconNo",
      header: "Recon No",
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.reconNo ?? "-"}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "isSel",
      header: "Sel",
      size: 50,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.original.isSel || false}
            onCheckedChange={(checked) => {
              if (onCellUpdate) {
                onCellUpdate(row.original.itemNo, "isSel", checked === true)
              }
            }}
            className="cursor-pointer"
          />
        </div>
      ),
    },
    {
      accessorKey: "moduleId",
      header: "Module",
      size: 70,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.moduleId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "transactionId",
      header: "Trans",
      size: 70,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.transactionId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "documentId",
      header: "Doc ID",
      size: 80,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.documentId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "documentNo",
      header: "Document No",
      size: 150,
      cell: ({ row }: { row: { original: ICbBankReconDt } }) => {
        const docNo = row.original.documentNo?.toString().trim() || ""
        const isClickable = !!docNo
        const moduleIdValue = Number(row.original.moduleId)
        const transactionIdValue = Number(row.original.transactionId)
        const canViewDocument =
          isClickable &&
          canNavigateToTransaction(moduleIdValue, transactionIdValue)

        const handleActivate = () => {
          if (canViewDocument) {
            handleDocumentNavigation(row.original)
          }
        }

        const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
          if (!canViewDocument) return

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleActivate()
          }
        }

        return canViewDocument ? (
          <button
            type="button"
            onDoubleClick={handleActivate}
            onKeyDown={handleKeyDown}
            className="text-orange-500 underline decoration-orange-500 decoration-dotted underline-offset-2 hover:text-orange-600 hover:decoration-solid"
          >
            {docNo}
          </button>
        ) : docNo ? (
          <span className="text-muted-foreground">{docNo}</span>
        ) : (
          "-"
        )
      },
    },
    {
      accessorKey: "docReferenceNo",
      header: "Doc Reference",
      size: 120,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.docReferenceNo ?? "-"}</div>
      ),
    },
    {
      accessorKey: "accountDate",
      header: "Account Date",
      size: 100,
      cell: ({ row }) => {
        return formatCellDate(row.original.accountDate as unknown as
          | Date
          | string
          | null
          | undefined)
      },
    },
    {
      accessorKey: "paymentTypeId",
      header: "Payment Type ID",
      size: 80,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.paymentTypeId}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "paymentTypeName",
      header: "Payment Type",
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.paymentTypeName ?? "-"}</div>
      ),
    },
    {
      accessorKey: "chequeNo",
      header: "Cheque No",
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.chequeNo ?? "-"}</div>
      ),
    },
    {
      accessorKey: "chequeDate",
      header: "Cheque Date",
      size: 100,
      cell: ({ row }) => {
        return formatCellDate(row.original.chequeDate as unknown as
          | Date
          | string
          | null
          | undefined)
      },
    },
    {
      accessorKey: "customerId",
      header: "Customer",
      size: 80,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.customerId ?? "-"}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "supplierId",
      header: "Supplier",
      size: 80,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.supplierId ?? "-"}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "glId",
      header: "GL Account",
      size: 80,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.glId ?? "-"}</div>
      ),
      hidden: true,
    },
    {
      accessorKey: "isDebit",
      header: "Dr/Cr",
      size: 60,
      cell: ({ row }) => (
        <Badge variant={row.original.isDebit ? "default" : "destructive"}>
          {row.original.isDebit ? "Debit" : "Credit"}
        </Badge>
      ),
    },
    {
      accessorKey: "exhRate",
      header: "Ex. Rate",
      size: 100,
      cell: ({ row }) => (
        <div className="truncate text-right">
          {(row.original.exhRate ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: exhRateDec,
            maximumFractionDigits: exhRateDec,
          })}
        </div>
      ),
    },

    {
      accessorKey: "debitAmt",
      header: "Debit Amt",
      size: 120,
      cell: ({ row }) => {
        const value = row.original.isDebit ? (row.original.totAmt ?? 0) : 0
        return (
          <div className="truncate text-right">
            {value.toLocaleString(undefined, {
              minimumFractionDigits: amtDec,
              maximumFractionDigits: amtDec,
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "creditAmt",
      header: "Credit Amt",
      size: 120,
      cell: ({ row }) => {
        const value = !row.original.isDebit ? (row.original.totAmt ?? 0) : 0
        return (
          <div className="truncate text-right">
            {value.toLocaleString(undefined, {
              minimumFractionDigits: amtDec,
              maximumFractionDigits: amtDec,
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "debitLocalAmt",
      header: "Debit Local",
      size: 120,
      cell: ({ row }) => {
        const value = row.original.isDebit ? (row.original.totLocalAmt ?? 0) : 0
        return (
          <div className="truncate text-right">
            {value.toLocaleString(undefined, {
              minimumFractionDigits: locAmtDec,
              maximumFractionDigits: locAmtDec,
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "creditLocalAmt",
      header: "Credit Local",
      size: 120,
      cell: ({ row }) => {
        const value = !row.original.isDebit
          ? (row.original.totLocalAmt ?? 0)
          : 0
        return (
          <div className="truncate text-right">
            {value.toLocaleString(undefined, {
              minimumFractionDigits: locAmtDec,
              maximumFractionDigits: locAmtDec,
            })}
          </div>
        )
      },
    },
    {
      accessorKey: "trnType",
      header: "Trn Type",
      size: 80,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.trnType ?? "-"}</div>
      ),
    },
    {
      accessorKey: "paymentFromTo",
      header: "Payment From/To",
      size: 150,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.paymentFromTo ?? "-"}</div>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 200,
      cell: ({ row }) => (
        <div className="text-sm">{row.original.remarks ?? "-"}</div>
      ),
    },
    {
      accessorKey: "editVersion",
      header: "Ver",
      size: 50,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.editVersion ?? 0}</div>
      ),
    },
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 120,
      cell: ({ row }) => (
        <div className="truncate text-right">
          {(row.original.totAmt ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: amtDec,
            maximumFractionDigits: amtDec,
          })}
        </div>
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 120,
      cell: ({ row }) => (
        <div className="truncate text-right">
          {(row.original.totLocalAmt ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: locAmtDec,
            maximumFractionDigits: locAmtDec,
          })}
        </div>
      ),
    },
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.seqNo ?? "-"}</div>
      ),
    },
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
      cell: ({ row }) => (
        <div className="truncate text-right">{row.original.itemNo}</div>
      ),
    },
  ]

  // Filter out columns with hidden: true
  const visibleColumns = columns.filter((column) => !column.hidden)

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <AccountEditableBaseTable
      data={data as unknown[]}
      columns={visibleColumns as ColumnDef<unknown>[]}
      accessorId={"itemNo" as keyof unknown}
      onDeleteAction={handleDelete}
      onBulkDeleteAction={handleBulkDelete}
      onRefreshAction={onRefreshAction}
      onFilterChange={onFilterChange}
      onDataReorder={(newData) => onDataReorder?.(newData as ICbBankReconDt[])}
      tableName={TableName.cbBankReconDt}
      emptyMessage="No reconciliation details. Add transactions to reconcile."
      hideEdit={true}
      showActions={false}
    />
  )
}
