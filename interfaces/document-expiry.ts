/** Document Expiry types aligned with api-core Models/DocumentExpiry. */

export interface DocumentDto {
  documentId: number
  companyId: number
  branchId?: number | null
  documentTypeId: number
  documentTypeCode?: string | null
  documentTypeName?: string | null
  documentCategoryId: number
  documentCategoryName?: string | null
  referenceTypeId: number
  referenceTypeName?: string | null
  referenceId: number
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
  previousDocumentId?: number | null
  attachmentCount: number
  lastReminderSentOn?: string | null
  remarks?: string | null
  daysUntilExpiry: number
  createdById: number
  createdDate: string
  editById?: number | null
  editDate?: string | null
}

export interface SaveDocumentDto {
  documentId?: number
  branchId?: number | null
  documentTypeId: number
  documentCategoryId: number
  referenceTypeId: number
  referenceId: number
  documentNo?: string | null
  documentTitle: string
  description?: string | null
  issueDate?: string | null
  expiryDate: string
  reminderDays?: number | null
  isMandatory: boolean
  remarks?: string | null
}

export interface RenewDocumentDto {
  documentId?: number
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
  referenceTypeId?: number
  referenceId?: number
  daysAhead?: number
  expiredOnly?: boolean
  criticalOnly?: boolean
}

export interface DocumentTypeDto {
  documentTypeId: number
  documentTypeCode: string
  documentTypeName: string
  defaultReminderDays: number
  isExpiryRequired: boolean
  isMandatory: boolean
  isActive: boolean
}

export interface DocumentCategoryDto {
  documentCategoryId: number
  documentCategoryCode: string
  documentCategoryName: string
}

export interface ReferenceTypeDto {
  referenceTypeId: number
  referenceTypeCode: string
  referenceTypeName: string
}

export interface ReminderRuleDto {
  reminderRuleId: number
  companyId: number
  documentTypeId?: number | null
  documentTypeName?: string | null
  daysBeforeExpiry: number
  notificationTypeId: number
  priorityLevel: number
  isPopupEnabled: boolean
  isEmailEnabled: boolean
  isActive: boolean
}

export interface SaveReminderRuleDto {
  reminderRuleId: number
  documentTypeId?: number | null
  daysBeforeExpiry: number
  priorityLevel: number
  isPopupEnabled: boolean
  isEmailEnabled: boolean
  isActive: boolean
}

export interface DocumentAttachmentDto {
  attachmentId: number
  documentId: number
  fileName: string
  filePath: string
  fileExtension: string
  fileSize: number
  contentType: string
  versionNo: number
  uploadedDate: string
}

export interface DocumentHistoryDto {
  historyId: number
  documentId: number
  oldExpiryDate?: string | null
  newExpiryDate?: string | null
  actionType: string
  remarks?: string | null
  changedDate: string
}

export interface DocumentCommentDto {
  commentId: number
  documentId: number
  commentText: string
  createdById?: number
  createdByName?: string | null
  createdDate: string
}

export interface SaveDocumentCommentDto {
  documentId: number
  commentText: string
}

export interface DashboardSummaryDto {
  companyId: number
  totalDocuments: number
  activeCount: number
  expiringCount: number
  expiredCount: number
  renewedThisMonthCount: number
  critical7DaysCount: number
  expiring30DaysCount: number
}

export interface ExpiryReportRowDto {
  documentId: number
  documentTitle: string
  documentTypeName?: string | null
  documentCategoryName?: string | null
  referenceTypeName?: string | null
  referenceId: number
  expiryDate: string
  statusName?: string | null
  daysUntilExpiry: number
}

export interface RenewalHistoryReportRowDto {
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
  types: DocumentTypeDto[]
  categories: DocumentCategoryDto[]
  referenceTypes: ReferenceTypeDto[]
}
