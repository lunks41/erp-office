/** Document Expiry types aligned with api-core Models/DocumentExpiry (ViewModel). */

export interface DocumentViewModel {
  itemNo: number
  documentId: number
  companyId: number
  companyName?: string | null
  branchId?: number | null
  documentTypeId: number
  documentTypeCode?: string | null
  documentTypeName?: string | null
  documentCategoryId: number
  documentCategoryName?: string | null
  documentNo?: string | null
  documentTitle: string
  description?: string | null
  issueDate?: string | null
  expiryDate: string
  reminderDays: number
  statusId: number
  statusCode?: string | null
  statusName?: string | null
  priorityLevel: number
  isMandatory: boolean
  isRenewed: boolean
  previousItemNo?: number | null
  attachmentCount: number
  lastReminderSentOn?: string | null
  remarks?: string | null
  daysUntilExpiry: number
  createdById: number
  createdDate: string
  editById?: number | null
  editDate?: string | null
}

export interface DocumentDetailViewModel {
  itemNo: number
  documentId: number
  documentTypeId: number
  documentTypeCode?: string | null
  documentTypeName?: string | null
  documentNo?: string | null
  issueDate?: string | null
  expiryDate: string
  reminderDays: number
  statusId: number
  statusCode?: string | null
  statusName?: string | null
  priorityLevel: number
  isMandatory: boolean
  isRenewed: boolean
  previousItemNo?: number | null
  attachmentCount: number
  lastReminderSentOn?: string | null
  remarks?: string | null
  daysUntilExpiry: number
}

export interface DocumentHeaderViewModel {
  documentId: number
  companyId: number
  companyName?: string | null
  branchId?: number | null
  documentCategoryId: number
  documentCategoryName?: string | null
  documentTitle: string
  description?: string | null
  remarks?: string | null
  createdById: number
  createdDate: string
  editById?: number | null
  editDate?: string | null
  details: DocumentDetailViewModel[]
}

export interface SaveDocumentDetailViewModel {
  itemNo?: number
  documentTypeId: number
  documentNo?: string | null
  issueDate?: string | null
  expiryDate: string
  reminderDays?: number | null
  isMandatory: boolean
  remarks?: string | null
}

export interface SaveDocumentWithDetailsViewModel {
  documentId?: number
  companyId: number
  branchId?: number | null
  documentCategoryId: number
  documentTitle: string
  description?: string | null
  remarks?: string | null
  details: SaveDocumentDetailViewModel[]
}

export interface RenewDocumentViewModel {
  itemNo?: number
  newExpiryDate: string
  newIssueDate?: string | null
  documentNo?: string | null
  remarks?: string | null
}

export interface DocumentQueryParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  documentTypeId?: number
  documentCategoryId?: number
  statusId?: number
  daysAhead?: number
  expiredOnly?: boolean
  criticalOnly?: boolean
  includeCancelled?: boolean
}

export interface DocumentTypeViewModel {
  documentTypeId: number
  documentTypeCode: string
  documentTypeName: string
  defaultReminderDays: number
  isExpiryRequired: boolean
  isMandatory: boolean
  isActive: boolean
}

export interface DocumentCategoryViewModel {
  documentCategoryId: number
  documentCategoryCode: string
  documentCategoryName: string
  isActive: boolean
}

export interface DocumentStatusViewModel {
  statusId: number
  statusCode: string
  statusName: string
  isActive: boolean
}

export interface SaveDocumentTypeViewModel {
  documentTypeId: number
  documentTypeCode: string
  documentTypeName: string
  defaultReminderDays: number
  isExpiryRequired: boolean
  isMandatory: boolean
  isActive: boolean
}

export interface SaveDocumentCategoryViewModel {
  documentCategoryId: number
  documentCategoryCode: string
  documentCategoryName: string
  isActive: boolean
}

export interface SaveDocumentStatusViewModel {
  statusId: number
  statusCode: string
  statusName: string
  isActive: boolean
}

export interface ReminderRuleViewModel {
  reminderRuleId: number
  documentTypeId?: number | null
  documentTypeName?: string | null
  daysBeforeExpiry: number
  notificationTypeId: number
  priorityLevel: number
  isPopupEnabled: boolean
  isEmailEnabled: boolean
  isActive: boolean
}

export interface SaveReminderRuleViewModel {
  reminderRuleId: number
  documentTypeId?: number | null
  daysBeforeExpiry: number
  priorityLevel: number
  isPopupEnabled: boolean
  isEmailEnabled: boolean
  isActive: boolean
}

export interface DocumentAttachmentViewModel {
  attachmentId: number
  itemNo: number
  fileName: string
  filePath: string
  fileExtension: string
  fileSize: number
  contentType: string
  versionNo: number
  uploadedDate: string
}

export interface DocumentHistoryViewModel {
  historyId: number
  itemNo: number
  documentId: number
  oldExpiryDate?: string | null
  newExpiryDate?: string | null
  actionType: string
  remarks?: string | null
  changedDate: string
}

export interface DocumentCommentViewModel {
  commentId: number
  documentId: number
  commentText: string
  createdById?: number
  createdByName?: string | null
  createdDate: string
}

export interface SaveDocumentCommentViewModel {
  documentId: number
  commentText: string
}

export interface DashboardSummaryViewModel {
  totalDocuments: number
  activeCount: number
  expiringCount: number
  expiredCount: number
  renewedThisMonthCount: number
  critical7DaysCount: number
  expiring30DaysCount: number
}

export interface ExpiryReportRowViewModel {
  itemNo: number
  documentId: number
  documentTitle: string
  documentTypeName?: string | null
  documentCategoryName?: string | null
  expiryDate: string
  statusName?: string | null
  daysUntilExpiry: number
}

export interface RenewalHistoryReportRowViewModel {
  itemNo: number
  documentId: number
  documentTitle: string
  oldExpiryDate?: string | null
  newExpiryDate?: string | null
  actionType: string
  changedDate: string
  remarks?: string | null
}

export interface DocumentExpiryApiResponse<T> {
  result: number
  message?: string
  data: T
  totalRecords?: number
}

export interface DocumentExpiryMasters {
  types: DocumentTypeViewModel[]
  categories: DocumentCategoryViewModel[]
}
