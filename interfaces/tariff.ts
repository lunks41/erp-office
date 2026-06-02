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
  isViceVersa: boolean
  prepaymentPercentage: number
  seqNo?: number
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
  lineDescription?: string
  isCustomDescription: boolean
  displayRate: number
  basicRate: number
  minUnit: number
  maxUnit: number
  isMultiply: boolean
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
  isMultiply?: boolean
  isAdditional: boolean
  additionalUnit?: number
  additionalRate?: number
  prepaymentPercentage?: number
  isPrepayment: boolean
  isViceVersa?: boolean
  seqNo?: number
  isDefault: boolean
  remarks?: string
  isActive?: boolean
  createBy?: string
  createDate?: Date | string
  editBy?: string
  editDate?: Date | string
  editVersion?: number
  isCustomDescription?: boolean
  lineDescription?: string
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
  /** When true, clear all To tariffs in scope before copy. Overwrite uses SP update/insert without clearing first. */
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
  taskName: string
  portName: string
  chargeName: string
  visaName: string
  uomName: string
  fromTransportLocationName: string
  toTransportLocationName: string
  isPrepayment: boolean
  isViceVersa: boolean
  prepaymentPercentage: number
  displayRate: number
  basicRate: number
  minUnit: number
  maxUnit: number
  additionalUnit: number
  additionalRate: number
  isCustomDescription: boolean
  lineDescription: string
  isMultiply: boolean
}
