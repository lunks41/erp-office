"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { IGLOpeningBalance } from "@/interfaces"
import { GLYearEndProcessRequestSchemaType } from "@/schemas/gl-yearendprocess"
import { useCompanyStore } from "@/stores/company-store"
import { usePermissionStore } from "@/stores/permission-store"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { GLYearEndProcess } from "@/lib/api-routes"
import { formatNumber } from "@/lib/format-utils"
import { GLTransactionId, ModuleId } from "@/lib/utils"
import { usePersist } from "@/hooks/use-common"
import { useCurrentYearLookup } from "@/hooks/use-lookup"
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
  const { decimals } = useCompanyStore()

  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")

  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [documentId, setDocumentId] = useState<string | undefined>(undefined)
  const [totals, setTotals] = useState<YearEndProcessTotals>({
    totDebitLocalAmt: 0,
    totCreditLocalAmt: 0,
  })
  const [tableData, setTableData] = useState<IGLOpeningBalance[]>([])
  const [pendingRequest, setPendingRequest] =
    useState<GLYearEndProcessRequestSchemaType | null>(null)
  const [selectedYearName, setSelectedYearName] = useState<string>("")
  const [isSaveMode, setIsSaveMode] = useState(false)
  const [activeTab, setActiveTab] = useState("main")
  const formRef = useRef<YearEndProcessFormRef>(null)

  // Get year lookup data to find year name from yearId
  const { data: currentYears = [] } = useCurrentYearLookup()

  useEffect(() => {
    const docId = searchParams.get("documentId")
    if (docId) {
      setDocumentId(docId)
    }
  }, [searchParams])

  const generateMutation = usePersist<GLYearEndProcessRequestSchemaType>(
    GLYearEndProcess.generate
  )

  const saveMutation = usePersist<IGLOpeningBalance[]>(GLYearEndProcess.add)

  const handleGenerate = async (
    requestData: GLYearEndProcessRequestSchemaType
  ) => {
    if (isSaving || generateMutation.isPending) {
      return
    }
    setTableData([])
    try {
      const response = await generateMutation.mutateAsync(requestData)
      console.log("response", response)
      if (response.result === 1) {
        const yearEndData = response.data

        if (yearEndData) {
          console.log("yearEndData", yearEndData)
          const dataArray = Array.isArray(yearEndData)
            ? yearEndData
            : [yearEndData]

          if (dataArray.length > 0) {
            console.log("dataArray", dataArray)
            const typedDataArray = dataArray as unknown as IGLOpeningBalance[]
            console.log("typedDataArray", typedDataArray)
            setTableData(typedDataArray)
          } else {
            setTableData([])
          }
        } else {
          setTableData([])
        }
        toast.success("Year end process generated successfully")
      } else {
        toast.error(response.message || "Failed to generate year end process")
      }
    } catch (error) {
      console.error("Generate error:", error)
      toast.error("Network error while generating year end process")
    } finally {
    }
  }

  const handleGenerateClick = (
    requestData: GLYearEndProcessRequestSchemaType
  ) => {
    setPendingRequest(requestData)
    // Find and store the year name from the selected yearId
    const selectedYear = currentYears.find(
      (year) => year.yearId === requestData.documentId
    )
    if (selectedYear) {
      setSelectedYearName(selectedYear.yearName)
    } else {
      setSelectedYearName("")
    }
    setShowGenerateConfirm(true)
  }

  const handleConfirmGenerate = async () => {
    if (pendingRequest) {
      await handleGenerate(pendingRequest)
      setPendingRequest(null)
      setShowGenerateConfirm(false)
    }
  }

  const handleSave = async () => {
    if (isSaving || saveMutation.isPending || tableData.length === 0) {
      return
    }
    setIsSaving(true)

    try {
      const response = await saveMutation.mutateAsync(tableData)

      if (response.result === 1) {
        setShowSaveConfirm(false)
        setIsSaveMode(false)
        toast.success("Year end process saved successfully")
        // Data is already in tableData, no need to refetch
      } else {
        toast.error(response.message || "Failed to save year end process")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Network error while saving year end process")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmSave = async () => {
    await handleSave()
  }

  const handleReset = () => {
    // Clear table data and documentId when reset is clicked
    setTableData([])
    setDocumentId(undefined)
    setSelectedYearName("")
    setTotals({
      totDebitLocalAmt: 0,
      totCreditLocalAmt: 0,
    })
  }

  const isEdit = !!documentId && documentId !== "0"
  const locAmtDec = decimals[0]?.locAmtDec ?? 2

  const titleText = isEdit
    ? `GL Year End Process - Document: ${documentId}`
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
                className="border-border bg-blue-100 px-3 py-1 text-sm font-medium text-primary"
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
              onClick={() => {
                setIsSaveMode(true)
                setShowSaveConfirm(true)
              }}
              disabled={
                !canView ||
                isSaving ||
                saveMutation.isPending ||
                generateMutation.isPending ||
                tableData.length === 0 ||
                !canCreate
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving || saveMutation.isPending ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Save className="mr-1 h-4 w-4" />
              )}
              {isSaving || saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <TabsContent value="main">
          <Main
            onGenerateAction={handleGenerateClick}
            onResetAction={handleReset}
            companyId={Number(companyId)}
            documentId={documentId}
            tableData={tableData}
            onTotalsChange={setTotals}
            onTableDataChange={setTableData}
            formRef={
              formRef as unknown as React.RefObject<YearEndProcessFormRef>
            }
          />
        </TabsContent>

        <TabsContent value="history">
          <History
            fetchedData={tableData.length > 0 ? tableData : undefined}
            isEdit={isEdit}
          />
        </TabsContent>
      </Tabs>

      <SaveConfirmation
        open={showSaveConfirm}
        onOpenChange={(open) => {
          setShowSaveConfirm(open)
          if (!open) {
            setIsSaveMode(false)
          }
        }}
        onConfirm={isSaveMode ? handleConfirmSave : handleConfirmGenerate}
        itemName={
          isSaveMode
            ? `year end process for year ${selectedYearName || documentId || ""}`
            : `year end process for year ${selectedYearName || pendingRequest?.documentId || ""}`
        }
        operationType="create"
        isSaving={
          isSaving || saveMutation.isPending || generateMutation.isPending
        }
      />

      <SaveConfirmation
        open={showGenerateConfirm}
        onOpenChange={(open) => {
          setShowGenerateConfirm(open)
          if (!open) {
            setPendingRequest(null)
          }
        }}
        onConfirm={handleConfirmGenerate}
        itemName={`year end process for year ${selectedYearName || pendingRequest?.documentId || ""}`}
        operationType="create"
        isSaving={generateMutation.isPending}
      />
    </div>
  )
}
