"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useLoadTariffLines } from "@/hooks/usePdaTariff"
import {
  useApprovePda,
  useClonePda,
  useCreatePda,
  useDeletePda,
  usePdaById,
  useUpdatePda,
} from "@/hooks/usePda"
import { IPdaDt, IPdaHd, PDA_STATUS } from "@/interfaces/IPda"
import { PdaHdFormValues, pdaHdSchema } from "@/schemas/pdaSchema"
import { usePdaStore } from "@/stores/usePdaStore"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { PdaActionButtons } from "./PdaActionButtons"
import { PdaChargeGrid } from "./PdaChargeGrid"
import { PdaConvertToDaDialog } from "./PdaConvertToDaDialog"
import { PdaHeaderForm } from "./PdaHeaderForm"
import { PdaHistory } from "./PdaHistory"
import { PdaLoadTariffDialog } from "./PdaLoadTariffDialog"
import { PdaStatusBadge } from "./PdaStatusBadge"
import { PdaTimeline } from "./PdaTimeline"

interface PdaEditorPageProps {
  mode: "create" | "detail"
  pdaId?: number
}

const EMPTY_HEADER: IPdaHd = {
  companyId: 0,
  pdaId: 0,
  pdaNo: "AUTO",
  jobOrderId: 0,
  jobOrderNo: "",
  vesselId: 0,
  vesselName: "",
  customerId: 0,
  customerName: "",
  portId: 0,
  portName: "",
  etaDate: null,
  etdDate: null,
  currencyId: 0,
  currencyCode: "",
  exchRate: 1,
  typeOfCall: "",
  basisOfPda: "",
  totalAmount: 0,
  vatAmount: 0,
  advanceReceived: 0,
  grandTotal: 0,
  status: PDA_STATUS.DRAFT,
  remarks: "",
  createById: 0,
  createDate: "",
  editById: null,
  editDate: null,
  isActive: true,
}

export function PdaEditorPage({ mode, pdaId = 0 }: PdaEditorPageProps) {
  const params = useParams()
  const router = useRouter()
  const companyId = Number(params.companyId || 0)
  const isCreateMode = mode === "create"

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false)
  const [loadTariffOpen, setLoadTariffOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [loadTariffEnabled, setLoadTariffEnabled] = useState(false)
  const [previewTariffLines, setPreviewTariffLines] = useState<IPdaDt[]>([])

  const form = useForm<PdaHdFormValues>({
    resolver: zodResolver(pdaHdSchema),
    defaultValues: {
      pdaNo: "",
      pdaDate: "",
      jobOrderId: 0,
      vesselId: 0,
      customerId: 0,
      portId: 0,
      status: PDA_STATUS.DRAFT,
      currencyId: 0,
      exchRate: 1,
      typeOfCall: "",
      basisOfPda: "",
      etaDate: null,
      etdDate: null,
      advanceReceived: 0,
      remarks: "",
      details: [],
    },
  })

  const { data: pdaResponse, isLoading: isLoadingById } = usePdaById(pdaId)
  const createMutation = useCreatePda()
  const updateMutation = useUpdatePda()
  const deleteMutation = useDeletePda()
  const approveMutation = useApprovePda()
  const cloneMutation = useClonePda()

  const {
    chargeLines,
    currentPda,
    setCurrentPda,
    setChargeLines,
    addSectionWithSubRow,
    addSubRowToSection,
    updateChargeLine,
    deleteChargeLine,
    calculateTotals,
  } = usePdaStore()

  const tariffRequest = useMemo(
    () => ({
      companyId,
      customerId: currentPda?.customerId || 0,
      portId: currentPda?.portId || 0,
      taskId: 0,
      jobOrderId: form.watch("jobOrderId") || 0,
    }),
    [companyId, currentPda?.customerId, currentPda?.portId, form]
  )

  const { data: tariffResponse, isFetching: isLoadingTariff } =
    useLoadTariffLines(tariffRequest, loadTariffEnabled)

  useEffect(() => {
    if (isCreateMode) {
      setCurrentPda({ ...EMPTY_HEADER, companyId })
      return
    }
    if (!pdaResponse?.data) return

    const payload = pdaResponse.data as unknown as IPdaHd & {
      details?: IPdaDt[]
    }
    const normalizedDetails = (payload.details || []).map((line) => ({
      ...line,
      rowType: Number(line.rowType ?? 0),
      parentItemNo: line.parentItemNo ?? null,
    }))
    setCurrentPda(payload)
    setChargeLines(normalizedDetails)
    form.reset({
      pdaNo: payload.pdaNo || "",
      pdaDate: payload.createDate || "",
      jobOrderId: payload.jobOrderId || 0,
      vesselId: payload.vesselId || 0,
      customerId: payload.customerId || 0,
      portId: payload.portId || 0,
      status: payload.status ?? PDA_STATUS.DRAFT,
      currencyId: payload.currencyId || 0,
      exchRate: payload.exchRate || 1,
      typeOfCall: payload.typeOfCall || "",
      basisOfPda: payload.basisOfPda || "",
      etaDate: payload.etaDate,
      etdDate: payload.etdDate,
      advanceReceived: payload.advanceReceived || 0,
      remarks: payload.remarks || "",
      details: normalizedDetails,
    })
  }, [
    isCreateMode,
    companyId,
    pdaResponse,
    setCurrentPda,
    setChargeLines,
    form,
  ])

  useEffect(() => {
    if (!tariffResponse?.data || !loadTariffEnabled) return
    setPreviewTariffLines(
      tariffResponse.data.map((line) => ({
        ...line,
        rowType: Number(line.rowType ?? 0),
        parentItemNo: line.parentItemNo ?? null,
      }))
    )
    setLoadTariffOpen(true)
    setLoadTariffEnabled(false)
  }, [tariffResponse, loadTariffEnabled])

  const isDraft = (currentPda?.status ?? PDA_STATUS.DRAFT) === PDA_STATUS.DRAFT

  const totals = calculateTotals()
  const advance = Number(form.watch("advanceReceived") || 0)
  const computedGrand = totals.subTotal + totals.vatAmount - advance

  const handleSave = async (values: PdaHdFormValues) => {
    const payload = {
      ...currentPda,
      ...values,
      companyId,
      pdaId: currentPda?.pdaId || 0,
      totalAmount: totals.subTotal,
      grandTotal: computedGrand,
      details: chargeLines,
    }

    try {
      if (isCreateMode) {
        await createMutation.mutateAsync(payload)
        toast.success("PDA created successfully")
      } else {
        await updateMutation.mutateAsync(payload)
        toast.success("PDA updated successfully")
      }
    } catch {
      toast.error("Failed to save PDA")
    }
  }

  const handleDelete = async () => {
    if (!currentPda?.pdaId) return
    try {
      await deleteMutation.mutateAsync({ companyId, pdaId: currentPda.pdaId })
      toast.success("PDA deleted successfully")
      router.push(`/${companyId}/operations/pda`)
    } catch {
      toast.error("Delete failed")
    }
  }

  const handleApprove = async () => {
    if (!currentPda?.pdaId) return
    try {
      await approveMutation.mutateAsync({ companyId, pdaId: currentPda.pdaId })
      setCurrentPda({ ...currentPda, status: PDA_STATUS.APPROVED })
      setConfirmApproveOpen(false)
      toast.success("PDA approved")
    } catch {
      toast.error("Approve failed")
    }
  }

  const handleClone = async () => {
    if (!currentPda?.pdaId) return
    try {
      await cloneMutation.mutateAsync({ companyId, pdaId: currentPda.pdaId })
      toast.success("PDA cloned")
      router.push(`/${companyId}/operations/pda`)
    } catch {
      toast.error("Clone failed")
    }
  }

  const handlePrint = () => {
    if (!currentPda?.pdaId) return
    window.open(
      `/Pda/Print?companyId=${companyId}&pdaId=${currentPda.pdaId}`,
      "_blank"
    )
  }

  if (!isCreateMode && isLoadingById) {
    return (
      <div className="text-muted-foreground p-4 text-sm">Loading PDA...</div>
    )
  }

  return (
    <div className="@container space-y-3 p-3">
      <Form {...form}>
        <form className="space-y-3" onSubmit={form.handleSubmit(handleSave)}>
          <Tabs defaultValue="summary" className="space-y-3">
            <div className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-20 rounded-md border px-2 py-1.5 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <TabsList className="h-8 shrink-0 gap-0.5 p-[3px]">
                    <TabsTrigger value="summary" className="px-2.5 py-1 text-xs">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="charges" className="px-2.5 py-1 text-xs">
                      Charges
                    </TabsTrigger>
                    <TabsTrigger value="history" className="px-2.5 py-1 text-xs">
                      History & Timeline
                    </TabsTrigger>
                  </TabsList>
                  <Badge variant="outline" className="h-6 text-[11px]">
                    {currentPda?.pdaNo || "PDA NEW"}
                  </Badge>
                  <PdaStatusBadge status={currentPda?.status ?? PDA_STATUS.DRAFT} />
                </div>

                <PdaActionButtons
                  canEdit={isDraft}
                  canApprove={isDraft && !isCreateMode}
                  onPrint={handlePrint}
                  onClone={handleClone}
                  onDelete={() => setConfirmDeleteOpen(true)}
                  onUpdate={form.handleSubmit(handleSave)}
                  onApprove={() => setConfirmApproveOpen(true)}
                />
              </div>
            </div>

            <TabsContent
              value="summary"
              className="bg-card rounded-lg border p-4"
            >
              <PdaHeaderForm
                form={form}
              />
            </TabsContent>

            <TabsContent
              value="charges"
              className="bg-card space-y-3 rounded-lg border p-4"
            >
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!form.watch("jobOrderId")}
                  onClick={() => setLoadTariffEnabled(true)}
                >
                  Load from Tariff
                </Button>
                {currentPda?.status === PDA_STATUS.APPROVED ? (
                  <Button
                    type="button"
                    onClick={() => setConvertDialogOpen(true)}
                  >
                    Convert to DA
                  </Button>
                ) : null}
              </div>
              <PdaChargeGrid
                lines={chargeLines}
                vatAmount={currentPda?.vatAmount || 0}
                advanceReceived={form.watch("advanceReceived")}
                onAddSection={addSectionWithSubRow}
                onAddSubRow={addSubRowToSection}
                onDeleteRow={deleteChargeLine}
                onLineChange={updateChargeLine}
              />
            </TabsContent>

            <TabsContent
              value="history"
              className="bg-card rounded-lg border p-4"
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <PdaHistory pda={currentPda} />
                <PdaTimeline status={currentPda?.status ?? PDA_STATUS.DRAFT} />
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </Form>

      <DeleteConfirmation
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        itemName={currentPda?.pdaNo}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
      />

      <DeleteConfirmation
        open={confirmApproveOpen}
        onOpenChange={setConfirmApproveOpen}
        title={`Approve PDA ${currentPda?.pdaNo || ""}?`}
        description="This will be sent to customer."
        onConfirm={handleApprove}
        isDeleting={approveMutation.isPending}
      />

      <PdaLoadTariffDialog
        open={loadTariffOpen}
        lines={previewTariffLines}
        isLoading={isLoadingTariff}
        onOpenChange={setLoadTariffOpen}
        onConfirm={() => {
          setChargeLines(previewTariffLines)
          setLoadTariffOpen(false)
          toast.success("Tariff lines inserted")
        }}
      />

      <PdaConvertToDaDialog
        open={convertDialogOpen}
        pdaAmount={computedGrand}
        onOpenChange={setConvertDialogOpen}
        onConfirm={() => {
          setConvertDialogOpen(false)
          setCurrentPda({
            ...(currentPda || EMPTY_HEADER),
            status: PDA_STATUS.CONVERTED,
          })
          toast.success("DA created from PDA")
        }}
      />
    </div>
  )
}
