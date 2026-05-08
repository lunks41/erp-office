export interface IServiceType {
  companyId: number
  serviceTypeId: number
  serviceTypeCode: string
  serviceTypeName: string
  serviceTypeCategoryId: number
  serviceTypeCategoryCode: string
  serviceTypeCategoryName: string
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
  isActive: boolean
  remarks: string
}

export interface IServiceTypeFilter {
  isActive?: boolean
  search?: string
  sortService?: "asc" | "desc"
  sortOrder?: string
}

export interface IServiceTypeCategory {
  serviceTypeCategoryId: number
  serviceTypeCategoryCode: string
  serviceTypeCategoryName: string
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
  isActive: boolean
  remarks: string
}

export interface IServiceTypeCategoryFilter {
  search?: string
  sortService?: "asc" | "desc"
  sortOrder?: string
}
