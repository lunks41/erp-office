export interface ITaskService {
  companyId: number
  taskId: number
  chargeId?: number | null
  craneChargeId?: number | null
  forkliftChargeId?: number | null
  stevedoreChargeId?: number | null
  uomId?: number | null
  carrierId?: number | null
  serviceModeId?: number | null
  consignmentTypeId?: number | null
  landingTypeId?: number | null
  visaId?: number | null
  taskStatusId?: number | null
  createById: number
  createDate: string
  editById?: number | null
  editDate?: string | null
}
