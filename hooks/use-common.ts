import { ApiResponse } from "@/interfaces/auth"
import { UseQueryOptions, useMutation, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import {
  deleteData,
  deleteDataWithRemarks,
  getData,
  saveData,
} from "@/lib/api-client"

// ==================== COMMON TYPES & CONFIGS ====================
type QueryParams = {
  searchString?: string
  pageNumber?: string
  pageSize?: string
  startDate?: string
  endDate?: string
  isAllTime?: string
}

const baseQueryConfig = {
  pageNumber: "1",
  pageSize: "2000",
}

const noCacheQueryOptions = {
  staleTime: 0,
  gcTime: 0,
} as const

interface GridLayoutData {
  companyId: number
  moduleId: number
  transactionId: number
  grdName: string
  grdKey: string
  grdColVisible: string
  grdColOrder: string
  grdSort: string
  grdString: string
}

// ==================== QUERY HOOKS ====================

const cleanUrl = (url: string) => url.replace(/\/+/g, "/")

/**
 * Base GET hook with filters
 */
export function useGet<T>(
  baseUrl: string,
  queryKey: string,
  filters?: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, filters],
    queryFn: async () => {
      const params: QueryParams = {
        ...baseQueryConfig,
        searchString: filters?.trim() || "null",
      }
      return await getData(cleanUrl(baseUrl), params)
    },
    ...noCacheQueryOptions,
    ...options,
  })
}

/**
 * GET by ID hook
 */
export function useGetById<T>(
  baseUrl: string,
  queryKey: string,
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>,
  queryParams?: Partial<QueryParams>
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, id, queryParams],
    queryFn: async () => {
      const params: QueryParams = {
        ...baseQueryConfig,
        ...queryParams,
      }
      return await getData(`${cleanUrl(baseUrl)}/${id}`, params)
    },
    enabled: !!id?.trim(),
    ...noCacheQueryOptions,
    ...options,
  })
}

/**
 * GET with path parameter
 */
export function useGetByPath<T>(
  baseUrl: string,
  queryKey: string,
  path?: string,
  filters?: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, path, filters],
    queryFn: async () => {
      const params: QueryParams = {
        ...baseQueryConfig,
        searchString: filters?.trim() || "null",
      }
      return await getData(`${cleanUrl(baseUrl)}/${path}`, params)
    },
    ...noCacheQueryOptions,
    ...options,
  })
}

/**
 * GET with custom path parameters
 */
export function useGetByParams<T>(
  baseUrl: string,
  queryKey: string,
  params: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, params],
    queryFn: async () => await getData(`${cleanUrl(baseUrl)}/${params}`),
    ...noCacheQueryOptions,
    ...options,
  })
}

/**
 * GET with date range filters
 * @param isAllTime - When true, fetch all data without date filter (pass empty dates to API)
 */
export function useGetWithDates<T>(
  baseUrl: string,
  queryKey: string,
  filters?: string,
  startDate?: string,
  endDate?: string,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>,
  enabled?: boolean,
  isAllTime?: boolean
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, filters, startDate, endDate, isAllTime],
    queryFn: async () => {
      const params: QueryParams = {
        ...baseQueryConfig,
        searchString: filters?.trim() || "",
        startDate: isAllTime ? "" : (startDate?.trim() || ""),
        endDate: isAllTime ? "" : (endDate?.trim() || ""),
        isAllTime: isAllTime ? "true" : "false",
      }
      return await getData(cleanUrl(baseUrl), params)
    },
    ...noCacheQueryOptions,
    enabled, // won't auto-fetch unless manually triggered
    ...options,
  })
}

/**
 * GET with query parameters hook (for endpoints that use [HttpGet] with [FromQuery])
 * Params are passed from other place when calling
 * Uses getData to send parameters as query string and ensure headers are sent via interceptors
 */
export function useGetByBody<T>(
  baseUrl: string,
  queryKey: string,
  data: Record<string, unknown>,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>,
  enabled?: boolean
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, data],
    queryFn: async () => {
      // Convert data object to query parameters (string format for getData)
      const params: Record<string, string> = {}
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = String(value)
        }
      })
      // Use getData to send as query parameters and ensure headers are sent via interceptors
      return await getData(cleanUrl(baseUrl), params)
    },
    ...noCacheQueryOptions,
    enabled, // won't auto-fetch unless manually triggered
    ...options,
  })
}

/**
 * GET with pagination support
 */
export function useGetWithPagination<T>(
  baseUrl: string,
  queryKey: string,
  filters?: string,
  pageNumber: number = 1,
  pageSize: number = 50,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [queryKey, filters, pageNumber, pageSize],
    queryFn: async () => {
      const params: QueryParams = {
        ...baseQueryConfig,
        // Only include searchString if filters is provided and not empty
        // If filters is undefined or empty, don't include searchString (let API handle default)
        ...(filters && filters.trim()
          ? { searchString: filters.trim() }
          : { searchString: "null" }),
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      }
      return await getData(cleanUrl(baseUrl), params)
    },
    ...noCacheQueryOptions,
    refetchOnMount: true,
    ...options,
  })
}

/**
 * GET with date range filters and pagination support
 */
export function useGetWithDatesAndPagination<T>(
  baseUrl: string,
  queryKey: string,
  filters?: string,
  startDate?: string,
  endDate?: string,
  pageNumber: number = 1,
  pageSize: number = 50,
  isAllTime?: boolean,
  options?: Partial<UseQueryOptions<ApiResponse<T>>>,
  enabled?: boolean
) {
  return useQuery<ApiResponse<T>>({
    queryKey: [
      queryKey,
      filters,
      startDate,
      endDate,
      pageNumber,
      pageSize,
      isAllTime,
    ],
    queryFn: async () => {
      const params: QueryParams = {
        ...baseQueryConfig,
        // Only include searchString if filters is provided and not empty
        // If filters is undefined or empty, use "null" to match useGetWithPagination behavior
        ...(filters && filters.trim()
          ? { searchString: filters.trim() }
          : { searchString: "null" }),
        startDate: startDate?.trim() || "",
        endDate: endDate?.trim() || "",
        pageNumber: pageNumber.toString(),
        isAllTime: isAllTime ? "true" : "false",
        pageSize: pageSize.toString(),
      }
      return await getData(cleanUrl(baseUrl), params)
    },
    ...noCacheQueryOptions,
    enabled, // won't auto-fetch unless manually triggered
    ...options,
  })
}

// ==================== MUTATION HOOKS ====================

const handleMutationResponse = (response: ApiResponse<unknown>) => {
  if (response.result === 1) {
    toast.success(response.message || "Operation succeeded")
  } else {
    toast.error(response.message || "Operation failed")
  }
}

const handleMutationError = (error: AxiosError<{ message?: string }>) => {
  toast.error(error.response?.data?.message || "An error occurred")
}

/**
 * Create/Update hook
 */
export function usePersist<T>(baseUrl: string) {
  return useMutation<
    ApiResponse<T>,
    AxiosError<{ message?: string }>,
    Partial<T>
  >({
    mutationFn: async (data) => await saveData(cleanUrl(baseUrl), data),
    onSuccess: handleMutationResponse,
    onError: handleMutationError,
  })
}

/**
 * Delete hook
 */
export function useDelete<T = unknown>(baseUrl: string) {
  return useMutation<ApiResponse<T>, AxiosError<{ message?: string }>, string>({
    mutationFn: async (id) => await deleteData(`${cleanUrl(baseUrl)}/${id}`),
    onSuccess: handleMutationResponse,
    onError: handleMutationError,
  })
}

/**
 * Delete with cancel remarks hook
 */
export function useDeleteWithRemarks<T = unknown>(baseUrl: string) {
  return useMutation<
    ApiResponse<T>,
    AxiosError<{ message?: string }>,
    { documentId: string; documentNo: string; cancelRemarks: string }
  >({
    mutationFn: async ({ documentId, documentNo, cancelRemarks }) =>
      await deleteDataWithRemarks(
        cleanUrl(baseUrl),
        documentId,
        documentNo,
        cancelRemarks
      ),
    onSuccess: handleMutationResponse,
    onError: handleMutationError,
  })
}

/**
 * Specialized grid layout update
 */
export function useUpdateGridLayout() {
  return useMutation({
    mutationFn: async (data: {
      data: GridLayoutData
      moduleId: number
      transactionId: number
    }) => await saveData("/setting/saveUserGrid", data),
    onSuccess: () => toast.success("Layout saved successfully!"),
    onError: (error: AxiosError) => {
      console.error("Error saving grid layout:", error)
      toast.error("Failed to save layout")
    },
  })
}
