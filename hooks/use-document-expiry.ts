import {
  DashboardSummaryViewModel,
  DocumentAttachmentViewModel,
  DocumentCommentViewModel,
  DocumentViewModel,
  DocumentExpiryApiResponse,
  DocumentExpiryMasters,
  DocumentHeaderViewModel,
  DocumentQueryParams,
  ExpiryReportRowViewModel,
  ReminderRuleViewModel,
  RenewalHistoryReportRowViewModel,
  RenewDocumentViewModel,
  SaveDocumentWithDetailsViewModel,
} from "@/interfaces/document-expiry-view-model"
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

import {
  deleteData,
  getData,
  saveData,
  updateData,
  uploadFile,
} from "@/lib/api-client"
import { DocumentExpiryRoutes } from "@/lib/api-routes"
import { useDelete, usePersist } from "@/hooks/use-common"

const noCache = { staleTime: 0, gcTime: 0 } as const

function toQueryRecord(params: DocumentQueryParams): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.pageNumber != null) out.PageNumber = String(params.pageNumber)
  if (params.pageSize != null) out.PageSize = String(params.pageSize)
  if (params.search?.trim()) out.Search = params.search.trim()
  if (params.documentTypeId != null)
    out.DocumentTypeId = String(params.documentTypeId)
  if (params.documentCategoryId != null)
    out.DocumentCategoryId = String(params.documentCategoryId)
  if (params.statusId != null) out.StatusId = String(params.statusId)
  if (params.daysAhead != null) out.DaysAhead = String(params.daysAhead)
  if (params.expiredOnly) out.ExpiredOnly = "true"
  if (params.criticalOnly) out.CriticalOnly = "true"
  if (params.includeCancelled) out.IncludeCancelled = "true"
  return out
}

export const documentExpiryKeys = {
  masters: ["doc-expiry-masters"] as const,
  documents: (params: DocumentQueryParams) =>
    ["doc-expiry-documents", params] as const,
  document: (id: string) => ["doc-expiry-document", id] as const,
  dashboardSummary: ["doc-expiry-dashboard-summary"] as const,
  expiring: (params: DocumentQueryParams) =>
    ["doc-expiry-expiring", params] as const,
  expired: (params: DocumentQueryParams) =>
    ["doc-expiry-expired", params] as const,
  critical: ["doc-expiry-critical"] as const,
  reminderRules: ["doc-expiry-reminder-rules"] as const,
  attachments: (docId: string, itemNo: string) =>
    ["doc-expiry-attachments", docId, itemNo] as const,
  comments: (id: string) => ["doc-expiry-comments", id] as const,
  expiryReport: (params: DocumentQueryParams) =>
    ["doc-expiry-report-expiry", params] as const,
  renewalHistory: (from?: string, to?: string) =>
    ["doc-expiry-report-renewal", from, to] as const,
}

export function useDocumentExpiryMasters() {
  return useQuery({
    queryKey: documentExpiryKeys.masters,
    queryFn: async (): Promise<DocumentExpiryMasters> => {
      const [typesRes, categoriesRes] = await Promise.all([
        getData(DocumentExpiryRoutes.documentTypes.types),
        getData(DocumentExpiryRoutes.documentTypes.categories),
      ])
      const types =
        (typesRes as DocumentExpiryApiResponse<DocumentExpiryMasters["types"]>)
          .data ?? []
      const categories =
        (
          categoriesRes as DocumentExpiryApiResponse<
            DocumentExpiryMasters["categories"]
          >
        ).data ?? []
      return { types, categories }
    },
    ...noCache,
  })
}

export function useDocumentsList(
  params: DocumentQueryParams,
  options?: Partial<UseQueryOptions<DocumentExpiryApiResponse<DocumentViewModel[]>>>
) {
  return useQuery({
    queryKey: documentExpiryKeys.documents(params),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.documents.list,
        toQueryRecord(params)
      )) as DocumentExpiryApiResponse<DocumentViewModel[]>,
    ...noCache,
    ...options,
  })
}

export function useDocumentById(id: string) {
  return useQuery({
    queryKey: documentExpiryKeys.document(id),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.documents.byId(id)
      )) as DocumentExpiryApiResponse<DocumentHeaderViewModel>,
    enabled: !!id?.trim(),
    ...noCache,
  })
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: documentExpiryKeys.dashboardSummary,
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.dashboard.summary
      )) as DocumentExpiryApiResponse<DashboardSummaryViewModel>,
    ...noCache,
  })
}

export function useExpiringDocuments(
  params: DocumentQueryParams = { pageSize: 10 }
) {
  return useQuery({
    queryKey: documentExpiryKeys.expiring(params),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.dashboard.expiring,
        toQueryRecord(params)
      )) as DocumentExpiryApiResponse<DocumentViewModel[]>,
    ...noCache,
  })
}

export function useExpiredDocuments(
  params: DocumentQueryParams = { pageSize: 10 }
) {
  return useQuery({
    queryKey: documentExpiryKeys.expired(params),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.dashboard.expired,
        toQueryRecord(params)
      )) as DocumentExpiryApiResponse<DocumentViewModel[]>,
    ...noCache,
  })
}

export function useCriticalDocuments() {
  return useQuery({
    queryKey: documentExpiryKeys.critical,
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.dashboard.critical
      )) as DocumentExpiryApiResponse<DocumentViewModel[]>,
    ...noCache,
  })
}

export function useReminderRules() {
  return useQuery({
    queryKey: documentExpiryKeys.reminderRules,
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.reminderRules.list
      )) as DocumentExpiryApiResponse<ReminderRuleViewModel[]>,
    ...noCache,
  })
}

export function useDocumentAttachments(
  documentId: string,
  itemNo: string
) {
  return useQuery({
    queryKey: documentExpiryKeys.attachments(documentId, itemNo),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.documents.detailAttachments(
          documentId,
          itemNo
        )
      )) as DocumentExpiryApiResponse<DocumentAttachmentViewModel[]>,
    enabled: !!documentId?.trim() && !!itemNo?.trim(),
    ...noCache,
  })
}

export function useExpiryReport(params: DocumentQueryParams = {}) {
  return useQuery({
    queryKey: documentExpiryKeys.expiryReport(params),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.reports.expiry,
        toQueryRecord(params)
      )) as DocumentExpiryApiResponse<ExpiryReportRowViewModel[]>,
    ...noCache,
  })
}

export function useRenewalHistoryReport(fromDate?: string, toDate?: string) {
  const params: Record<string, string> = {}
  if (fromDate) params.fromDate = fromDate
  if (toDate) params.toDate = toDate
  return useQuery({
    queryKey: documentExpiryKeys.renewalHistory(fromDate, toDate),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.reports.renewalHistory,
        params
      )) as DocumentExpiryApiResponse<RenewalHistoryReportRowViewModel[]>,
    ...noCache,
  })
}

export function useSaveDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: SaveDocumentWithDetailsViewModel) => {
      if (dto.documentId && dto.documentId > 0) {
        return (await updateData(
          DocumentExpiryRoutes.documents.update(dto.documentId),
          dto
        )) as DocumentExpiryApiResponse<DocumentHeaderViewModel>
      }
      return (await saveData(
        DocumentExpiryRoutes.documents.create,
        dto
      )) as DocumentExpiryApiResponse<DocumentHeaderViewModel>
    },
    onSuccess: (res) => {
      if (res.result === 1) {
        toast.success("Document saved")
        void queryClient.invalidateQueries({
          predicate: (q) =>
            String(q.queryKey[0] ?? "").startsWith("doc-expiry"),
        })
      } else {
        toast.error(res.message || "Failed to save document")
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || "Failed to save document")
    },
  })
}

export function useDeleteDocument() {
  return useDelete(DocumentExpiryRoutes.documents.list)
}

export function useCancelDocumentDetail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      itemNo,
    }: {
      documentId: number | string
      itemNo: number | string
    }) =>
      saveData(
        DocumentExpiryRoutes.documents.detailCancel(documentId, itemNo),
        {}
      ),
    onSuccess: (res: { result?: number; message?: string }) => {
      if (res?.result === 1) {
        toast.success("Document line cancelled")
        void queryClient.invalidateQueries({
          predicate: (q) =>
            String(q.queryKey[0] ?? "").startsWith("doc-expiry"),
        })
      } else {
        toast.error(res?.message || "Cancel failed")
      }
    },
    onError: () => toast.error("Cancel failed"),
  })
}

export function useRenewDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      itemNo,
      dto,
    }: {
      documentId: number | string
      itemNo: number | string
      dto: RenewDocumentViewModel
    }) =>
      (await saveData(
        DocumentExpiryRoutes.documents.detailRenew(documentId, itemNo),
        dto
      )) as DocumentExpiryApiResponse<unknown>,
    onSuccess: (res) => {
      if (res.result === 1) {
        toast.success("Document renewed")
        void queryClient.invalidateQueries({
          predicate: (q) =>
            String(q.queryKey[0] ?? "").startsWith("doc-expiry"),
        })
      } else {
        toast.error(res.message || "Renewal failed")
      }
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message || "Renewal failed")
    },
  })
}

export function useUploadDocumentAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      itemNo,
      file,
    }: {
      documentId: number | string
      itemNo: number | string
      file: File
    }) =>
      uploadFile(
        DocumentExpiryRoutes.documents.detailAttachments(
          documentId,
          itemNo
        ),
        file
      ),
    onSuccess: (res: { result?: number; message?: string }) => {
      if (res?.result === 1) {
        toast.success("File uploaded")
        queryClient.invalidateQueries({ queryKey: ["doc-expiry-attachments"] })
      } else {
        toast.error(res?.message || "Upload failed")
      }
    },
    onError: () => toast.error("Upload failed"),
  })
}

export function useDocumentComments(documentId: string) {
  return useQuery({
    queryKey: documentExpiryKeys.comments(documentId),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.documents.comments(documentId)
      )) as DocumentExpiryApiResponse<DocumentCommentViewModel[]>,
    enabled: !!documentId?.trim(),
    ...noCache,
  })
}

export function useAddDocumentComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      commentText,
    }: {
      documentId: number | string
      commentText: string
    }) =>
      (await saveData(DocumentExpiryRoutes.documents.comments(documentId), {
        documentId: Number(documentId),
        commentText,
      })) as DocumentExpiryApiResponse<DocumentCommentViewModel>,
    onSuccess: (res, vars) => {
      if (res.result === 1) {
        toast.success("Comment added")
        void queryClient.invalidateQueries({
          queryKey: documentExpiryKeys.comments(String(vars.documentId)),
        })
      } else {
        toast.error(res.message || "Failed to add comment")
      }
    },
    onError: () => toast.error("Failed to add comment"),
  })
}

export function useDeleteDocumentComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      commentId,
    }: {
      documentId: number | string
      commentId: number | string
    }) =>
      deleteData(DocumentExpiryRoutes.documents.comment(documentId, commentId)),
    onSuccess: (_, vars) => {
      toast.success("Comment removed")
      void queryClient.invalidateQueries({
        queryKey: documentExpiryKeys.comments(String(vars.documentId)),
      })
    },
    onError: () => toast.error("Failed to remove comment"),
  })
}

export function useSaveReminderRule() {
  return usePersist<ReminderRuleViewModel>(DocumentExpiryRoutes.reminderRules.save)
}

export function useDeleteReminderRule() {
  return useDelete(DocumentExpiryRoutes.reminderRules.list)
}
