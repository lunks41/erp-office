"use client"

import { useCallback, useState } from "react"
import { IActivateAccountRequest, IActiveDocument } from "@/interfaces/admin"
import { ApiResponse } from "@/interfaces/auth"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { AdminActivation } from "@/lib/api-routes"
import { useGet, usePersist } from "@/hooks/use-common"
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
import { Spinner } from "@/components/ui/spinner"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { AccountsActivationTable } from "../components/accounts-activation-table"

export default function AdminActivationAccountPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState<string>("")
  const [confirmDoc, setConfirmDoc] = useState<IActiveDocument | null>(null)

  const {
    data: documentsResponse,
    refetch,
    isLoading,
  } = useGet<IActiveDocument>(
    AdminActivation.getCancelledDocuments,
    "admin-cancelled-documents",
    search?.trim() || undefined
  )

  const { data: documentsData = [] } =
    (documentsResponse as ApiResponse<IActiveDocument>) ?? {}

  const activateMutation = usePersist<IActivateAccountRequest>(
    AdminActivation.activateAccount
  )

  const handleFilterChange = useCallback(
    (filters: { search?: string; sortOrder?: string }) => {
      setSearch(filters.search ?? "")
    },
    []
  )

  const handleActivateClick = (doc: IActiveDocument) => {
    setConfirmDoc(doc)
  }

  const handleConfirmActivate = async () => {
    if (!confirmDoc) return
    const payload: IActivateAccountRequest = {
      documentType: confirmDoc.documentType,
      documentNo: confirmDoc.documentNo,
      documentId: confirmDoc.documentId,
      moduleId: confirmDoc.moduleId ?? null,
      transactionId: confirmDoc.transactionId ?? null,
    }
    try {
      const response = await activateMutation.mutateAsync(payload)
      if (response?.result === 1) {
        toast.success("Document activated successfully.")
        queryClient.invalidateQueries({
          queryKey: ["admin-cancelled-documents"],
        })
        refetch()
        setConfirmDoc(null)
      } else {
        toast.error(response?.message ?? "Failed to activate document.")
      }
    } catch {
      toast.error("Failed to activate document.")
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Accounts Activation
          </h1>
          <p className="text-muted-foreground text-sm">
            Activate cancelled account documents
          </p>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={10}
          filterCount={1}
          cellWidths={[
            "6rem",
            "10rem",
            "10rem",
            "8rem",
            "8rem",
            "8rem",
            "8rem",
            "8rem",
            "8rem",
            "12rem",
          ]}
          shrinkZero
        />
      ) : (
        <AccountsActivationTable
          data={Array.isArray(documentsData) ? documentsData : []}
          isLoading={isLoading}
          onActivate={handleActivateClick}
          onRefreshAction={refetch}
          onFilterChange={handleFilterChange}
          isActivating={activateMutation.isPending}
        />
      )}

      <AlertDialog
        open={!!confirmDoc}
        onOpenChange={(open) => !open && setConfirmDoc(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate document?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDoc ? (
                <>
                  Are you sure you want to activate document{" "}
                  <span className="font-semibold">{confirmDoc.documentNo}</span>
                  {confirmDoc.referenceNo ? (
                    <> (Ref: {confirmDoc.referenceNo})</>
                  ) : null}
                  ? This will make the document active again.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => setConfirmDoc(null)}
              disabled={activateMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending && (
                <Spinner className="mr-2" size="sm" />
              )}
              {activateMutation.isPending ? "Activating..." : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
