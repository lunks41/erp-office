"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { DocumentViewModel } from "@/interfaces/document-expiry-view-model"
import { useDocumentExpiryStore } from "@/stores/document-expiry-store"
import { Download, Plus, Search } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  useDeleteDocument,
  useDocumentsList,
} from "@/hooks/use-document-expiry"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { DocExpiryLookupFilterSelect } from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import { DocumentTable } from "@/app/(root)/[companyId]/document-expiry/components/document-table"

function exportCsv(rows: DocumentViewModel[]) {
  const headers = [
    "Title",
    "Type",
    "Category",
    "Expiry",
    "Status",
    "DaysUntilExpiry",
  ]
  const lines = rows.map((r) =>
    [
      r.title,
      r.documentTypeName ?? "",
      r.docCategoryName ?? "",
      r.expiryDate,
      r.docStatusName ?? "",
      String(r.daysUntilExpiry),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(",")
  )
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `documents-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function DocumentExpiryListPage() {
  const companyId = useParams().companyId as string
  const base = `/${companyId}/document-expiry`
  const searchParams = useSearchParams()
  const filter = searchParams.get("filter")

  const {
    filters,
    setSearch,
    setCategoryId,
    setTypeId,
    setPage,
    resetFilters,
  } = useDocumentExpiryStore()
  const deleteMutation = useDeleteDocument()
  const searchForm = useForm({ defaultValues: { search: filters.search } })

  useEffect(() => {
    searchForm.setValue("search", filters.search)
  }, [filters.search, searchForm])
  const [deleteTarget, setDeleteTarget] = useState<DocumentViewModel | null>(
    null
  )

  const queryParams = useMemo(
    () => ({
      pageNumber: filters.page,
      pageSize: filters.pageSize,
      search: filters.search || undefined,
      docTypeId: filters.typeId ?? undefined,
      docCategoryId: filters.categoryId ?? undefined,
      criticalOnly: filter === "critical",
      expiredOnly: filter === "expired",
      daysAhead: filter === "expiring" ? 30 : undefined,
    }),
    [filters, filter]
  )

  const { data, isLoading, isError, error, refetch } =
    useDocumentsList(queryParams)
  const rows = data?.data ?? []

  useEffect(() => {
    if (!isError) return
    const message =
      (error as { response?: { data?: string } })?.response?.data ??
      "Failed to load documents"
    toast.error(message)
  }, [isError, error])
  const total = data?.totalRecords ?? rows.length
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(String(deleteTarget.documentId))
      setDeleteTarget(null)
      refetch()
    } catch {
      toast.error("Delete failed")
    }
  }

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Documents
          </h1>
          <p className="text-muted-foreground text-sm">
            {total} record{total !== 1 ? "s" : ""}
            {filter ? ` · ${filter}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(rows)}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" asChild>
            <Link href={`${base}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Form {...searchForm}>
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-2.5 z-10 h-4 w-4" />
            <CustomInput
              form={searchForm}
              name="search"
              placeholder="Search title…"
              className="pl-8"
              onChangeEvent={(e) => setSearch(e.target.value)}
            />
          </div>
        </Form>
        <DocExpiryLookupFilterSelect
          kind="documentType"
          value={filters.typeId}
          onChange={setTypeId}
        />
        <DocExpiryLookupFilterSelect
          kind="documentCategory"
          value={filters.categoryId}
          onChange={setCategoryId}
        />
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          Reset
        </Button>
      </div>

      <DocumentTable
        rows={rows}
        isLoading={isLoading}
        onDelete={setDeleteTarget}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={filters.page <= 1}
          onClick={() => setPage(filters.page - 1)}
        >
          Previous
        </Button>
        <span className="text-muted-foreground text-sm">
          Page {filters.page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={filters.page >= totalPages}
          onClick={() => setPage(filters.page + 1)}
        >
          Next
        </Button>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate &quot;{deleteTarget?.title}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
