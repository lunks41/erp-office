import {
  DocumentCategoryDto,
  DocumentExpiryApiResponse,
  DocumentStatusDto,
  DocumentTypeDto,
  ReferenceTypeDto,
  SaveDocumentCategoryDto,
  SaveDocumentStatusDto,
  SaveDocumentTypeDto,
  SaveReferenceTypeDto,
} from "@/interfaces/document-expiry"
import { DocumentExpiryRoutes } from "@/lib/document-expiry-routes"
import { deleteData, getData, saveData } from "@/lib/api-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const noCache = { staleTime: 0, gcTime: 0 } as const

export const docExpirySetupKeys = {
  types: ["doc-expiry-setup-types"] as const,
  categories: ["doc-expiry-setup-categories"] as const,
  referenceTypes: ["doc-expiry-setup-reference-types"] as const,
  statuses: ["doc-expiry-setup-statuses"] as const,
}

function useSetupList<T>(key: readonly string[], url: string) {
  return useQuery({
    queryKey: key,
    queryFn: async () =>
      (await getData(url, { includeInactive: "true" })) as DocumentExpiryApiResponse<
        T[]
      >,
    ...noCache,
  })
}

export function useDocExpiryTypesSetup() {
  return useSetupList<DocumentTypeDto>(
    docExpirySetupKeys.types,
    DocumentExpiryRoutes.setup.types
  )
}

export function useDocExpiryCategoriesSetup() {
  return useSetupList<DocumentCategoryDto>(
    docExpirySetupKeys.categories,
    DocumentExpiryRoutes.setup.categories
  )
}

export function useDocExpiryReferenceTypesSetup() {
  return useSetupList<ReferenceTypeDto>(
    docExpirySetupKeys.referenceTypes,
    DocumentExpiryRoutes.setup.referenceTypes
  )
}

export function useDocExpiryStatusesSetup() {
  return useSetupList<DocumentStatusDto>(
    docExpirySetupKeys.statuses,
    DocumentExpiryRoutes.setup.statuses
  )
}

function useSetupSave<TSave>(url: string, keys: readonly (readonly string[])[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: TSave) => {
      const res = (await saveData(url, dto)) as DocumentExpiryApiResponse<unknown>
      if (res.result !== 1) {
        throw new Error(res.message ?? "Save failed")
      }
      return res
    },
    onSuccess: () => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }))
      queryClient.invalidateQueries({ queryKey: ["doc-expiry-masters"] })
      toast.success("Saved")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

function useSetupDelete(urlFn: (id: string) => string, keys: readonly (readonly string[])[]) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = (await deleteData(urlFn(id))) as DocumentExpiryApiResponse<null>
      if (res.result !== 1) {
        throw new Error(res.message ?? "Delete failed")
      }
    },
    onSuccess: () => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }))
      queryClient.invalidateQueries({ queryKey: ["doc-expiry-masters"] })
      toast.success("Deactivated")
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useSaveDocExpiryType() {
  return useSetupSave<SaveDocumentTypeDto>(
    DocumentExpiryRoutes.setup.types,
    [docExpirySetupKeys.types]
  )
}

export function useDeleteDocExpiryType() {
  return useSetupDelete(DocumentExpiryRoutes.setup.deleteType, [
    docExpirySetupKeys.types,
  ])
}

export function useSaveDocExpiryCategory() {
  return useSetupSave<SaveDocumentCategoryDto>(
    DocumentExpiryRoutes.setup.categories,
    [docExpirySetupKeys.categories]
  )
}

export function useDeleteDocExpiryCategory() {
  return useSetupDelete(DocumentExpiryRoutes.setup.deleteCategory, [
    docExpirySetupKeys.categories,
  ])
}

export function useSaveDocExpiryReferenceType() {
  return useSetupSave<SaveReferenceTypeDto>(
    DocumentExpiryRoutes.setup.referenceTypes,
    [docExpirySetupKeys.referenceTypes]
  )
}

export function useDeleteDocExpiryReferenceType() {
  return useSetupDelete(DocumentExpiryRoutes.setup.deleteReferenceType, [
    docExpirySetupKeys.referenceTypes,
  ])
}

export function useSaveDocExpiryStatus() {
  return useSetupSave<SaveDocumentStatusDto>(
    DocumentExpiryRoutes.setup.statuses,
    [docExpirySetupKeys.statuses]
  )
}

export function useDeleteDocExpiryStatus() {
  return useSetupDelete(DocumentExpiryRoutes.setup.deleteStatus, [
    docExpirySetupKeys.statuses,
  ])
}
