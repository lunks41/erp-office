import {
  DashboardSummaryDto,
  DocumentAttachmentDto,
  DocumentDto,
  DocumentExpiryApiResponse,
  DocumentExpiryMasters,
  DocumentQueryParams,
  ExpiryReportRowDto,
  ReminderRuleDto,
  RenewalHistoryReportRowDto,
  RenewDocumentDto,
  SaveDocumentDto,
  SaveReminderRuleDto,
} from "@/interfaces/document-expiry"
import { DocumentExpiryRoutes } from "@/lib/document-expiry-routes"
import {
  deleteData,
  getData,
  saveData,
  updateData,
  uploadFile,
} from "@/lib/api-client"
import { useDelete, usePersist } from "@/hooks/use-common"
import {
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

const noCache = { staleTime: 0, gcTime: 0 } as const

function toQueryRecord(
  params: DocumentQueryParams
): Record<string, string> {
  const out: Record<string, string> = {}
  if (params.pageNumber != null) out.PageNumber = String(params.pageNumber)
  if (params.pageSize != null) out.PageSize = String(params.pageSize)
  if (params.search?.trim()) out.Search = params.search.trim()
  if (params.documentTypeId != null)
    out.DocumentTypeId = String(params.documentTypeId)
  if (params.documentCategoryId != null)
    out.DocumentCategoryId = String(params.documentCategoryId)
  if (params.statusId != null) out.StatusId = String(params.statusId)
  if (params.referenceTypeId != null)
    out.ReferenceTypeId = String(params.referenceTypeId)
  if (params.referenceId != null) out.ReferenceId = String(params.referenceId)
  if (params.daysAhead != null) out.DaysAhead = String(params.daysAhead)
  if (params.expiredOnly) out.ExpiredOnly = "true"
  if (params.criticalOnly) out.CriticalOnly = "true"
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
  attachments: (id: string) => ["doc-expiry-attachments", id] as const,
  expiryReport: (params: DocumentQueryParams) =>
    ["doc-expiry-report-expiry", params] as const,
  renewalHistory: (from?: string, to?: string) =>
    ["doc-expiry-report-renewal", from, to] as const,
}

export function useDocumentExpiryMasters() {
  return useQuery({
    queryKey: documentExpiryKeys.masters,
    queryFn: async (): Promise<DocumentExpiryMasters> => {
      const [typesRes, categoriesRes, refRes] = await Promise.all([
        getData(DocumentExpiryRoutes.documentTypes.types),
        getData(DocumentExpiryRoutes.documentTypes.categories),
        getData(DocumentExpiryRoutes.documentTypes.referenceTypes),
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
      const referenceTypes =
        (
          refRes as DocumentExpiryApiResponse<
            DocumentExpiryMasters["referenceTypes"]
          >
        ).data ?? []
      return { types, categories, referenceTypes }
    },
    ...noCache,
  })
}

export function useDocumentsList(
  params: DocumentQueryParams,
  options?: Partial<UseQueryOptions<DocumentExpiryApiResponse<DocumentDto[]>>>
) {
  return useQuery({
    queryKey: documentExpiryKeys.documents(params),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.documents.list,
        toQueryRecord(params)
      )) as DocumentExpiryApiResponse<DocumentDto[]>,
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
      )) as DocumentExpiryApiResponse<DocumentDto>,
    enabled: !!id?.trim(),
    ...noCache,
  })
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: documentExpiryKeys.dashboardSummary,
    queryFn: async () =>
      (await getData(DocumentExpiryRoutes.dashboard.summary)) as DocumentExpiryApiResponse<DashboardSummaryDto>,
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
      )) as DocumentExpiryApiResponse<DocumentDto[]>,
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
      )) as DocumentExpiryApiResponse<DocumentDto[]>,
    ...noCache,
  })
}

export function useCriticalDocuments() {
  return useQuery({
    queryKey: documentExpiryKeys.critical,
    queryFn: async () =>
      (await getData(DocumentExpiryRoutes.dashboard.critical)) as DocumentExpiryApiResponse<DocumentDto[]>,
    ...noCache,
  })
}

export function useReminderRules() {
  return useQuery({
    queryKey: documentExpiryKeys.reminderRules,
    queryFn: async () =>
      (await getData(DocumentExpiryRoutes.reminderRules.list)) as DocumentExpiryApiResponse<ReminderRuleDto[]>,
    ...noCache,
  })
}

export function useDocumentAttachments(documentId: string) {
  return useQuery({
    queryKey: documentExpiryKeys.attachments(documentId),
    queryFn: async () =>
      (await getData(
        DocumentExpiryRoutes.documents.attachments(documentId)
      )) as DocumentExpiryApiResponse<DocumentAttachmentDto[]>,
    enabled: !!documentId?.trim(),
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
      )) as DocumentExpiryApiResponse<ExpiryReportRowDto[]>,
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
      )) as DocumentExpiryApiResponse<RenewalHistoryReportRowDto[]>,
    ...noCache,
  })
}

export function useSaveDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: SaveDocumentDto) => {
      if (dto.documentId && dto.documentId > 0) {
        return (await updateData(
          DocumentExpiryRoutes.documents.update(dto.documentId),
          dto
        )) as DocumentExpiryApiResponse<DocumentDto>
      }
      return (await saveData(
        DocumentExpiryRoutes.documents.create,
        dto
      )) as DocumentExpiryApiResponse<DocumentDto>
    },
    onSuccess: (res) => {
      if (res.result === 1) {
        toast.success("Document saved")
        void queryClient.invalidateQueries({ predicate: (q) =>
          String(q.queryKey[0] ?? "").startsWith("doc-expiry")
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

export function useRenewDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: number | string
      dto: RenewDocumentDto
    }) =>
      (await saveData(
        DocumentExpiryRoutes.documents.renew(id),
        dto
      )) as DocumentExpiryApiResponse<DocumentDto>,
    onSuccess: (res) => {
      if (res.result === 1) {
        toast.success("Document renewed")
        void queryClient.invalidateQueries({ predicate: (q) =>
          String(q.queryKey[0] ?? "").startsWith("doc-expiry")
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
      file,
    }: {
      documentId: number | string
      file: File
    }) =>
      uploadFile(
        DocumentExpiryRoutes.documents.attachments(documentId),
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

export function useSaveReminderRule() {
  return usePersist<ReminderRuleDto>(DocumentExpiryRoutes.reminderRules.save)
}

export function useDeleteReminderRule() {
  return useDelete(DocumentExpiryRoutes.reminderRules.list)
}
