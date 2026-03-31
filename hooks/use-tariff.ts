import { ITaskDetails } from "@/interfaces/checklist"
import {
  CopyRate,
  ITariff,
  ITariffHd,
  ITariffRPT,
  ITariffRPTRequest,
} from "@/interfaces/tariff"
import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"

import { getById, getData, postData, saveData } from "@/lib/api-client"
import { Tariff } from "@/lib/api-routes"

/**
 * Query Configuration
 */
const defaultQueryConfig = {
  staleTime: 60 * 60 * 1000, // 1 hour
  refetchOnWindowFocus: false,
}
/**
 * Error Handler
 */
const handleApiError = (error: unknown) => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<{ message: string }>
    throw new Error(axiosError.response?.data?.message || "An error occurred")
  }
  throw error
}
/**
 * 1. Tariff Count Management
 * -------------------------
 * 1.1 Get Tariff Count
 * @param {number} customerId - Customer ID
 * @param {number} portId - Port ID
 * @returns {object} Query object containing tariff count data
 */
export function useGetTariffCount(customerId: number, portId: number) {
  return useQuery<{
    result: number
    message: string
    data: ITaskDetails
    totalRecords: number
  }>({
    queryKey: ["tariffCount", customerId, portId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${Tariff.getTariffCount}/${customerId}/${portId}`
        )
        return data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: customerId > 0 && portId > 0,
  })
}
/**
 * 1.2 Get Tariff By Task
 * @param {number} customerId - Customer ID
 * @param {number} portId - Port ID
 * @param {number} taskId - Task ID
 * @param {boolean} hasSearched - Whether search has been performed
 * @returns {object} Query object containing tariff data by task
 */
export function useGetTariffByTask(
  customerId: number,
  portId: number,
  taskId: number,
  hasSearched: boolean
) {
  return useQuery<{
    result: number
    message: string
    data: ITariff[]
    totalRecords: number
  }>({
    queryKey: ["tariffByTask", customerId, portId, taskId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getById(
          `${Tariff.getTariffByTask}/${customerId}/${portId}/${taskId}`
        )
        return data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: customerId > 0 && portId > 0 && hasSearched,
  })
}
/**
 * 1.3 Get Tariff By Company Task
 * @param {number} companyId - Company ID
 * @param {number} customerId - Customer ID
 * @param {number} portId - Port ID
 * @param {number} taskId - Task ID
 * @param {boolean} hasSearched - Whether search has been performed
 * @returns {object} Query object containing tariff data by company task
 */
export function useGetTariffByCompanyTask(
  companyId: number,
  customerId: number,
  portId: number,
  taskId: number,
  hasSearched: boolean
) {
  return useQuery<{
    result: number
    message: string
    data: ITariff[]
    totalRecords: number
  }>({
    queryKey: ["tariffByCompanyTask", companyId, customerId, portId, taskId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getById(
          `${Tariff.getTariffByTask}/${companyId}/${customerId}/${portId}/${taskId}`
        )
        return data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled:
      companyId > 0 &&
      customerId > 0 &&
      portId > 0 &&
      taskId > 0 &&
      hasSearched,
  })
}
/**
 * 1.4 Get Tariff By ID (v1)
 * @param {number} companyId - Company ID
 * @param {number} tariffId - Tariff ID
 * @returns {object} Query object containing tariff data
 */
export function useGetTariffById(
  companyId: number,
  tariffId: number | undefined
) {
  return useQuery<{
    result: number
    message: string
    data: ITariffHd
    totalRecords: number
  }>({
    queryKey: ["tariffById", companyId, tariffId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getById(`${Tariff.getById}/${companyId}/${tariffId}`)
        return data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0 && tariffId !== undefined && tariffId > 0,
  })
}

/**
 * 2. Direct API Call Functions (v1)
 * ---------------------------
 * 2.1 Save Tariff Direct (v1)
 * @param {Partial<ITariffHd>} tariffData - Tariff data to save
 * @returns {Promise} Promise containing save response
 */
export const saveTariffDirect = async (tariffData: Partial<ITariffHd>) => {
  try {
    const response = await saveData(Tariff.add, tariffData)
    return response
  } catch (error) {
    console.error("Error saving tariff:", error)
    throw error
  }
}
/**
 * 2.2 Update Tariff Direct (v1)
 * @param {Partial<ITariffHd>} tariffData - Tariff data to update
 * @returns {Promise} Promise containing update response
 */
export const updateTariffDirect = async (tariffData: Partial<ITariffHd>) => {
  try {
    const response = await saveData(Tariff.add, tariffData)
    return response
  } catch (error) {
    console.error("Error updating tariff:", error)
    throw error
  }
}
/**
 * 2.3 Delete Tariff Direct (v1)
 * @param {number} companyId - Company ID
 * @param {number} tariffId - Tariff ID to delete
 * @returns {Promise} Promise containing delete response
 */
export const deleteTariffDirect = async (
  companyId: number,
  tariffId: number
) => {
  try {
    // POST request with parameters in URL path and empty body
    const response = await postData(
      `${Tariff.delete}/${companyId}/${tariffId}`,
      {}
    )
    return response
  } catch (error) {
    console.error("Error deleting tariff:", error)
    throw error
  }
}

/** Bulk delete tariffs (company from X-Company-Id header). */
export const deleteTariffsBulkDirect = async (tariffIds: number[]) => {
  try {
    return await postData(Tariff.deleteBulk, { tariffIds })
  } catch (error) {
    console.error("Error bulk deleting tariffs:", error)
    throw error
  }
}

/** Bulk clone tariffs to a target task (company from X-Company-Id header). */
export const cloneTariffsBulkDirect = async (
  tariffIds: number[],
  taskId: number
) => {
  try {
    return await postData(Tariff.cloneBulk, { tariffIds, taskId })
  } catch (error) {
    console.error("Error bulk cloning tariffs:", error)
    throw error
  }
}
/**
 * 3. Copy Rate Management
 * ----------------------
 * 3.1 Copy Rate Direct
 * @param {CopyRate} copyData - Copy rate data
 * @returns {Promise} Promise containing copy response
 */
export const copyRateDirect = async (copyData: CopyRate) => {
  try {
    const response = await saveData(Tariff.copy, copyData)
    return response
  } catch (error) {
    console.error("Error copying rate:", error)
    throw error
  }
}
/**
 * 3.2 Copy Company Tariff Direct
 * @param {CopyRate} copyData - Copy company tariff data
 * @returns {Promise} Promise containing copy response
 */
export const copyCompanyTariffDirect = async (copyData: CopyRate) => {
  try {
    const response = await saveData(Tariff.copyCompanyTariff, copyData)
    return response
  } catch (error) {
    console.error("Error copying company tariff:", error)
    throw error
  }
}
/**
 * 4. Report/Download Management
 * ---------------------------
 * 4.1 Get RPT Tariff Direct
 * @param {ITariffRPTRequest} rptTariffData - RPT Tariff request data
 * @returns {Promise} Promise containing API response with ITariffRPT[] data
 */

export const getTariffRptDirect = async (rptTariffData: ITariffRPTRequest) => {
  try {
    const response = await postData(Tariff.getTariffRpt, rptTariffData)
    return response as {
      result: number
      message: string
      data: ITariffRPT[]
      totalRecords: number
    }
  } catch (error) {
    console.error("Error getting RPT tariff:", error)
    throw error
  }
}

/**
 * 3. Copy Rate Management
 * ----------------------
 * 3.1 Copy Rate Direct
 * @param {CopyRate} copyData - Copy rate data
 * @returns {Promise} Promise containing copy response
 */
export const copyRateDirectv1 = async (copyData: CopyRate) => {
  try {
    const response = await saveData(Tariff.copy, copyData)
    return response
  } catch (error) {
    console.error("Error copying rate:", error)
    throw error
  }
}
/**
 * 3.2 Copy Company Tariff Direct
 * @param {CopyRate} copyData - Copy company tariff data
 * @returns {Promise} Promise containing copy response
 */
export const copyCompanyTariffDirectv1 = async (copyData: CopyRate) => {
  try {
    const response = await saveData(Tariff.copyCompanyTariff, copyData)
    return response
  } catch (error) {
    console.error("Error copying company tariff:", error)
    throw error
  }
}
