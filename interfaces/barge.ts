export interface IBarge {
  companyId: number
  bargeId: number
  bargeCode: string
  bargeName: string
  shortCode: string
  callSign: string
  imoCode: string
  grt: string
  licenseNo: string
  bargeType: string
  flag: string
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
  isActive: boolean
  isOwn: boolean
  remarks: string
}

export interface IBargeFilter {
  isActive?: boolean
  region?: string
  search?: string
  sortOrder?: "asc" | "desc"
}
