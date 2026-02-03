import * as z from "zod"

export const decimalFormSchema = z
  .object({
    amtDec: z.number().min(2, "Amount Decimals is required at least 2 digits"),
    locAmtDec: z
      .number()
      .min(2, "Local Amount Decimals is required at least 2 digits"),
    ctyAmtDec: z
      .number()
      .min(2, "Currency Amount Decimals is required at least 2 digits"),
    priceDec: z.number().min(2, "Price Decimals is required at least 2 digits"),
    qtyDec: z
      .number()
      .min(2, "Quantity Decimals is required at least 2 digits"),
    exhRateDec: z
      .number()
      .min(3, "Exchange Rate Decimals is required at least 3 digits"),
    dateFormat: z.string(),
    longDateFormat: z.string(),
  })
  .partial()

export type DecimalSchemaType = z.infer<typeof decimalFormSchema>

export const userSettingSchema = z
  .object({
    trn_Grd_TotRec: z.number().min(0),
    m_Grd_TotRec: z.number().min(0),
    ar_IN_GLId: z.number().min(0),
    ar_CN_GLId: z.number().min(0),
    ar_DN_GLId: z.number().min(0),
    ap_IN_GLId: z.number().min(0),
    ap_CN_GLId: z.number().min(0),
    ap_DN_GLId: z.number().min(0),
    ar_CurrencyId: z.number().min(0),
    ap_CurrencyId: z.number().min(0),
    cb_CurrencyId: z.number().min(0),
    gl_CurrencyId: z.number().min(0),
    gstId: z.number().min(0),
    uomId: z.number().min(0),
  })
  .partial()

export type UserSettingSchemaType = z.infer<typeof userSettingSchema>

export const defaultSettingSchema = z
  .object({
    trn_Grd_TotRec: z.number().min(0),
    m_Grd_TotRec: z.number().min(0),
    ar_IN_GLId: z.number().min(0),
    ar_CN_GLId: z.number().min(0),
    ar_DN_GLId: z.number().min(0),
    ap_IN_GLId: z.number().min(0),
    ap_CN_GLId: z.number().min(0),
    ap_DN_GLId: z.number().min(0),
    ar_CurrencyId: z.number().min(0),
    ap_CurrencyId: z.number().min(0),
    cb_CurrencyId: z.number().min(0),
    gl_CurrencyId: z.number().min(0),
    gstId: z.number().min(0),
    uomId: z.number().min(0),
  })
  .partial()

export type DefaultSettingSchemaType = z.infer<typeof defaultSettingSchema>

export const dynamicLookupFormSchema = z.object({
  isBarge: z.boolean(),
  isVessel: z.boolean(),
  isVoyage: z.boolean(),
  isCustomer: z.boolean(),
  isSupplier: z.boolean(),
  isProduct: z.boolean(),
  isJobOrder: z.boolean(),
  bargeCount: z.number().min(0),
  vesselCount: z.number().min(0),
  voyageCount: z.number().min(0),
  customerCount: z.number().min(0),
  supplierCount: z.number().min(0),
  productCount: z.number().min(0),
  jobOrderCount: z.number().min(0),
})

export type DynamicLookupSchemaType = z.infer<typeof dynamicLookupFormSchema>

export const mandatoryFieldsSchema = z
  .object({
    moduleId: z.number().min(0),
    moduleName: z.string(),
    transactionId: z.number().min(0),
    transactionName: z.string(),
    m_ProductId: z.boolean(),
    m_GLId: z.boolean(),
    m_QTY: z.boolean(),
    m_UomId: z.boolean(),
    m_UnitPrice: z.boolean(),
    m_TotAmt: z.boolean(),
    m_Remarks: z.boolean(),
    m_GstId: z.boolean(),
    m_DeliveryDate: z.boolean(),

    m_DepartmentId: z.boolean(),
    m_EmployeeId: z.boolean(),
    m_PortId: z.boolean(),
    m_VesselId: z.boolean(),
    m_BargeId: z.boolean(),
    m_VoyageId: z.boolean(),
    m_SupplyDate: z.boolean(),
    m_ReferenceNo: z.boolean(),
    m_SuppInvoiceNo: z.boolean(),
    m_BankId: z.boolean(),
    m_Remarks_Hd: z.boolean(),
    m_Address1: z.boolean(),
    m_Address2: z.boolean(),
    m_Address3: z.boolean(),
    m_Address4: z.boolean(),
    m_PinCode: z.boolean(),
    m_CountryId: z.boolean(),
    m_PhoneNo: z.boolean(),
    m_ContactName: z.boolean(),
    m_MobileNo: z.boolean(),
    m_EmailAdd: z.boolean(),
  })
  .partial()

export type MandatoryFieldsSchemaType = z.infer<typeof mandatoryFieldsSchema>

export const visibleFieldsSchema = z
  .object({
    moduleId: z.number().min(0),
    transactionId: z.number().min(0),
    m_ProductId: z.boolean(),
    m_QTY: z.boolean(),
    m_BillQTY: z.boolean(),
    m_UomId: z.boolean(),
    m_UnitPrice: z.boolean(),
    m_Remarks: z.boolean(),
    m_GstId: z.boolean(),
    m_DeliveryDate: z.boolean(),
    m_DepartmentId: z.boolean(),
    m_EmployeeId: z.boolean(),
    m_PortId: z.boolean(),
    m_VesselId: z.boolean(),
    m_BargeId: z.boolean(),
    m_VoyageId: z.boolean(),
    m_SupplyDate: z.boolean(),
    m_BankId: z.boolean(),
    m_CtyCurr: z.boolean(),
    m_PayeeTo: z.boolean(),
    m_GstClaimDate: z.boolean(),
    m_TrnDate: z.boolean(),
    m_JobOrderId: z.boolean(),
    m_PortIdHd: z.boolean(),
    m_VesselIdHd: z.boolean(),
    m_BargeIdHd: z.boolean(),
    m_VoyageIdHd: z.boolean(),
    m_SupplyDateHd: z.boolean(),
    m_BankIdHd: z.boolean(),
    m_CtyCurrHd: z.boolean(),
    m_PayeeToHd: z.boolean(),
    m_BankChgGLId: z.boolean(),
    m_DebitNoteNo: z.boolean(),
  })
  .partial()

export type visibleFieldsSchemaType = z.infer<typeof visibleFieldsSchema>

export const financeSettingSchema = z
  .object({
    base_CurrencyId: z.number().min(0, "Base Currency is required"),
    local_CurrencyId: z.number().min(0, "Local Currency is required"),
    exhGain_GlId: z.number().min(0, "Exchange Gain Account is required"),
    exhLoss_GlId: z.number().min(0, "Exchange Loss Account is required"),
    bankCharge_GlId: z.number().min(0, "Bank Charges Account is required"),
    profitLoss_GlId: z.number().min(0, "Profit & Loss Account is required"),
    retEarning_GlId: z.number().min(0, "Retained Earnings Account is required"),
    saleGst_GlId: z.number().min(0, "Sales GST Account is required"),
    purGst_GlId: z.number().min(0, "Purchase GST Account is required"),
    saleDef_GlId: z.number().min(0, "Sales Deferred Account is required"),
    purDef_GlId: z.number().min(0, "Purchase Deferred Account is required"),
  })
  .partial()

export type FinanceSettingSchemaType = z.infer<typeof financeSettingSchema>

export const gridSettingSchema = z
  .object({
    userId: z.number(),
    moduleId: z.number(),
    transactionId: z.number(),
    grdName: z.string(),
    grdKey: z.string(),
    grdColVisible: z.string(),
    grdColOrder: z.string(),
    grdColSize: z.string(),
    grdSort: z.string(),
    grdString: z.string(),
  })
  .partial()

export type GridSettingSchemaType = z.infer<typeof gridSettingSchema>

export const cloneUserGridSettingSchem = z
  .object({
    fromUserId: z.number(),
    toUserId: z.number(),
  })
  .partial()

export type CloneUserGridSettingSchemaType = z.infer<
  typeof cloneUserGridSettingSchem
>

export const documentNoFormSchema = z
  .object({
    numberId: z.number(),
    moduleId: z.number(),
    transactionId: z.number(),
    prefix: z.string(),
    prefixDelimiter: z.string(),
    prefixSeq: z.number(),

    includeYear: z.boolean(),
    yearDelimiter: z.string(),
    yearSeq: z.number(),
    yearFormat: z.string(),

    includeMonth: z.boolean(),
    monthDelimiter: z.string(),
    monthSeq: z.number(),
    monthFormat: z.string(),

    noDigits: z.union([z.string(), z.number()]),
    digitSeq: z.number(),

    resetYearly: z.boolean(),
  })
  .partial()

export type DocumentNoSchemaType = z.infer<typeof documentNoFormSchema>

export const documentNoFormSchemav1 = z.object({
  prefix: z.string().min(1, "Prefix is required"),
  prefixSeq: z.number().min(1).max(4),
  prefixDelimiter: z.string().length(1, "Must be a single character"),
  yearSeq: z.number().min(1).max(4),
  yearFormat: z.string(),
  monthFormat: z.string(),
  monthSeq: z.number().min(1).max(4),
  digitSeq: z.number().min(1).max(4),
  noDigits: z.number().min(1),
  isMonthly: z.boolean(),
  isYearly: z.boolean(),
})

export type DocumentNoSchemaTypev1 = z.infer<typeof documentNoFormSchemav1>
