"use client"

import { useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  IGLPeriodClose,
  IGeneratePeriodRequest,
} from "@/interfaces/gl-periodclose"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { GLPeriodClose } from "@/lib/api-routes"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { CurrentYearAutocomplete } from "@/components/autocomplete"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { GeneratePeriodForm } from "./components/generateperiod-form"
import { PeriodCloseTable } from "./components/periodclose-table"

export default function GLPeriodClosePage() {
  // Move queryClient to top for proper usage order
  const queryClient = useQueryClient()

  const currentYear = new Date().getFullYear()
  const form = useForm({
    defaultValues: {
      yearId: currentYear,
    },
  })
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    currentYear
  )
  const [periodCloseData, setPeriodCloseData] = useState<IGLPeriodClose[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showGenerateConfirmation, setShowGenerateConfirmation] =
    useState(false)
  const [pendingGenerateData, setPendingGenerateData] =
    useState<IGeneratePeriodRequest | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Fetch period close data for selected year
  const { data: periodCloseResponse, isLoading } = useGet<IGLPeriodClose>(
    `${GLPeriodClose.get}/${selectedYear?.toString()}`,
    "periodClose"
  )

  // Define mutations for CRUD operations
  const saveMutation = usePersist<IGLPeriodClose[] | IGLPeriodClose>(
    `${GLPeriodClose.add}`
  )
  const deleteMutation = useDelete(`${GLPeriodClose.delete}`)
  const generatePeriodMutation = usePersist<IGeneratePeriodRequest>(
    `${GLPeriodClose.generate}`
  )

  // Update periodCloseData when periodCloseResponse changes
  useEffect(() => {
    if (periodCloseResponse) {
      const response = periodCloseResponse as ApiResponse<IGLPeriodClose>
      if (response.data && Array.isArray(response.data)) {
        setPeriodCloseData(response.data)
      } else {
        setPeriodCloseData([])
      }
    } else {
      setPeriodCloseData([])
    }
  }, [periodCloseResponse])

  // When year changes, refetch data
  useEffect(() => {
    if (selectedYear) {
      queryClient.invalidateQueries({ queryKey: ["periodClose"] })
    } else {
      setPeriodCloseData([])
    }
  }, [selectedYear, queryClient])

  const handleFieldChange = (
    field: IGLPeriodClose,
    key: string,
    checked: boolean
  ) => {
    setPeriodCloseData((prev) =>
      prev.map((f) =>
        f.companyId === field.companyId &&
        f.finYear === field.finYear &&
        f.finMonth === field.finMonth
          ? { ...f, [key]: checked }
          : f
      )
    )
  }

  const handleSave = async () => {
    if (!selectedYear) {
      toast.error("Please select a year first")
      return
    }
    setShowSaveConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedYear) {
      toast.error("Please select a year first")
      return
    }

    try {
      console.log("periodCloseData to save", periodCloseData)
      setSaving(true)
      const response = await saveMutation.mutateAsync(periodCloseData)
      if (response.result === 1) {
        toast.success("Period close data saved successfully")
        // Invalidate and refetch the period close query
        queryClient.invalidateQueries({ queryKey: ["periodClose"] })
      } else {
        toast.error(response.message || "Failed to save period close data")
      }
    } catch (error) {
      console.error("Error saving period close data:", error)
      toast.error("Failed to save period close data")
    } finally {
      setSaving(false)
      setShowSaveConfirmation(false)
    }
  }

  const handleGeneratePeriod = async (data: IGeneratePeriodRequest) => {
    setPendingGenerateData(data)
    setShowGenerateConfirmation(true)
  }

  const handleConfirmGenerate = async () => {
    if (!pendingGenerateData) {
      toast.error("No generate data found")
      return
    }

    try {
      setGenerating(true)
      console.log("Generating period data:", pendingGenerateData)
      const response =
        await generatePeriodMutation.mutateAsync(pendingGenerateData)

      if (response.result === 1) {
        toast.success("Period data generated successfully")
        // Refresh period close data and year lookup
        queryClient.invalidateQueries({ queryKey: ["periodClose"] })
        queryClient.invalidateQueries({ queryKey: ["currentyear-lookUp"] })
        setShowGenerateDialog(false)
        setSelectedYear(pendingGenerateData.yearId)
      } else {
        toast.error(response.message || "Failed to generate period data")
      }
    } catch (error) {
      console.error("Error generating period data:", error)
      toast.error("Failed to generate period data")
    } finally {
      setGenerating(false)
      setShowGenerateConfirmation(false)
      setPendingGenerateData(null)
    }
  }

  const handleDelete = () => {
    if (!selectedYear) {
      toast.error("Please select a year first")
      return
    }
    if (periodCloseData.length === 0) {
      toast.error("No period data to delete")
      return
    }
    setShowDeleteConfirmation(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedYear) {
      toast.error("Please select a year first")
      return
    }

    try {
      setDeleting(true)

      // Delete all periods for the selected year
      const response = await deleteMutation.mutateAsync(selectedYear.toString())

      if (response.result === 1) {
        toast.success(
          `Period data deleted successfully for year ${selectedYear}`
        )
        setPeriodCloseData([])
        queryClient.invalidateQueries({ queryKey: ["periodClose"] })
        queryClient.invalidateQueries({ queryKey: ["currentyear-lookUp"] })
        setShowGenerateConfirmation(false)
        setPendingGenerateData(null)
      } else {
        toast.error(response.message || "Failed to delete period data")
      }
    } catch (error) {
      console.error("Error deleting period data:", error)
      toast.error("Failed to delete period data")
    } finally {
      setDeleting(false)
      setShowDeleteConfirmation(false)
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            GL Period Close
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage AR, AP, CB, and GL period close settings
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="w-64">
          <CurrentYearAutocomplete
            form={form}
            name="yearId"
            label="Year"
            isRequired
            className="w-full"
            onChangeEvent={(selectedOption) => {
              if (selectedOption) {
                setSelectedYear(selectedOption.yearId)
                queryClient.invalidateQueries({ queryKey: ["periodClose"] })
              } else {
                setSelectedYear(undefined)
                setPeriodCloseData([])
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGenerateDialog(true)}
          >
            Generate Period
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting || !selectedYear || periodCloseData.length === 0}
          >
            {deleting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedYear}
            size="sm"
          >
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={16}
          filterCount={2}
          cellWidths={[
            "5rem",
            "5rem",
            "7.5rem",
            "7.5rem",
            "5.5rem",
            "7.5rem",
            "11rem",
            "5.5rem",
            "7.5rem",
            "11rem",
            "5.5rem",
            "7.5rem",
            "11rem",
            "5.5rem",
            "7.5rem",
            "11rem",
          ]}
          shrinkZero
        />
      ) : (
        <>
          <PeriodCloseTable
            data={periodCloseData}
            isLoading={isLoading}
            onFieldChange={handleFieldChange}
          />

          <SaveConfirmation
            title="Save Period Close Data"
            itemName={`period close data for year ${selectedYear}`}
            open={showSaveConfirmation}
            onOpenChange={setShowSaveConfirmation}
            onConfirm={handleConfirmSave}
            isSaving={saving}
            operationType="save"
          />

          <SaveConfirmation
            title="Generate Period Data"
            itemName={`period data for year ${pendingGenerateData?.yearId || ""}, starting from month ${pendingGenerateData?.monthId || ""} for ${pendingGenerateData?.totalPeriod || ""} periods`}
            open={showGenerateConfirmation}
            onOpenChange={setShowGenerateConfirmation}
            onConfirm={handleConfirmGenerate}
            isSaving={generating}
            operationType="save"
          />

          <Dialog
            open={showGenerateDialog}
            onOpenChange={setShowGenerateDialog}
          >
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Generate Period</DialogTitle>
                <DialogDescription>
                  Select a year and the months for which you want to generate
                  period close records.
                </DialogDescription>
              </DialogHeader>

              <GeneratePeriodForm
                onGenerate={handleGeneratePeriod}
                isGenerating={generating}
              />
            </DialogContent>
          </Dialog>

          <DeleteConfirmation
            title="Delete Period Data"
            itemName={`all period close data for year ${selectedYear}`}
            open={showDeleteConfirmation}
            onOpenChange={setShowDeleteConfirmation}
            onConfirm={handleConfirmDelete}
            isDeleting={deleting}
          />
        </>
      )}
    </div>
  )
}
