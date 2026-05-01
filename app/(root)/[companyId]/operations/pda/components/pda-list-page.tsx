"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { useCustomerLookup, usePortLookup } from "@/hooks/use-lookup"
import {
  useApprovePda,
  useClonePda,
  useDeletePda,
  usePdaList,
} from "@/hooks/usePda"
import { IPdaFilter, IPdaHd, PDA_STATUS } from "@/interfaces/IPda"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { PdaOperationsTable } from "./PdaOperationsTable"

export function PdaListPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = Number(params.companyId || 0)

  const [searchText, setSearchText] = useState("")
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [portId, setPortId] = useState<number | undefined>(undefined)
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [pageNumber, setPageNumber] = useState(1)
  const [selectedRow, setSelectedRow] = useState<IPdaHd | null>(null)

  const filter: IPdaFilter = {
    companyId,
    searchText,
    status,
    portId,
    customerId,
    fromDate,
    toDate,
    pageNumber,
    pageSize: 20,
  }

  const { data: pdaResponse, isLoading, refetch } = usePdaList(filter)
  const cloneMutation = useClonePda()
  const approveMutation = useApprovePda()
  const deleteMutation = useDeletePda()
  const { data: ports = [] } = usePortLookup()
  const { data: customers = [] } = useCustomerLookup()

  const rows = useMemo(() => pdaResponse?.data || [], [pdaResponse?.data])

  const stats = useMemo(
    () => ({
      draft: rows.filter((x) => x.status === PDA_STATUS.DRAFT).length,
      approved: rows.filter((x) => x.status === PDA_STATUS.APPROVED).length,
      converted: rows.filter((x) => x.status === PDA_STATUS.CONVERTED).length,
      monthTotal: rows.reduce((sum, x) => sum + Number(x.grandTotal || 0), 0),
    }),
    [rows]
  )

  const handleClone = async (row: IPdaHd) => {
    try {
      await cloneMutation.mutateAsync({ companyId, pdaId: row.pdaId })
      toast.success("PDA cloned successfully")
      refetch()
    } catch {
      toast.error("Clone failed")
    }
  }

  const handleApprove = async (row: IPdaHd) => {
    if (row.status !== PDA_STATUS.DRAFT) return
    try {
      await approveMutation.mutateAsync({ companyId, pdaId: row.pdaId })
      toast.success("PDA approved successfully")
      refetch()
    } catch {
      toast.error("Approve failed")
    }
  }

  const handleDelete = async () => {
    if (!selectedRow) return
    try {
      await deleteMutation.mutateAsync({ companyId, pdaId: selectedRow.pdaId })
      toast.success("PDA deleted successfully")
      setSelectedRow(null)
      refetch()
    } catch {
      toast.error("Delete failed")
    }
  }

  return (
    <div className="@container space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Proforma Disbursement Account</h1>
        <Button onClick={() => router.push(`/${companyId}/operations/pda/create`)}>
          New PDA
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-3 text-sm">
          <p className="text-muted-foreground">Draft</p>
          <p className="text-xl font-semibold">{stats.draft}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <p className="text-muted-foreground">Approved</p>
          <p className="text-xl font-semibold">{stats.approved}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <p className="text-muted-foreground">Converted</p>
          <p className="text-xl font-semibold">{stats.converted}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm">
          <p className="text-muted-foreground">Month Total</p>
          <p className="text-xl font-semibold">{stats.monthTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-6">
        <Input
          value={searchText}
          placeholder="Search PDA / Job Order / Vessel"
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          value={status === undefined ? "all" : String(status)}
          onValueChange={(v) => setStatus(v === "all" ? undefined : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={String(PDA_STATUS.DRAFT)}>Draft</SelectItem>
            <SelectItem value={String(PDA_STATUS.APPROVED)}>Approved</SelectItem>
            <SelectItem value={String(PDA_STATUS.CONVERTED)}>Converted</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={portId === undefined ? "all" : String(portId)}
          onValueChange={(v) => setPortId(v === "all" ? undefined : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Port" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ports</SelectItem>
            {ports.map((port) => (
              <SelectItem key={port.portId} value={String(port.portId)}>
                {port.portName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={customerId === undefined ? "all" : String(customerId)}
          onValueChange={(v) => setCustomerId(v === "all" ? undefined : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.customerId} value={String(customer.customerId)}>
                {customer.customerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={9} rowCount={8} withPagination={false} />
      ) : (
        <PdaOperationsTable
          data={rows}
          isLoading={isLoading}
          onSelectAction={(row) =>
            row && router.push(`/${companyId}/operations/pda/${row.pdaId}`)
          }
          onEditAction={(row) =>
            router.push(`/${companyId}/operations/pda/${row.pdaId}`)
          }
          onCloneAction={handleClone}
          onApproveAction={handleApprove}
          onDeleteAction={(pdaId) => {
            const row = rows.find((x) => x.pdaId.toString() === pdaId)
            setSelectedRow(row || null)
          }}
        />
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
          disabled={pageNumber === 1}
        >
          Previous
        </Button>
        <span className="text-sm">Page {pageNumber}</span>
        <Button variant="outline" onClick={() => setPageNumber((prev) => prev + 1)}>
          Next
        </Button>
      </div>

      <DeleteConfirmation
        open={!!selectedRow}
        onOpenChange={(open) => !open && setSelectedRow(null)}
        itemName={selectedRow?.pdaNo}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
