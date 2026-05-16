"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ITariff, ITariffHd, ITariffRPT, ITariffRPTRequest } from "@/interfaces"
import { ITaskDetails } from "@/interfaces/checklist"
import { ICustomerLookup, IPortLookup } from "@/interfaces/lookup"
import { usePermissionStore } from "@/stores/permission-store"
import { useQueryClient } from "@tanstack/react-query"
import {
  BuildingIcon,
  CopyIcon,
  DownloadIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Tariff } from "@/lib/api-routes"
import { Task } from "@/lib/operations-utils"
import { ModuleId, OperationsTransactionId } from "@/lib/utils"
import {
  useDelete,
  useGetById,
  useGetByParams,
  usePersist,
} from "@/hooks/use-common"
import {
  cloneTariffsBulkDirect,
  copyCompanyTariffDirect,
  copyCompanyTariffDirectv1,
  copyRateDirect,
  copyRateDirectv1,
  deleteTariffsBulkDirect,
  getTariffRptDirect,
} from "@/hooks/use-tariff"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CustomerAutocomplete,
  PortAutocomplete,
} from "@/components/autocomplete"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { DataTableSkeleton } from "@/components/skeleton/data-table-skeleton"

import { BulkCloneTariffForm } from "./components/bulk-clone-tariff-form"
import { CopyCompanyRateForm } from "./components/copy-company-rate-form"
import { CopyRateForm } from "./components/copy-rate-form"
import { DownloadTariffForm } from "./components/download-tariff-form"
import { TariffForm, TariffFormRef } from "./components/tariff-form"
import { TariffTable } from "./components/tariff-table"

interface FilterSchemaType extends Record<string, unknown> {
  customerId: number
  portId: number
}

// Define category mapping with Task enum values
const CATEGORY_CONFIG: Record<
  string,
  { id: string; label: string; taskId: Task | number }
> = {
  portExpenses: {
    id: "portExpenses",
    label: "Port Expenses",
    taskId: Task.PortExpenses,
  },
  launchServices: {
    id: "launchServices",
    label: "Launch Service",
    taskId: Task.LaunchServices,
  },
  equipmentUsed: {
    id: "equipmentUsed",
    label: "Equipment Used",
    taskId: Task.EquipmentUsed,
  },
  crewSignOn: {
    id: "crewSignOn",
    label: "Crew SignOn",
    taskId: Task.CrewSignOn,
  },
  crewSignOff: {
    id: "crewSignOff",
    label: "Crew SignOff",
    taskId: Task.CrewSignOff,
  },
  crewMiscellaneous: {
    id: "crewMiscellaneous",
    label: "Crew Miscellaneous",
    taskId: Task.CrewMiscellaneous,
  },
  medicalAssistance: {
    id: "medicalAssistance",
    label: "Medical Assistance",
    taskId: Task.MedicalAssistance,
  },
  consignmentImport: {
    id: "consignmentImport",
    label: "Consignment Import",
    taskId: Task.ConsignmentImport,
  },
  consignmentExport: {
    id: "consignmentExport",
    label: "Consignment Export",
    taskId: Task.ConsignmentExport,
  },
  thirdParty: {
    id: "thirdParty",
    label: "Third Party",
    taskId: Task.ThirdParty,
  },
  freshWater: {
    id: "freshWater",
    label: "Fresh Water",
    taskId: Task.FreshWater,
  },
  techniciansSurveyors: {
    id: "techniciansSurveyors",
    label: "Technician Surveyor",
    taskId: Task.TechniciansSurveyors,
  },
  landingItems: {
    id: "landingItems",
    label: "Landing Items",
    taskId: Task.LandingItems,
  },
  otherService: {
    id: "otherService",
    label: "Other Service",
    taskId: Task.OtherService,
  },
  agencyRemuneration: {
    id: "agencyRemuneration",
    label: "Agency Remuneration",
    taskId: Task.AgencyRemuneration,
  },
  transportation: {
    id: "transportation",
    label: "Transportation",
    taskId: Task.Transportation,
  },
}

/** Bulk tariff APIs return result > 0 (often a count), not always exactly 1. */
function isPositiveApiResult(result: unknown): boolean {
  const n = Number(result)
  return Number.isFinite(n) && n > 0
}

export default function TariffPage() {
  const moduleId = ModuleId.operations
  const transactionId = OperationsTransactionId.tariff

  const params = useParams()
  const companyId = Number(params?.companyId) || 0
  const queryClient = useQueryClient()

  const { hasPermission } = usePermissionStore()

  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  // Form for filter controls
  const form = useForm<FilterSchemaType>({
    defaultValues: {
      customerId: 0,
      portId: 0,
    },
  })

  // Watch form values for conditional rendering
  const watchedCustomerId = form.watch("customerId")
  // const watchedPortId = form.watch("portId")

  // State management
  const [hasSearched, setHasSearched] = useState(false)
  const [activeCategory, setActiveCategory] = useState("portExpenses")
  const [currentTaskId, setCurrentTaskId] = useState(
    CATEGORY_CONFIG.portExpenses?.taskId || Task.PortExpenses
  )
  const [isSearching, setIsSearching] = useState(false)
  const [isTabLoading, setIsTabLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // API parameters state
  const [apiParams, setApiParams] = useState<{
    customerId: number
    portId: number
  }>({
    customerId: 0,
    portId: 0,
  })

  // Tariff count API call using use-common hooks
  const tariffCountParams = `${apiParams.customerId}/${apiParams.portId}`
  const {
    data: tariffCountResponse,
    refetch: refetchTariffCount,
    isLoading: isLoadingCount,
    error: tariffCountError,
  } = useGetByParams<ITaskDetails>(
    Tariff.getTariffCount,
    "tariffCount",
    tariffCountParams,
    {
      enabled: apiParams.customerId > 0 && apiParams.portId > 0,
    }
  )

  // Category-specific API calls using use-common hooks
  const tariffByTaskParams = `${apiParams.customerId}/${apiParams.portId}/${currentTaskId}`
  const {
    data: tariffByTaskResponse,
    refetch: refetchTariffByTask,
    isLoading: isLoadingTariffByTask,
    error: tariffByTaskError,
  } = useGetByParams<ITariff[]>(
    Tariff.getTariffByTask,
    "tariffByTask",
    tariffByTaskParams,
    {
      enabled:
        apiParams.customerId > 0 &&
        apiParams.portId > 0 &&
        currentTaskId > 0 &&
        hasSearched,
    }
  )

  // Direct API functions using api-client.ts for CRUD operations

  // Modal and selected tariff state
  const [selectedTariff, setSelectedTariff] = useState<ITariff | undefined>(
    undefined
  )
  const [selectedTariffId, setSelectedTariffId] = useState<number | undefined>(
    undefined
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    number | undefined
  >(undefined)
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(
    undefined
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view">(
    "create"
  )
  const [hasFormErrors, setHasFormErrors] = useState(false)

  // Form ref for submitting
  const formRef = useRef<TariffFormRef>(null)

  // Transformation function to convert ITariffHd (from API) to ITariffHd with proper data_details formatting
  const transformToTariffHd = useCallback((apiTariff: ITariffHd): ITariffHd => {
    return {
      ...apiTariff,
      // Ensure data_details is properly formatted array
      data_details:
        apiTariff.data_details?.map((detail) => ({
          tariffId: detail.tariffId ?? 0,
          itemNo: detail.itemNo ?? 0,
          displayRate: detail.displayRate ?? 0,
          basicRate: detail.basicRate ?? 0,
          minUnit: detail.minUnit ?? 0,
          maxUnit: detail.maxUnit ?? 0,
          isMultiply: detail.isMultiply ?? false,
          isAdditional: detail.isAdditional ?? false,
          additionalUnit: detail.additionalUnit ?? 0,
          additionalRate: detail.additionalRate ?? 0,
          editVersion: detail.editVersion ?? 0,
          isCustomDescription: detail.isCustomDescription ?? false,
          lineDescription: detail.lineDescription ?? "",
        })) || [],
    }
  }, [])

  // Helper function to convert ITariff to ITariffHd (for backward compatibility)
  const convertTariffToTariffHd = useCallback(
    (tariff: ITariff | undefined, companyId: number): ITariffHd | undefined => {
      if (!tariff) return undefined

      const hasLineRates =
        tariff.displayRate != null ||
        tariff.basicRate != null ||
        tariff.minUnit != null ||
        tariff.maxUnit != null

      return {
        companyId: companyId,
        tariffId: tariff.tariffId || 0,
        customerId: tariff.customerId || 0,
        currencyId: tariff.currencyId || 0,
        portId: tariff.portId || 0,
        taskId: tariff.taskId || 0,
        chargeId: tariff.chargeId || 0,
        uomId: tariff.uomId || 0,
        visaId: tariff.visaId ?? null,
        fromLocationId: tariff.fromLocationId ?? null,
        toLocationId: tariff.toLocationId ?? null,
        isPrepayment: tariff.isPrepayment || false,
        prepaymentPercentage: tariff.prepaymentPercentage || 0,
        isViceVersa: tariff.isViceVersa || false,
        itemNo: null,
        remarks: tariff.remarks || null,
        isActive: tariff.isActive ?? true,
        createBy: tariff.createBy || "",
        createDate: tariff.createDate || new Date(),
        editBy: tariff.editBy || null,
        editDate: tariff.editDate || null,
        editVersion: tariff.editVersion || 0,
        data_details: hasLineRates
          ? [
              {
                tariffId: tariff.tariffId || 0,
                itemNo: tariff.seqNo && tariff.seqNo > 0 ? tariff.seqNo : 1,
                displayRate: tariff.displayRate ?? 0,
                basicRate: tariff.basicRate ?? 0,
                minUnit: tariff.minUnit ?? 0,
                maxUnit: tariff.maxUnit ?? 0,
                isMultiply: tariff.isMultiply ?? false,
                isAdditional: tariff.isAdditional ?? false,
                additionalUnit: tariff.additionalUnit ?? 0,
                additionalRate: tariff.additionalRate ?? 0,
                editVersion: tariff.editVersion ?? 0,
                isCustomDescription: tariff.isCustomDescription ?? false,
                lineDescription: tariff.lineDescription ?? "",
              },
            ]
          : [],
      }
    },
    []
  )

  // Fetch tariff by ID when editing/viewing using use-common hooks
  // API format: GetTariffv1ById/{CustomerId}/{TaskId}/{TariffId}
  const tariffByIdPath =
    selectedCustomerId !== undefined &&
    selectedCustomerId > 0 &&
    selectedTaskId !== undefined &&
    selectedTaskId > 0 &&
    selectedTariffId !== undefined &&
    selectedTariffId > 0
      ? `${selectedCustomerId}/${selectedTaskId}/${selectedTariffId}`
      : ""
  const {
    data: tariffByIdResponse,
    isLoading: isLoadingTariffById,
    refetch: refetchTariffById,
  } = useGetById<ITariffHd>(Tariff.getById, "tariffById", tariffByIdPath, {
    enabled:
      selectedCustomerId !== undefined &&
      selectedCustomerId > 0 &&
      selectedTaskId !== undefined &&
      selectedTaskId > 0 &&
      selectedTariffId !== undefined &&
      selectedTariffId > 0,
  })

  // Extract tariff data from response and transform to schema type
  const fetchedTariff: ITariffHd | undefined =
    tariffByIdResponse?.result === 1 && tariffByIdResponse?.data
      ? Array.isArray(tariffByIdResponse.data)
        ? tariffByIdResponse.data[0]
        : tariffByIdResponse.data
      : undefined

  // Transform fetched tariff to ITariffHd for form (form accepts ITariffHd)
  const transformedTariff: ITariffHd | undefined = fetchedTariff
    ? transformToTariffHd(fetchedTariff)
    : undefined

  // Mutations using use-common hooks
  const saveMutation = usePersist<ITariffHd>(Tariff.add)
  const updateMutation = usePersist<ITariffHd>(Tariff.add)
  const deleteMutation = useDelete(`${Tariff.delete}`)

  // Copy forms state
  const [showCopyRateForm, setShowCopyRateForm] = useState(false)
  const [showCopyCompanyRateForm, setShowCopyCompanyRateForm] = useState(false)
  const [showDownloadForm, setShowDownloadForm] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    tariff: ITariff | null
  }>({
    isOpen: false,
    tariff: null,
  })

  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    isOpen: boolean
    tariffs: ITariff[]
  }>({ isOpen: false, tariffs: [] })

  const [bulkCloneDialog, setBulkCloneDialog] = useState<{
    isOpen: boolean
    tariffs: ITariff[]
  }>({ isOpen: false, tariffs: [] })

  const [tableSelectionResetNonce, setTableSelectionResetNonce] = useState(0)
  const [bulkCloneSubmitting, setBulkCloneSubmitting] = useState(false)
  const pendingBulkDeleteTariffsRef = useRef<ITariff[]>([])
  const pendingBulkCloneTariffsRef = useRef<ITariff[]>([])

  // Save confirmation state
  const [saveConfirmation, setSaveConfirmation] = useState<{
    isOpen: boolean
    type: "save" | "copyRate" | "copyCompanyRate" | null
    data: ITariffHd | Record<string, unknown> | null
  }>({
    isOpen: false,
    type: null,
    data: null,
  })

  // Handle API errors
  useEffect(() => {
    if (tariffCountError) {
      console.error("Error fetching tariff count:", tariffCountError)
    }
    if (tariffByTaskError) {
      console.error("Error fetching tariff by task:", tariffByTaskError)
    }
  }, [tariffCountError, tariffByTaskError])

  // Handle both array and single object responses
  const rawTariffCountData = tariffCountResponse?.data
  const tariffCountData = rawTariffCountData
    ? Array.isArray(rawTariffCountData)
      ? rawTariffCountData[0]
      : (rawTariffCountData as ITaskDetails)
    : undefined

  // Process category-specific tariff data
  const rawTariffByTaskData = tariffByTaskResponse?.data
  const tariffByTaskData: ITariff[] = (() => {
    if (!rawTariffByTaskData) return []
    if (Array.isArray(rawTariffByTaskData)) {
      if (
        rawTariffByTaskData.length > 0 &&
        Array.isArray(rawTariffByTaskData[0])
      ) {
        // Nested array - flatten it
        const nested = rawTariffByTaskData as unknown as ITariff[][]
        const flattened: unknown = nested.flat()
        return flattened as ITariff[]
      }
      // Single level array - ensure it's ITariff[]
      return rawTariffByTaskData as unknown as ITariff[]
    }
    return [rawTariffByTaskData as ITariff]
  })()

  // Sequential API call handler
  const handleSearch = useCallback(async () => {
    const formValues = form.getValues()

    if (formValues.customerId === 0) {
      toast.error("Please select a customer first")
      return
    }

    setIsSearching(true)

    try {
      // Update API parameters
      const newApiParams = {
        customerId: formValues.customerId,
        portId: formValues.portId,
      }

      setApiParams(newApiParams)
      setHasSearched(true)

      // Wait for state to update, then trigger API calls
      setTimeout(async () => {
        try {
          await refetchTariffCount()
          await refetchTariffByTask()
          toast.success("Search completed successfully")
        } catch {
          toast.error("Failed to fetch tariff data")
        }
      }, 100)
    } catch {
      toast.error("Failed to fetch tariff data")
    } finally {
      setIsSearching(false)
    }
  }, [form, refetchTariffCount, refetchTariffByTask])

  // Handle category change - Only call task API, not count API
  const handleCategoryChange = useCallback(
    async (category: string) => {
      const taskId = CATEGORY_CONFIG[category]?.taskId

      // Update the active category and taskId first
      setActiveCategory(category)
      setCurrentTaskId(taskId || Task.PortExpenses)

      // Only proceed if we have valid search parameters
      if (mounted && hasSearched && apiParams.customerId > 0) {
        // Set tab loading state
        setIsTabLoading(true)

        try {
          // Wait a bit for state to update, then call only the task API
          setTimeout(async () => {
            try {
              await refetchTariffByTask()
              toast.success(
                `${CATEGORY_CONFIG[category]?.label || category} data loaded successfully`
              )
            } catch {
              toast.error(
                `Failed to load ${CATEGORY_CONFIG[category]?.label || category} data`
              )
            } finally {
              setIsTabLoading(false)
            }
          }, 100)
        } catch {
          toast.error(
            `Failed to load ${CATEGORY_CONFIG[category]?.label || category} data`
          )
          setIsTabLoading(false)
        }
      } else {
        // Cannot load data: missing required parameters
      }
    },
    [mounted, hasSearched, apiParams.customerId, refetchTariffByTask]
  )

  // Clear filters handler
  const handleClear = () => {
    form.reset()
    setHasSearched(false)
    setApiParams({ customerId: 0, portId: 0 })
    setActiveCategory("portExpenses")
    setCurrentTaskId(CATEGORY_CONFIG.portExpenses?.taskId || Task.PortExpenses)
  }

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (apiParams.customerId > 0 && hasSearched) {
      // Set loading state
      setIsTabLoading(true)

      // Use Promise.all to ensure both API calls complete
      Promise.all([refetchTariffCount(), refetchTariffByTask()])
        .then(() => {
          toast.success("Data refreshed successfully")
        })
        .catch(() => {
          toast.error("Failed to refresh data")
        })
        .finally(() => {
          setIsTabLoading(false)
        })
    } else {
      toast.error(
        "Please select customer and port, then search before refreshing"
      )
    }
  }, [
    apiParams.customerId,
    hasSearched,
    refetchTariffCount,
    refetchTariffByTask,
  ])

  // CRUD handlers
  const handleCreateTariff = () => {
    setSelectedTariffId(undefined)
    setSelectedCustomerId(undefined)
    setSelectedTaskId(undefined)
    setSelectedTariff(undefined)
    setModalMode("create")
    setHasFormErrors(false) // Reset form errors when creating new tariff
    setIsModalOpen(true)
  }

  const handleBulkDeleteRequest = useCallback((tariffs: ITariff[]) => {
    if (!tariffs.length) return
    pendingBulkDeleteTariffsRef.current = tariffs
    setBulkDeleteConfirmation({ isOpen: true, tariffs })
  }, [])

  const handleBulkDeleteTariffs = useCallback(async () => {
    const tariffs = pendingBulkDeleteTariffsRef.current
    const tariffIds = tariffs
      .map((t) => t.tariffId)
      .filter((id): id is number => typeof id === "number" && id > 0)
    if (!tariffIds.length) {
      toast.error("No valid tariffs to delete")
      return
    }
    try {
      const response = (await deleteTariffsBulkDirect(tariffIds)) as {
        result?: number
        message?: string
      }
      if (isPositiveApiResult(response?.result)) {
        toast.success(
          response?.message ||
            `${tariffIds.length} tariff(s) deleted successfully`
        )
        setBulkDeleteConfirmation({ isOpen: false, tariffs: [] })
        pendingBulkDeleteTariffsRef.current = []
        setTableSelectionResetNonce((n) => n + 1)
        await queryClient.invalidateQueries({ queryKey: ["tariffByTask"] })
        await queryClient.invalidateQueries({ queryKey: ["tariffCount"] })
        await refetchTariffByTask()
        await refetchTariffCount()
      } else {
        toast.error(response?.message || "Failed to delete selected tariffs")
      }
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast.error("Network error while deleting tariffs.")
    }
  }, [queryClient, refetchTariffByTask, refetchTariffCount])

  const handleBulkCloneRequest = useCallback((tariffs: ITariff[]) => {
    if (!tariffs.length) return
    pendingBulkCloneTariffsRef.current = tariffs
    setBulkCloneDialog({ isOpen: true, tariffs })
  }, [])

  const handleBulkCloneSubmit = useCallback(
    async (targetTaskId: number) => {
      const tariffs = pendingBulkCloneTariffsRef.current
      const tariffIds = tariffs
        .map((t) => t.tariffId)
        .filter((id): id is number => typeof id === "number" && id > 0)
      if (!tariffIds.length) {
        toast.error("No valid tariffs to clone")
        return
      }
      if (!targetTaskId) {
        toast.error("Please select a task")
        return
      }
      setBulkCloneSubmitting(true)
      try {
        const response = (await cloneTariffsBulkDirect(
          tariffIds,
          targetTaskId
        )) as { result?: number; message?: string }
        if (isPositiveApiResult(response?.result)) {
          toast.success(
            response?.message ||
              `${tariffIds.length} tariff(s) cloned successfully`
          )
          setBulkCloneDialog({ isOpen: false, tariffs: [] })
          pendingBulkCloneTariffsRef.current = []
          setTableSelectionResetNonce((n) => n + 1)
          await queryClient.invalidateQueries({ queryKey: ["tariffByTask"] })
          await queryClient.invalidateQueries({ queryKey: ["tariffCount"] })
          await refetchTariffByTask()
          await refetchTariffCount()
        } else {
          toast.error(response?.message || "Failed to clone selected tariffs")
        }
      } catch (error) {
        console.error("Bulk clone error:", error)
        toast.error("Network error while cloning tariffs.")
      } finally {
        setBulkCloneSubmitting(false)
      }
    },
    [queryClient, refetchTariffByTask, refetchTariffCount]
  )

  const handleEditTariff = (tariff: ITariff) => {
    setSelectedTariffId(tariff.tariffId)
    setSelectedCustomerId(tariff.customerId || apiParams.customerId)
    setSelectedTaskId(tariff.taskId || currentTaskId)
    setSelectedTariff(tariff)
    setModalMode("edit")
    setHasFormErrors(false) // Reset form errors when editing tariff
    setIsModalOpen(true)
  }

  const handleViewTariff = (tariff: ITariff | null) => {
    if (tariff) {
      setSelectedTariffId(tariff.tariffId)
      setSelectedCustomerId(tariff.customerId || apiParams.customerId)
      setSelectedTaskId(tariff.taskId || currentTaskId)
      setSelectedTariff(tariff)
    }
    setModalMode("view")
    setHasFormErrors(false) // Reset form errors when viewing tariff
    setIsModalOpen(true)
  }

  const handleDeleteConfirmation = (tariff: ITariff) => {
    setDeleteConfirmation({
      isOpen: true,
      tariff,
    })
  }

  const handleDeleteTariff = async () => {
    if (deleteConfirmation.tariff) {
      const { tariff } = deleteConfirmation
      const tariffId = tariff.tariffId

      if (!tariffId || tariffId === 0) {
        toast.error("Missing required information to delete tariff")
        return
      }

      try {
        const response = await deleteMutation.mutateAsync(tariffId.toString())
        if (response?.result === 1) {
          toast.success(
            response?.message ||
              `Tariff ${tariff.taskName || tariff.chargeName || ""} deleted successfully`
          )
          setDeleteConfirmation({
            isOpen: false,
            tariff: null,
          })
          refetchTariffByTask()
        } else {
          toast.error(response?.message || "Failed to delete tariff")
        }
      } catch (error) {
        console.error("Error deleting tariff:", error)
        toast.error("Network error while deleting tariff. Please try again.")
      }
    }
  }

  const tariffModalInitialData = useMemo((): ITariffHd | undefined => {
    if (modalMode === "create" && selectedTariff) {
      const conv = convertTariffToTariffHd(selectedTariff, Number(companyId))
      return conv ? transformToTariffHd(conv) : undefined
    }
    if ((modalMode === "edit" || modalMode === "view") && transformedTariff) {
      return {
        ...transformedTariff,
        createBy: fetchedTariff?.createBy || "",
        createDate: fetchedTariff?.createDate || new Date(),
        editBy: fetchedTariff?.editBy || null,
        editDate: fetchedTariff?.editDate || null,
      }
    }
    return undefined
  }, [
    modalMode,
    selectedTariff,
    companyId,
    transformedTariff,
    fetchedTariff,
    convertTariffToTariffHd,
    transformToTariffHd,
  ])

  const handleSaveTariff = (data: ITariffHd) => {
    setSaveConfirmation({
      isOpen: true,
      type: "save",
      data: data,
    })
  }

  const handleConfirmSave = async () => {
    if (!saveConfirmation.data) return

    const tariffData = saveConfirmation.data as ITariffHd

    try {
      if (modalMode === "create") {
        const response = await saveMutation.mutateAsync(tariffData)
        if (response?.result === 1) {
          toast.success(
            response?.message ||
              `Tariff ${tariffData.tariffId ? `#${tariffData.tariffId}` : ""} saved successfully`
          )
          setIsModalOpen(false)
          setSelectedTariffId(undefined)
          setSelectedCustomerId(undefined)
          setSelectedTaskId(undefined)
          setSelectedTariff(undefined)
          refetchTariffByTask()
        } else {
          toast.error(response?.message || "Failed to save tariff")
        }
      } else if (modalMode === "edit" && selectedTariffId) {
        const response = await updateMutation.mutateAsync(tariffData)
        if (response?.result === 1) {
          toast.success(
            response?.message ||
              `Tariff ${tariffData.tariffId ? `#${tariffData.tariffId}` : ""} updated successfully`
          )
          // Invalidate the tariffById query cache and refetch to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["tariffById"] })
          // If modal is still open, refetch the tariff data immediately
          if (selectedCustomerId && selectedTaskId && selectedTariffId) {
            await refetchTariffById()
          }
          setIsModalOpen(false)
          setSelectedTariffId(undefined)
          setSelectedCustomerId(undefined)
          setSelectedTaskId(undefined)
          setSelectedTariff(undefined)
          refetchTariffByTask()
        } else {
          toast.error(response?.message || "Failed to update tariff")
        }
      }
    } catch (error) {
      console.error("Error saving tariff:", error)
      toast.error("Network error while saving tariff. Please try again.")
    } finally {
      setSaveConfirmation({
        isOpen: false,
        type: null,
        data: null,
      })
    }
  }

  const handleCopyRateConfirmation = (data: Record<string, unknown>) => {
    console.log("handleCopyRateConfirmation", data)
    setSaveConfirmation({
      isOpen: true,
      type: "copyRate",
      data: data,
    })
  }

  const handleCopyCompanyRateConfirmation = (data: Record<string, unknown>) => {
    console.log("handleCopyCompanyRateConfirmation", data)
    setSaveConfirmation({
      isOpen: true,
      type: "copyCompanyRate",
      data: data,
    })
  }

  const handleDownloadTariff = async (data: ITariffRPTRequest) => {
    try {
      setIsDownloading(true)
      const response = await getTariffRptDirect(data)

      if (response?.result === 1 && response.data) {
        // Convert data to CSV format
        const csvData = convertToCSV(response.data)
        downloadCSV(csvData, `tariff_rates_${new Date().getTime()}.csv`)
        toast.success(
          response.message || "Tariff rates downloaded successfully"
        )
        setShowDownloadForm(false)
      } else {
        const errorMessage =
          response?.message || "Failed to download tariff rates"
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error downloading tariff rates:", error)
      toast.error("Failed to download tariff rates")
    } finally {
      setIsDownloading(false)
    }
  }

  // Helper function to convert camelCase to Title Case
  const camelCaseToTitleCase = (str: string): string => {
    return str
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (char) => char.toUpperCase()) // Capitalize first letter
      .trim()
  }

  // Helper function to convert ITariffRPT[] to CSV
  const convertToCSV = (data: ITariffRPT[]): string => {
    if (!data || data.length === 0) {
      return ""
    }

    // Get headers from the first object
    const headers = Object.keys(data[0])

    // Convert headers to Title Case (e.g., "companyName" -> "Company Name")
    const formattedHeaders = headers.map((header) =>
      camelCaseToTitleCase(header)
    )

    // Create CSV header row with formatted headers
    const csvHeaders = formattedHeaders.join(",")

    // Create CSV data rows
    const csvRows = data.map((row) => {
      return headers
        .map((header) => {
          const value = row[header as keyof ITariffRPT]
          // Handle null/undefined values
          if (value === null || value === undefined) {
            return ""
          }
          // Escape commas and quotes in values
          const stringValue = String(value)
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        })
        .join(",")
    })

    // Combine headers and rows
    return [csvHeaders, ...csvRows].join("\n")
  }

  // Helper function to download CSV file
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleConfirmCopyRate = async () => {
    if (!saveConfirmation.data) return

    try {
      const response = await copyRateDirectv1(
        saveConfirmation.data as unknown as Parameters<typeof copyRateDirect>[0]
      )
      if (response?.result === 1) {
        setShowCopyRateForm(false)
        toast.success(response.message || "Rates copied successfully")
        refetchTariffByTask()
      } else {
        const errorMessage = response?.message || "Failed to copy rates"
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error copying rates:", error)
      toast.error("Failed to copy rates")
    } finally {
      setSaveConfirmation({
        isOpen: false,
        type: null,
        data: null,
      })
    }
  }

  const handleConfirmCopyCompanyRate = async () => {
    if (!saveConfirmation.data) return

    try {
      const response = await copyCompanyTariffDirectv1(
        saveConfirmation.data as unknown as Parameters<
          typeof copyCompanyTariffDirect
        >[0]
      )
      if (response?.result === 1) {
        setShowCopyCompanyRateForm(false)
        toast.success(response.message || "Rates copied successfully")
        refetchTariffByTask()
      } else {
        const errorMessage = response?.message || "Failed to copy rates"
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("Error copying rates:", error)
      toast.error("Failed to copy rates")
    } finally {
      setSaveConfirmation({
        isOpen: false,
        type: null,
        data: null,
      })
    }
  }

  // Customer and Port change handlers
  const handleCustomerChange = useCallback(
    (selectedCustomer: ICustomerLookup | null) => {
      if (selectedCustomer) {
        form.setValue("customerId", selectedCustomer.customerId)
        form.setValue("currencyId", selectedCustomer.currencyId)
      } else {
        form.setValue("customerId", 0)
        form.setValue("currencyId", 0)
      }
      // Reset search state when customer changes
      setHasSearched(false)
    },
    [form]
  )

  const handlePortChange = useCallback(
    (selectedPort: IPortLookup | null) => {
      if (selectedPort) {
        form.setValue("portId", selectedPort.portId || 0)
      } else {
        form.setValue("portId", 0)
      }
      // Reset search state when port changes
      setHasSearched(false)
    },
    [form]
  )

  // Generate categories with counts using ITaskDetails structure
  const categories = Object.values(CATEGORY_CONFIG).map((config) => {
    let count = 0

    // Only calculate counts if mounted and we have data
    if (mounted && tariffCountData && typeof tariffCountData === "object") {
      // Map task IDs to ITaskDetails properties
      const taskCountMap: Record<number, keyof ITaskDetails> = {
        [Task.PortExpenses]: "portExpense",
        [Task.LaunchServices]: "launchService",
        [Task.EquipmentUsed]: "equipmentUsed",
        [Task.CrewSignOn]: "crewSignOn",
        [Task.CrewSignOff]: "crewSignOff",
        [Task.CrewMiscellaneous]: "crewMiscellaneous",
        [Task.MedicalAssistance]: "medicalAssistance",
        [Task.ConsignmentImport]: "consignmentImport",
        [Task.ConsignmentExport]: "consignmentExport",
        [Task.ThirdParty]: "thirdParty",
        [Task.FreshWater]: "freshWater",
        [Task.TechniciansSurveyors]: "technicianSurveyor",
        [Task.LandingItems]: "landingItems",
        [Task.OtherService]: "otherService",
        [Task.AgencyRemuneration]: "agencyRemuneration",
        [Task.Transportation]: "transportation",
      }

      const propertyName = taskCountMap[config.taskId as number]
      if (propertyName && propertyName in tariffCountData) {
        count = (tariffCountData as ITaskDetails)[propertyName] || 0
      }
    }

    return {
      ...config,
      count,
    }
  })

  // Determine loading state
  const isLoading =
    isLoadingCount || isLoadingTariffByTask || isSearching || isTabLoading

  return (
    <div className="@container mx-auto space-y-1.5 px-4 pt-2 pb-4 sm:space-y-2 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Tariff Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage tariff rates and configurations
          </p>
        </div>

        {/* Top right action buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowDownloadForm(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Download Rates"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowCopyRateForm(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Copy Rates"
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setShowCopyCompanyRateForm(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Copy Company Rates"
          >
            <BuildingIcon className="h-4 w-4" />
          </Button>
          {watchedCustomerId > 0 && (
            <Button
              onClick={handleCreateTariff}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Tariff
            </Button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-card mb-2 rounded-lg border p-3">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
          {/* Customer Selection */}
          <div>
            <CustomerAutocomplete
              form={form}
              name="customerId"
              label="Customer"
              isRequired={true}
              onChangeEvent={handleCustomerChange}
            />
          </div>

          {/* Port Selection */}
          <div>
            <PortAutocomplete
              form={form}
              name="portId"
              label="Port"
              onChangeEvent={handlePortChange}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Search Button - Only show when customer is selected */}
            {watchedCustomerId > 0 && (
              <Button
                onClick={handleSearch}
                disabled={isSearching || watchedCustomerId === 0}
                className="flex items-center gap-2"
              >
                <SearchIcon className="h-4 w-4" />
                {isSearching ? "Searching..." : "Search"}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center gap-2"
            >
              <XIcon className="h-4 w-4" />
              Clear
            </Button>

            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={!hasSearched || isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCcwIcon
                className={`h-4 w-4 ${isTabLoading ? "animate-spin" : ""}`}
              />
              {isTabLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {mounted && hasSearched && (
        <Tabs
          value={activeCategory}
          onValueChange={handleCategoryChange}
          className="mb-2"
        >
          <div className="bg-card rounded-lg border shadow-sm">
            <div>
              <TabsList className="flex h-auto w-full flex-col gap-1 p-1">
                {/* Row 1 */}
                <div className="flex w-full flex-wrap items-center gap-1">
                  {categories.slice(0, 8).map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="relative flex h-7 min-w-0 flex-row items-center gap-1 px-2 py-0 text-xs"
                      disabled={isTabLoading && activeCategory === category.id}
                    >
                      {category.label}
                      {isTabLoading && activeCategory === category.id && (
                        <RefreshCcwIcon className="h-3 w-3 animate-spin" />
                      )}
                      <Badge
                        variant={
                          isLoading ||
                          (isTabLoading && activeCategory === category.id)
                            ? "secondary"
                            : category.count && category.count > 0
                              ? "destructive"
                              : "outline"
                        }
                        className="h-4 min-w-5 px-1.5 text-[11px] font-medium"
                      >
                        {isLoading ||
                        (isTabLoading && activeCategory === category.id)
                          ? "..."
                          : category.count || 0}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </div>
                {/* Row 2 */}
                <div className="flex w-full flex-wrap items-center gap-1">
                  {categories.slice(8).map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="relative flex h-7 min-w-0 flex-row items-center gap-1 px-2 py-0 text-xs"
                      disabled={isTabLoading && activeCategory === category.id}
                    >
                      {category.label}
                      {isTabLoading && activeCategory === category.id && (
                        <RefreshCcwIcon className="h-3 w-3 animate-spin" />
                      )}
                      <Badge
                        variant={
                          isLoading ||
                          (isTabLoading && activeCategory === category.id)
                            ? "secondary"
                            : category.count && category.count > 0
                              ? "destructive"
                              : "outline"
                        }
                        className="h-4 min-w-5 px-1.5 text-[11px] font-medium"
                      >
                        {isLoading ||
                        (isTabLoading && activeCategory === category.id)
                          ? "..."
                          : category.count || 0}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>
            </div>
          </div>
        </Tabs>
      )}

      {/* Placeholder for tabs during SSR */}
      {!mounted && hasSearched && (
        <div className="mb-2">
          <div className="overflow-x-auto">
            <div className="flex h-14 w-max">
              {Object.values(CATEGORY_CONFIG).map((category) => (
                <div
                  key={category.id}
                  className="relative flex items-center space-x-2 px-4 py-2"
                >
                  {category.label}
                  <Badge variant="outline" className="text-xs font-medium">
                    0
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {mounted && (
        <>
          {isLoading ? (
            <DataTableSkeleton columnCount={8} rowCount={10} />
          ) : tariffCountError || tariffByTaskError ? (
            <div className="flex items-center justify-center p-8 text-red-600">
              <p>Error loading tariff data. Please try refreshing the page.</p>
            </div>
          ) : hasSearched ? (
            <TariffTable
              data={tariffByTaskData || []}
              isLoading={isLoading}
              moduleId={moduleId}
              transactionId={transactionId}
              onDeleteAction={handleDeleteConfirmation}
              onEditAction={handleEditTariff}
              onRefreshAction={() => {
                handleRefresh()
              }}
              canEdit={canEdit}
              canDelete={canDelete}
              canView={canView}
              canCreate={canCreate}
              onSelect={handleViewTariff}
              onCreateAction={handleCreateTariff}
              clearRowSelectionSignal={tableSelectionResetNonce}
              onBulkDeleteRows={canDelete ? handleBulkDeleteRequest : undefined}
              onBulkCloneRows={canCreate ? handleBulkCloneRequest : undefined}
            />
          ) : (
            <div className="text-muted-foreground py-12 text-center">
              <p>Select a customer and click Search to view tariffs</p>
            </div>
          )}
        </>
      )}

      {/* Placeholder for data table during SSR */}
      {!mounted && hasSearched && (
        <DataTableSkeleton columnCount={8} rowCount={10} />
      )}

      {/* Tariff Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && hasFormErrors) {
            toast.error("Please fix form errors before closing")
            return
          }
          setIsModalOpen(open)
        }}
      >
        <DialogContent
          className="max-h-[90vh] w-[96vw] max-w-none! overflow-x-hidden overflow-y-auto sm:w-[92vw] lg:w-[80vw] xl:w-[75vw]"
          onPointerDownOutside={(e) => {
            if (hasFormErrors) {
              e.preventDefault()
              toast.error("Please fix form errors before closing")
              return
            }
          }}
        >
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle>
                  {modalMode === "create"
                    ? "Add Tariff"
                    : modalMode === "edit"
                      ? "Edit Tariff"
                      : "Tariff Details"}
                </DialogTitle>
                <DialogDescription>
                  {modalMode === "create"
                    ? "Add a new tariff to the system."
                    : modalMode === "edit"
                      ? "Edit the tariff details."
                      : "View tariff details."}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 pr-10">
                {modalMode !== "view" && (
                  <Button
                    type="button"
                    onClick={() => formRef.current?.submit()}
                  >
                    {modalMode === "create" ? "Save" : "Update"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <Separator />
          {isLoadingTariffById &&
          (modalMode === "edit" || modalMode === "view") ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading tariff details...</p>
            </div>
          ) : (
            <TariffForm
              ref={formRef}
              initialData={tariffModalInitialData}
              onSaveAction={handleSaveTariff}
              onCloseAction={() => {
                setIsModalOpen(false)
                setSelectedTariffId(undefined)
                setSelectedCustomerId(undefined)
                setSelectedTaskId(undefined)
                setSelectedTariff(undefined)
              }}
              mode={modalMode}
              companyId={Number(companyId)}
              customerId={watchedCustomerId || apiParams.customerId}
              portId={apiParams.portId}
              taskId={
                CATEGORY_CONFIG[activeCategory]?.taskId || Task.PortExpenses
              }
              onValidationError={setHasFormErrors}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Copy Rate Form */}
      {showCopyRateForm && (
        <Dialog open={showCopyRateForm} onOpenChange={setShowCopyRateForm}>
          <DialogContent
            className="max-h-[80vh] w-[96vw] max-w-none! overflow-x-hidden overflow-y-auto sm:w-[92vw] lg:w-[80vw]"
            onPointerDownOutside={(e) => {
              if (hasFormErrors) {
                e.preventDefault()
                toast.error("Please fix form errors before closing")
                return
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Copy Rates</DialogTitle>
              <DialogDescription>
                Copy rates between customers
              </DialogDescription>
            </DialogHeader>
            <CopyRateForm
              onCancelAction={() => setShowCopyRateForm(false)}
              onSaveConfirmation={handleCopyRateConfirmation}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Copy Company Rate Form */}
      {showCopyCompanyRateForm && (
        <Dialog
          open={showCopyCompanyRateForm}
          onOpenChange={setShowCopyCompanyRateForm}
        >
          <DialogContent
            className="max-h-[90vh] w-[96vw] max-w-none! overflow-x-hidden overflow-y-auto sm:w-[92vw] lg:w-[80vw]"
            onPointerDownOutside={(e) => {
              if (hasFormErrors) {
                e.preventDefault()
                toast.error("Please fix form errors before closing")
                return
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Copy Company Rates</DialogTitle>
              <DialogDescription>
                Copy rates between companies
              </DialogDescription>
            </DialogHeader>
            <CopyCompanyRateForm
              onCancelAction={() => setShowCopyCompanyRateForm(false)}
              onSaveConfirmation={handleCopyCompanyRateConfirmation}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Download Form Dialog */}
      {showDownloadForm && (
        <Dialog open={showDownloadForm} onOpenChange={setShowDownloadForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Download Tariff Rates</DialogTitle>
              <DialogDescription>
                Select filters to download tariff rates
              </DialogDescription>
            </DialogHeader>
            <DownloadTariffForm
              onCancelAction={() => setShowDownloadForm(false)}
              onDownloadAction={handleDownloadTariff}
            />
            {isDownloading && (
              <div className="text-muted-foreground py-2 text-center text-sm">
                Downloading tariff rates...
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk delete confirmation */}
      <DeleteConfirmation
        open={bulkDeleteConfirmation.isOpen}
        onOpenChange={() =>
          setBulkDeleteConfirmation({ isOpen: false, tariffs: [] })
        }
        onConfirm={handleBulkDeleteTariffs}
        title="Delete selected tariffs"
        description={`Delete ${bulkDeleteConfirmation.tariffs.length} selected tariff record(s)? This cannot be undone.`}
        itemName={`${bulkDeleteConfirmation.tariffs.length} tariff(s)`}
      />

      {/* Bulk clone — task target via autocomplete */}
      <Dialog
        open={bulkCloneDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBulkCloneDialog({ isOpen: false, tariffs: [] })
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Clone selected tariffs</DialogTitle>
            <DialogDescription>
              Choose the task for {bulkCloneDialog.tariffs.length} selected
              tariff(s). A bulk clone request will be sent to the server.
            </DialogDescription>
          </DialogHeader>
          <BulkCloneTariffForm
            defaultTaskId={currentTaskId}
            onSubmitAction={handleBulkCloneSubmit}
            onCancelAction={() =>
              setBulkCloneDialog({ isOpen: false, tariffs: [] })
            }
            isSubmitting={bulkCloneSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={deleteConfirmation.isOpen}
        onOpenChange={() =>
          setDeleteConfirmation({
            isOpen: false,
            tariff: null,
          })
        }
        onConfirm={handleDeleteTariff}
        title="Delete Tariff"
        description={`Are you sure you want to delete the tariff "${deleteConfirmation.tariff?.taskName || deleteConfirmation.tariff?.chargeName || ""}"? This action cannot be undone.`}
        itemName={
          deleteConfirmation.tariff?.taskName ||
          deleteConfirmation.tariff?.chargeName ||
          ""
        }
      />

      {/* Save Confirmation Dialog */}
      <SaveConfirmation
        open={saveConfirmation.isOpen}
        onOpenChange={() =>
          setSaveConfirmation({
            isOpen: false,
            type: null,
            data: null,
          })
        }
        onConfirm={
          saveConfirmation.type === "save"
            ? handleConfirmSave
            : saveConfirmation.type === "copyRate"
              ? handleConfirmCopyRate
              : handleConfirmCopyCompanyRate
        }
        title={
          saveConfirmation.type === "save"
            ? "Save Tariff"
            : saveConfirmation.type === "copyRate"
              ? "Copy Rates"
              : "Copy Company Rates"
        }
        itemName={
          saveConfirmation.type === "save"
            ? "this tariff"
            : saveConfirmation.type === "copyRate"
              ? "these rates"
              : "these company rates"
        }
        operationType={
          saveConfirmation.type === "save"
            ? "save"
            : saveConfirmation.type === "copyRate"
              ? "create"
              : "create"
        }
      />
    </div>
  )
}
