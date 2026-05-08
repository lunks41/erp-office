export interface IUser {
  userId: number
  userCode: string
  userName: string
  userEmail: string
  userRoleId: number
  userPassword?: string
  remarks: string
  isActive: boolean
  isLocked: boolean
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface IUserGroup {
  userGroupId: number
  userGroupCode: string
  userGroupName: string
  remarks: string
  isActive: boolean
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface IUserRole {
  userRoleId: number
  userRoleCode: string
  userRoleName: string
  remarks: string
  isActive: boolean
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface ICompany {
  companyId: number
  companyCode: string
  companyName: string
  registrationNo: string
  taxRegistrationNo: string
  molId?: string | null
  address?: string | null
  email?: string | null
  phoneNo?: string | null
  remarks: string
  isActive: boolean
  currencyId: number
  peppolId?: string | null
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface IAuditLog {
  companyName: string
  moduleName: string
  transactionName: string
  documentId: string
  documentNo: string
  tableName: string
  modeName: string
  remarks: string
  createBy: string
  createDate: Date | string
}

export interface IUserLog {
  userName: string
  isLogin: boolean
  loginDate: Date | string
  remarks: string
}

export interface IErrorLog {
  companyName: string
  moduleName: string
  transactionName: string
  documentId: string
  documentNo: string
  tableName: string
  modeName: string
  remarks: string
  createBy: string
  createDate: Date | string
}

// Activation - cancelled documents (accounts)
export interface IActiveDocument {
  documentType: string
  documentId: number
  documentNo: string
  accountDate?: string | null
  referenceNo?: string | null
  moduleId?: number | null
  transactionId?: number | null
  totAmt: number
  gstAmt: number
  totAmtAftGst: number
  createById?: number | null
  createBy?: string | null
  createDate?: string | null
  editById?: number | null
  editBy?: string | null
  editDate?: string | null
  cancelById?: number | null
  cancelBy?: string | null
  cancelDate?: string | null
}

export interface IActivateAccountRequest {
  documentType: string
  documentNo: string
  documentId: number
  moduleId?: number | null
  transactionId?: number | null
}

// Activation - job order status
export interface IJobOrderStatus {
  jobOrderId: number
  jobOrderNo: string
  vesselId?: number | null
  vesselName?: string | null
  customerId?: number | null
  customerName?: string | null
  jobStatusId: number
  jobStatusName?: string | null
}

export interface ISaveJobOrderStatusRequest {
  jobOrderId: number
  jobStatusId: number
}

export interface IUserFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IUserGroupFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IUserRoleFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ICompanyFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IResetPassword {
  userId: number
  userCode: string
  userPassword: string
  confirmPassword: string
}

export interface IUserGroupRights {
  userGroupId: number
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  isRead: boolean
  isCreate: boolean
  isEdit: boolean
  isDelete: boolean
  isExport: boolean
  isPrint: boolean
  isPost: boolean
  isDebitNote: boolean
  isClone: boolean
}

export interface IUserGroupReportRights {
  userGroupId: number
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  isExport: boolean
  isPrint: boolean
}

export interface IShareData {
  userGroupId: number
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  shareToAll: boolean
  setId: number
}

export interface IUserRightsv1 {
  userId: number
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  isRead: boolean
  isCreate: boolean
  isEdit: boolean
  isDelete: boolean
  isExport: boolean
  isPrint: boolean
  isPost: boolean
  isDebitNote: boolean
}

export interface IUserRights {
  companyId: number
  companyCode: string
  companyName: string
  isAccess: boolean
  userId: number
  userGroupId: number
}

export interface ICloneUserGroupRights {
  fromUserGroupId: number
  toUserGroupId: number
}

export interface ICloneUserGroupReportRights {
  fromUserGroupId: number
  toUserGroupId: number
}

export interface IUserProfile {
  // Core Profile
  userId: number
  firstName?: string | null
  lastName?: string | null
  birthDate?: string | null // ISO date string format (YYYY-MM-DD)
  gender?: "M" | "F" | "O" | null // M: Male, F: Female, O: Other
  profilePicture?: string | null // Base64 encoded image or URL
  bio?: string | null

  // Contact Information
  primaryContactType?: "Phone" | "Email" | "WhatsApp" | "Skype" | "Other" | null
  primaryContactValue?: string | null
  secondaryContactType?:
    | "Phone"
    | "Email"
    | "WhatsApp"
    | "Skype"
    | "Other"
    | null
  secondaryContactValue?: string | null

  // Address Information
  addressType?: "Home" | "Office" | "Billing" | "Shipping" | "Other" | null
  street?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null

  // Preferences
  languagePreference?: string | null // BCP 47 language tag (e.g., 'en-US')
  themePreference?: "light" | "dark" | "system" | null
  timezonePreference?: string | null // IANA timezone (e.g., 'America/New_York')

  // Audit Field
  lastUpdated: string // ISO 8601 datetime string
}
