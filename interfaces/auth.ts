// export interface IUser {
//   id: string
//   name: string
//   email: string
//   role: string
// }

export interface IUser {
  userId: string
  userCode: string
  userName: string
  userEmail: string
  remarks: string
  isActive: boolean
  isLocked: boolean
  failedLoginAttempts: number
  userRoleId: string
  userRoleName: string
  profilePicture: string
}

export interface ICompany {
  companyId: string
  companyName: string
  companyCode: string
  navColor?: string | null
}

export interface IDecimal {
  amtDec: number
  locAmtDec: number
  ctyAmtDec: number
  priceDec: number
  qtyDec: number
  exhRateDec: number
  dateFormat: string
  longDateFormat: string
}

export interface IApiErrorResponse {
  status: number
  message: string
  errors?: Record<string, string[]>
  timestamp?: string
}

export interface IApiSuccessResponse<T> {
  result: number
  message: string
  data: T
}

export interface ApiResponse<T> {
  result: number
  message: string
  data: T[] // Array of items (e.g., ICountry[])
  totalRecords?: number
}

export interface IActiveSession {
  sessionId: number
  browserName?: string
  browserVersion?: string
  osName?: string
  deviceType?: string
  ipAddress?: string
  platform?: string
  screenResolution?: string
  loginAt: string
  lastActivityAt?: string
}

export interface AuthResponse {
  result: number
  message: string
  user: IUser
  token: string
  refreshToken: string
  activeSessions?: IActiveSession[]
}

export interface IUserTransactionRights {
  moduleId: number
  moduleCode: string
  moduleName: string
  transactionId: number
  transactionCode: string
  transactionName: string
  transCategoryId: number
  transCategoryCode: string
  transCategoryName: string
  seqNo: number
  transCatSeqNo: number
  isRead: boolean
  isCreate: boolean
  isEdit: boolean
  isDelete: boolean
  isExport: boolean
  isPrint: boolean
  isPost: boolean
  isDebitNote: boolean
  isVisible: boolean
}
