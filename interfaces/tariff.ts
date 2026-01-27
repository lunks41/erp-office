export interface ITariffFilter {
  search?: string
  task?: string
  port?: string
  customer?: string
}

export interface ITariffHd {
  companyId: number
  tariffId: number
  customerId: number
  currencyId: number
  exhRate?: number // UI only - not saved to DB, fetched based on current date
  portId: number
  taskId: number
  chargeId: number
  uomId: number
  visaId?: number | null
  fromLocationId?: number | null
  toLocationId?: number | null
  isPrepayment: boolean
  prepaymentPercentage: number
  itemNo?: number | null
  remarks?: string | null
  isActive: boolean
  createBy: string
  createDate: Date | string
  editBy?: string | null
  editDate?: Date | string | null
  editVersion: number
  data_details?: ITariffDt[]
}

export interface ITariffDt {
  tariffId: number
  itemNo: number
  displayRate: number
  basicRate: number
  minUnit: number
  maxUnit: number
  isAdditional: boolean
  additionalUnit: number
  additionalRate: number
  editVersion: number
}

export interface ITariff {
  tariffId: number
  taskId?: number
  taskCode?: string
  taskName?: string
  chargeId?: number
  chargeCode?: string
  chargeName?: string
  portId?: number
  portCode?: string
  portName?: string
  customerId?: number
  customerCode?: string
  customerName?: string
  currencyId: number
  currencyCode?: string
  currencyName?: string
  uomId?: number
  uomCode?: string
  uomName?: string
  visaId?: number
  visaCode?: string
  visaName?: string
  fromLocationId?: number
  fromLocationCode?: string
  fromLocationName?: string
  toLocationId?: number
  toLocationCode?: string
  toLocationName?: string
  displayRate?: number
  basicRate?: number
  minUnit?: number
  maxUnit?: number
  isAdditional: boolean
  additionalUnit?: number
  additionalRate?: number
  prepaymentPercentage?: number
  isPrepayment: boolean
  seqNo?: number
  isDefault: boolean
  remarks?: string
  isActive?: boolean
  createBy?: string
  createDate?: Date | string
  editBy?: string
  editDate?: Date | string
  editVersion?: number
}

export interface ITariffCount {
  taskId: number
  taskCode: string
  taskName: string
  count: number
}

export interface IPortTariff {
  portId: number
  portCode: string
  portName: string
  tariffCount: number
}

export interface ITaskTariff {
  taskId: number
  taskCode: string
  taskName: string
  tariffCount: number
}

export interface CopyRate {
  fromCompanyId: number
  toCompanyId: number
  fromTaskId: number
  fromPortId: number
  toPortId: number
  fromCustomerId: number
  toCustomerId: number
  multipleId: string
  isOverwrite: boolean
  isDelete: boolean
}

/**
 * TypeScript interface matching C# class TariffRPT
 * Used for tariff report/download functionality
 */
export interface ITariffRPTRequest {
  companyId: number
  customerId: number
  portId: number
  isAllPorts: boolean
}
export interface ITariffRPT {
  companyName: string
  customerName: string
  currencyCode: string
  portName: string
  taskName: string
  chargeName: string
  uomName: string
  visaName: string
  displayRate: number // decimal in C#
  basicRate: number // decimal in C#
  minUnit: number
  maxUnit: number
  isAdditional: boolean
  additionalRate: number // decimal in C#
  additionalUnit: number
  isPrepayment: boolean
  prepaymentPercentage: number // decimal in C#
  seqNo: string
  remarks: string
  isDefault: boolean
  isActive: boolean
  createBy: string
  createDate: string | null // DateTime? in C#
  editBy: string
  editDate: string | null // DateTime? in C#
  editVersion: number
}
