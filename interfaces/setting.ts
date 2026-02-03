export interface IDecFormat {
  amtDec: number
  locAmtDec: number
  ctyAmtDec: number
  priceDec: number
  qtyDec: number
  exhRateDec: number
  dateFormat: string
  longDateFormat: string
}

export interface IUserSetting {
  trn_Grd_TotRec: number
  m_Grd_TotRec: number
  ar_IN_GLId: number
  ar_CN_GLId: number
  ar_DN_GLId: number
  ap_IN_GLId: number
  ap_CN_GLId: number
  ap_DN_GLId: number
  ar_CurrencyId: number
  ap_CurrencyId: number
  cb_CurrencyId: number
  gl_CurrencyId: number
  gstId: number
  uomId: number
}

export interface IDefaultSetting {
  trn_Grd_TotRec: number
  m_Grd_TotRec: number
  ar_IN_GLId: number
  ar_CN_GLId: number
  ar_DN_GLId: number
  ap_IN_GLId: number
  ap_CN_GLId: number
  ap_DN_GLId: number
  ar_CurrencyId: number
  ap_CurrencyId: number
  cb_CurrencyId: number
  gl_CurrencyId: number
  gstId: number
  uomId: number
}

export interface IDynmaicLookup {
  isBarge: boolean
  isVessel: boolean
  isVoyage: boolean
  isCustomer: boolean
  isSupplier: boolean
  isProduct: boolean
  isJobOrder: boolean
  bargeCount: number
  vesselCount: number
  voyageCount: number
  customerCount: number
  supplierCount: number
  productCount: number
  jobOrderCount: number
}

export interface IFinance {
  base_CurrencyId: number
  local_CurrencyId: number
  exhGain_GlId: number
  exhLoss_GlId: number
  bankCharge_GlId: number
  profitLoss_GlId: number
  retEarning_GlId: number
  saleGst_GlId: number
  purGst_GlId: number
  saleDef_GlId: number
  purDef_GlId: number
}

export interface IGridSetting {
  moduleId: number
  transactionId: number
  grdName: string
  grdKey: string
  grdColVisible: string
  grdColOrder: string
  grdColSize: string
  grdSort: string
  grdString: string
}

export interface ICloneUserGridSetting {
  fromUserId: number
  toUserId: number
}

export interface IMandatoryFields {
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  m_ProductId: boolean
  m_GLId: boolean
  m_QTY: boolean
  m_UomId: boolean
  m_UnitPrice: boolean
  m_TotAmt: boolean
  m_Remarks: boolean
  m_GstId: boolean
  m_DeliveryDate: boolean
  m_DepartmentId: boolean
  m_JobOrderId: boolean
  m_EmployeeId: boolean
  m_PortId: boolean
  m_VesselId: boolean
  m_BargeId: boolean
  m_VoyageId: boolean
  m_SupplyDate: boolean
  m_ReferenceNo: boolean
  m_SuppInvoiceNo: boolean
  m_BankId: boolean
  m_PaymentTypeId: boolean
  m_Remarks_Hd: boolean
  m_Address1: boolean
  m_Address2: boolean
  m_Address3: boolean
  m_Address4: boolean
  m_PinCode: boolean
  m_CountryId: boolean
  m_PhoneNo: boolean
  m_ContactName: boolean
  m_MobileNo: boolean
  m_EmailAdd: boolean
}

export interface IVisibleFields {
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
  m_ProductId: boolean
  m_QTY: boolean
  m_BillQTY: boolean
  m_UomId: boolean
  m_UnitPrice: boolean
  m_Remarks: boolean
  m_GstId: boolean
  m_GstClaimDate: boolean
  m_TrnDate: boolean

  m_DeliveryDate: boolean
  m_DepartmentId: boolean
  m_JobOrderId: boolean
  m_EmployeeId: boolean
  m_PortId: boolean
  m_VesselId: boolean
  m_BargeId: boolean
  m_VoyageId: boolean
  m_SupplyDate: boolean
  m_BankId: boolean
  m_CtyCurr: boolean
  m_PayeeTo: boolean
  m_ServiceCategoryId: boolean
  m_OtherRemarks: boolean
  m_JobOrderIdHd: boolean
  m_PortIdHd: boolean
  m_VesselIdHd: boolean
  m_AdvRecAmt: boolean
  m_BankChgGLId: boolean
  m_InvoiceDate: boolean
  m_InvoiceNo: boolean
  m_SupplierName: boolean
  m_GstNo: boolean
  m_DebitNoteNo: boolean
  m_BargeIdHd: boolean
}

export interface INumberFormatDetails {
  numberId: number
  companyId: number
  moduleId: number
  transactionId: number
  prefix: string
  prefixSeq: number
  prefixDelimiter: string
  includeYear: boolean
  yearSeq: number
  yearFormat: string
  yearDelimiter: string
  includeMonth: boolean
  monthSeq: number
  monthFormat: string
  monthDelimiter: string
  noDigits: number
  digitSeq: number
  resetYearly: boolean
  createById: number
  editById: number
  createDate: string
  editDate: string
  createBy: string
  editBy: string
}

export interface INumberFormatGrid {
  numberId: number
  numYear: number
  month1: number
  month2: number
  month3: number
  month4: number
  month5: number
  month6: number
  month7: number
  month8: number
  month9: number
  month10: number
  month11: number
  month12: number
  lastNumber: number
}
