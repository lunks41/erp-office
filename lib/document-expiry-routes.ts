/** Document Expiry API routes (relative to apiClient base `/api/proxy`). */
export const DocumentExpiryRoutes = {
  documents: {
    list: "/documentexpiry/documents",
    byId: (id: number | string) => `/documentexpiry/documents/${id}`,
    create: "/documentexpiry/documents",
    update: (id: number | string) => `/documentexpiry/documents/${id}`,
    delete: (id: number | string) => `/documentexpiry/documents/${id}`,
    renew: (id: number | string) => `/documentexpiry/documents/${id}/renew`,
    attachments: (id: number | string) =>
      `/documentexpiry/documents/${id}/attachments`,
    attachment: (id: number | string, attachmentId: number | string) =>
      `/documentexpiry/documents/${id}/attachments/${attachmentId}`,
  },
  documentTypes: {
    types: "/documentexpiry/documenttypes/types",
    categories: "/documentexpiry/documenttypes/categories",
    referenceTypes: "/documentexpiry/documenttypes/referencetypes",
  },
  reminderRules: {
    list: "/documentexpiry/reminderrules",
    byId: (id: number | string) => `/documentexpiry/reminderrules/${id}`,
    save: "/documentexpiry/reminderrules",
    delete: (id: number | string) => `/documentexpiry/reminderrules/${id}`,
  },
  dashboard: {
    summary: "/documentexpiry/dashboard/summary",
    expiring: "/documentexpiry/dashboard/expiring",
    expired: "/documentexpiry/dashboard/expired",
    critical: "/documentexpiry/dashboard/critical",
  },
  reports: {
    expiry: "/documentexpiry/reports/expiry",
    renewalHistory: "/documentexpiry/reports/renewal-history",
  },
} as const

export type DocumentExpiryPriority = 1 | 2 | 3

export const EXPIRY_PRIORITY_LABELS: Record<DocumentExpiryPriority, string> = {
  1: "Info",
  2: "Warning",
  3: "Critical",
}
