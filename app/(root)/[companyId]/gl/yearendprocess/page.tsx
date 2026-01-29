"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { IGLOpeningBalance } from "@/interfaces"
import { GLYearEndProcessRequestSchemaType } from "@/schemas/gl-yearendprocess"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { GLYearEndProcess } from "@/lib/api-routes"
import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId } from "@/lib/utils"
import { useGetById, usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SaveConfirmation } from "@/components/confirmation"

import History from "./components/history"
import Main, { type YearEndProcessTotals } from "./components/main-tab"
import { YearEndProcessFormRef } from "./components/yearendprocess-form"

export default function YearEndProcessPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const companyId = params.companyId as string

  const moduleId = ModuleId.gl
  const transactionId = GLTransactionId.yearendprocess

  const { hasPermission } = usePermissionStore()
  const { decimals } = useAuthStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [documentIdToFetch, setDocumentIdToFetch] = useState<
    string | undefined
  >(undefined)
  const [totals, setTotals] = useState<YearEndProcessTotals>({
    totDebitLocalAmt: 0,
    totCreditLocalAmt: 0,
  })
  const [pendingRequest, setPendingRequest] =
    useState<GLYearEndProcessRequestSchemaType | null>(null)
  const [activeTab, setActiveTab] = useState("main")
  const formRef = useRef<YearEndProcessFormRef>(null)

  useEffect(() => {
    const docId = searchParams.get("documentId")
    if (docId) {
      setDocumentIdToFetch(docId)
    }
  }, [searchParams])

  const { data: fetchedYearEndProcess } = useGetById<
    IGLOpeningBalance | IGLOpeningBalance[]
  >(GLYearEndProcess.getById, "gl-year-end-process", documentIdToFetch || "", {
    enabled: !!documentIdToFetch && documentIdToFetch !== "0",
  })

  const saveMutation = usePersist<GLYearEndProcessRequestSchemaType>(
    GLYearEndProcess.generate
  )

  const handleGenerate = async (
    requestData: GLYearEndProcessRequestSchemaType
  ) => {
    if (isSaving || saveMutation.isPending) {
      return
    }

    setIsSaving(true)

    try {
      const response = await saveMutation.mutateAsync(requestData)

      if (response.result === 1) {
        // The API should return IGLOpeningBalance[] array
        const yearEndData = response.data
        if (yearEndData) {
          // If data is returned, set documentId to fetch and display
          const firstItem = Array.isArray(yearEndData)
            ? yearEndData[0]
            : yearEndData
          if (firstItem && firstItem.documentId) {
            setDocumentIdToFetch(String(firstItem.documentId))
          }
        }

        setShowSaveConfirm(false)
        toast.success("Year end process generated successfully")
      } else {
        toast.error(response.message || "Failed to generate year end process")
      }
    } catch (error) {
      console.error("Generate error:", error)
      toast.error("Network error while generating year end process")
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateClick = (
    requestData: GLYearEndProcessRequestSchemaType
  ) => {
    setPendingRequest(requestData)
    setShowSaveConfirm(true)
  }

  const handleConfirmGenerate = async () => {
    if (pendingRequest) {
      await handleGenerate(pendingRequest)
      setPendingRequest(null)
    }
  }

  const isEdit = !!documentIdToFetch && documentIdToFetch !== "0"
  const locAmtDec = decimals[0]?.locAmtDec ?? 2

  const titleText = isEdit
    ? `GL Year End Process - Document: ${documentIdToFetch}`
    : "GL Year End Process (New)"

  return (
    <div className="@container flex flex-1 flex-col p-4">
      <Tabs
        defaultValue="main"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="history" disabled={!isEdit}>
                History
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="border-blue-200 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
              >
                DebitAmt: {formatNumber(totals.totDebitLocalAmt, locAmtDec)}
              </Badge>
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-800"
              >
                CreditAmt: {formatNumber(totals.totCreditLocalAmt, locAmtDec)}
              </Badge>

              <h1>
                <span
                  className={`relative inline-flex rounded-full p-[2px] transition-all ${
                    isEdit
                      ? "bg-gradient-to-r from-purple-500 to-blue-500"
                      : "animate-pulse bg-gradient-to-r from-purple-500 to-blue-500"
                  } `}
                >
                  <span className="inline-flex cursor-default items-center rounded-full px-3 py-1 text-xs font-medium text-white select-none">
                    {titleText}
                  </span>
                </span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowSaveConfirm(true)}
              disabled={
                !canView ||
                isSaving ||
                saveMutation.isPending ||
                (isEdit && !canEdit) ||
                (!isEdit && !canCreate)
              }
              className={isEdit ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSaving || saveMutation.isPending ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {isSaving || saveMutation.isPending
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                  ? "Update"
                  : "Save"}
            </Button>
          </div>
        </div>

        <TabsContent value="main">
          <Main
            onGenerateAction={handleGenerateClick}
            companyId={Number(companyId)}
            documentIdToFetch={documentIdToFetch}
            fetchedData={fetchedYearEndProcess}
            onTotalsChange={setTotals}
            formRef={
              formRef as unknown as React.RefObject<YearEndProcessFormRef>
            }
          />
        </TabsContent>

        <TabsContent value="history">
          <History
            fetchedData={
              fetchedYearEndProcess?.result === 1 && fetchedYearEndProcess?.data
                ? (fetchedYearEndProcess.data as
                    | IGLOpeningBalance
                    | IGLOpeningBalance[])
                : undefined
            }
            isEdit={isEdit}
          />
        </TabsContent>
      </Tabs>

      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={setShowSaveConfirm}
        onConfirm={handleConfirmGenerate}
        itemName={`year end process for document ${pendingRequest?.documentId || ""}`}
        operationType="create"
        isSaving={isSaving || saveMutation.isPending}
      />
    </div>
  )
}
