import { ITemplateFilter, ITemplateHd } from "@/interfaces/template"
import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"

import {
  getById,
  getData,
  postData,
  saveData,
} from "@/lib/api-client"
import { Template } from "@/lib/api-routes"

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
 * 1. Template Management
 * ---------------------
 * 1.1 Get Templates
 * @param {number} companyId - Company ID
 * @param {ITemplateFilter} filters - Optional filters
 * @returns {object} Query object containing template data
 */
export function useGetTemplates(companyId: number, filters?: ITemplateFilter) {
  return useQuery<{
    result: number
    message: string
    data: ITemplateHd[]
    totalRecords: number
  }>({
    queryKey: ["templates", companyId, filters],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams()
        if (filters?.search) {
          queryParams.append("search", filters.search)
        }
        if (filters?.sortOrder) {
          queryParams.append("sortOrder", filters.sortOrder)
        }
        const url = `${Template.get}/${companyId}${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`
        const data = await getData(url)
        return data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0,
    // Always fetch data, even without filters
    refetchOnMount: true,
  })
}

/**
 * 1.2 Get Template By ID
 * @param {number} companyId - Company ID
 * @param {number} templateId - Template ID
 * @returns {object} Query object containing template data
 */
export function useGetTemplateById(
  companyId: number,
  templateId: number | undefined
) {
  return useQuery<{
    result: number
    message: string
    data: ITemplateHd
    totalRecords: number
  }>({
    queryKey: ["template", companyId, templateId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getById(
          `${Template.getById}/${companyId}/${templateId}`
        )
        return data
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0 && templateId !== undefined && templateId > 0,
  })
}

/**
 * 2. Direct API Call Functions
 * ---------------------------
 * 2.1 Save Template Direct
 * @param {Partial<ITemplateHd>} templateData - Template data to save
 * @returns {Promise} Promise containing save response
 */
export const saveTemplateDirect = async (
  templateData: Partial<ITemplateHd>
) => {
  try {
    const response = await saveData(Template.add, templateData)
    return response
  } catch (error) {
    console.error("Error saving template:", error)
    throw error
  }
}

/**
 * 2.2 Update Template Direct
 * @param {Partial<ITemplateHd>} templateData - Template data to update
 * @returns {Promise} Promise containing update response
 */
export const updateTemplateDirect = async (
  templateData: Partial<ITemplateHd>
) => {
  try {
    const response = await saveData(Template.add, templateData)
    return response
  } catch (error) {
    console.error("Error updating template:", error)
    throw error
  }
}

/**
 * 2.3 Delete Template Direct
 * @param {number} companyId - Company ID
 * @param {number} templateId - Template ID to delete
 * @returns {Promise} Promise containing delete response
 */
export const deleteTemplateDirect = async (
  companyId: number,
  templateId: number
) => {
  try {
    const response = await postData(
      `${Template.delete}/${companyId}/${templateId}`,
      {}
    )
    return response
  } catch (error) {
    console.error("Error deleting template:", error)
    throw error
  }
}
