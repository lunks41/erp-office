export interface IVesselType {
  vesselTypeId: number
  companyId: number
  vesselTypeCode: string
  vesselTypeName: string
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
  isActive: boolean
  remarks: string
}

export interface IVesselTypeFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

