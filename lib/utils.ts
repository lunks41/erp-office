import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse number string with commas to number
 * @param value - String value that may contain commas
 * @returns Parsed number or 0 if invalid
 */
export function parseNumberWithCommas(value: string): number {
  // Remove commas and parse as float
  const cleanValue = value.replace(/,/g, "")
  return parseFloat(cleanValue) || 0
}

/**
 * Converts day of week number (1-7) to day name
 * @param dayNumber - Day number (1 = Sunday, 2 = Monday, ..., 7 = Saturday)
 * @returns Day name or original value if invalid
 */
export function getDayName(dayNumber: string | number | undefined): string {
  if (!dayNumber) return "Sunday"

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]

  const num =
    typeof dayNumber === "string" ? parseInt(dayNumber, 10) : dayNumber

  return num >= 1 && num <= 7 ? dayNames[num - 1] : "Sunday"
}

/**
 * Converts day of week number to short day name
 * @param dayNumber - Day number (1 = Sun, 2 = Mon, ..., 7 = Sat)
 * @returns Short day name or original value if invalid
 */
export function getShortDayName(
  dayNumber: string | number | undefined
): string {
  if (!dayNumber) return "Sun"

  const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const num =
    typeof dayNumber === "string" ? parseInt(dayNumber, 10) : dayNumber

  return num >= 1 && num <= 7 ? shortDayNames[num - 1] : "Sun"
}

/**
 * Gets the day number from a Date object (1-7, where 1 = Sunday)
 * @param date - Date object
 * @returns Day number (1-7)
 */
export function getDayNumber(date: Date): number {
  return date.getDay() + 1 // getDay() returns 0-6, we want 1-7
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}

export enum ModuleId {
  master = 1,
  sales = 2,
  purchase = 3,
  operations = 4,
  hr = 5,
  dashboard = 6,
  approvals = 7,
  document = 8,
  request = 9,
  inquiry = 10,
  logistics = 11,

  ar = 25,
  ap = 26,
  cb = 27,
  gl = 28,
  setting = 99,
  admin = 100,
}

export enum MasterTransactionId {
  accountGroup = 1,
  accountSetup = 2,
  accountSetupCategory = 3,
  accountSetupDt = 4,
  accountType = 5,
  bank = 6,
  barge = 7,
  category = 8,
  charge = 9,
  chartOfAccount = 10,
  coaCategory1 = 11,
  coaCategory2 = 12,
  coaCategory3 = 13,
  country = 14,
  creditTerm = 15,
  creditTermDt = 16,
  currency = 17,
  currencyDt = 18,
  currencyLocalDt = 19,
  customer = 20,
  customerCreditLimit = 21,
  department = 22,
  designation = 23,
  documentType = 24,
  employee = 25,
  employeeCategory = 26,
  entityType = 27,
  groupCreditLimit = 28,
  gst = 29,
  gstCategory = 30,
  gstDt = 31,
  leaveType = 32,
  loanType = 33,
  orderType = 34,
  orderTypeCategory = 35,
  paymentType = 36,
  port = 37,
  portRegion = 38,
  product = 39,
  serviceType = 40,
  serviceTypeCategory = 41,
  subCategory = 42,
  supplier = 43,
  task = 44,
  tax = 45,
  taxCategory = 46,
  taxDt = 47,
  uom = 48,
  uomDt = 49,
  vessel = 50,
  voyage = 51,
  workLocation = 52,
  chargeGLMapping = 53,
  visa = 54,
  rank = 55,
  serviceMode = 56,
  carrier = 57,
  landingType = 58,
  landingPurpose = 59,
  taskStatus = 60,
  passType = 61,
  consignmentType = 62,
  jobStatus = 63,
  vatServiceCategory = 64,
  bargeGLMapping = 65,
  transportLocation = 66,
  transportMode = 67,
  geoLocation = 69,
  supplyType = 68,
  cargoType = 70,
}

export enum AdminTransactionId {
  user = 1,
  userRights = 2,
  userGroup = 3,
  userGroupRights = 4,
  userRoles = 5,
  userProfile = 6,
  shareData = 7,
  company = 8,
  document = 9,
  notDefine = 100,
}

export enum SettingTransactionId {
  gridSetting = 1,
  documentNo = 2,
  decSetting = 3,
  finSetting = 4,
  mandatoryFields = 5,
  visibleFields = 6,
  dynamicLookup = 7,
  docSeqNo = 8,
  userSetting = 9,
  operationSetting = 10,
}

export enum InquiryTransactionId {
  checklist = 1,
  aptransaction = 2,
  aptransactiondetails = 3,
  gltransaction = 4,
}

export enum OperationsTransactionId {
  checklist = 1,
  tariff = 2,
  template = 3,
  portExpenses = 4,
  launchService = 5,
  equipmentUsed = 6,
  crewSignOn = 7,
  crewSignOff = 8,
  crewMiscellaneous = 9,
  medicalAssistance = 10,
  consignmentImport = 11,
  consignmentExport = 12,
  thirdParty = 13,
  freshWater = 14,
  technicianSurveyor = 15,
  landingItems = 16,
  otherService = 17,
  agencyRemuneration = 18,
  transportationLog = 19,
  reports = 20,
}

export enum ARTransactionId {
  invoice = 1,
  debitNote = 2,
  creditNote = 3,
  adjustment = 4,
  receipt = 5,
  refund = 6,
  docsetoff = 7,
  invoice_edit = 8,
  invoicectm = 9,
  reports = 99,
  overview = 100,
}

export enum APTransactionId {
  invoice = 1,
  debitNote = 2,
  creditNote = 3,
  adjustment = 4,
  payment = 5,
  refund = 6,
  docsetoff = 7,
  reports = 99,
  overview = 100,
}

export enum CBTransactionId {
  cbgenreceipt = 1,
  cbgenpayment = 2,
  cbpettycash = 3,
  cbbanktransfer = 4,
  cbbankrecon = 5,
  cbbanktransferctm = 6,
  reports = 99,
  overview = 100,
}

export enum GLTransactionId {
  journalentry = 1,
  arapcontra = 2,
  fixedasset = 3,
  openingbalance = 4,
  yearendprocess = 5,
  periodclose = 6,
  reports = 99,
  overview = 100,
}

export enum LogisticsTransactionId {
  freight = 1,
  transportation = 2,
}

export enum HRTransactionId {
  employees = 1,
  loan = 2,
  leave = 3,
  attendance = 4,
  payruns = 5,
  setting = 6,
}

export enum DashboardTransactionId {
  dashboard1 = 1,
  dashboard2 = 2,
  dashboard3 = 3,
  dashboard4 = 4,
  dashboard5 = 5,
  dashboard6 = 6,
  dashboard7 = 7,
  dashboard8 = 8,
  dashboard9 = 9,
  dashboard10 = 10,
}

export enum RequestTransactionId {
  loan = 1,
  leave = 2,
  pettyCash = 3,
}

export enum DocumentTransactionId {
  document = 1,
}

export enum ApprovalsTransactionId {
  approvals = 1,
}

export function getModuleAndTransactionId(pathname: string): {
  moduleId: number
  transactionId: number
} {
  // Extract the module name and transaction name from the URL path
  // Expected path structure: /[companyId]/module/transaction
  const pathParts = pathname.split("/")

  // Skip the first empty part and companyId, then get module and transaction
  const moduleName = pathParts[2]?.toLowerCase() // e.g., 'admin', 'master', etc.
  const transactionName = pathParts[3]?.toLowerCase() // e.g., 'user', 'account-type', etc.

  // Map module name to module ID
  const moduleId = ModuleId[moduleName as keyof typeof ModuleId] || 0

  // Map transaction name to transaction ID based on module
  let transactionId = 0

  switch (moduleId) {
    case ModuleId.master:
      transactionId =
        MasterTransactionId[
          transactionName as keyof typeof MasterTransactionId
        ] || 0
      break
    case ModuleId.operations:
      transactionId =
        OperationsTransactionId[
          transactionName as keyof typeof OperationsTransactionId
        ] || 0
      break
    case ModuleId.inquiry:
      transactionId =
        InquiryTransactionId[
          transactionName as keyof typeof InquiryTransactionId
        ] || 0
      break
    case ModuleId.logistics:
      transactionId =
        LogisticsTransactionId[transactionName as keyof typeof LogisticsTransactionId] || 0
      break
    case ModuleId.ar:
      transactionId =
        ARTransactionId[transactionName as keyof typeof ARTransactionId] || 0
      break
    case ModuleId.ap:
      transactionId =
        APTransactionId[transactionName as keyof typeof APTransactionId] || 0
      break
    case ModuleId.cb:
      transactionId =
        CBTransactionId[transactionName as keyof typeof CBTransactionId] || 0
      break
    case ModuleId.gl:
      transactionId =
        GLTransactionId[transactionName as keyof typeof GLTransactionId] || 0
      break
    case ModuleId.admin:
      transactionId =
        AdminTransactionId[
          transactionName as keyof typeof AdminTransactionId
        ] || 0
      break
    case ModuleId.setting:
      transactionId =
        SettingTransactionId[
          transactionName as keyof typeof SettingTransactionId
        ] || 0
      break
  }

  return { moduleId, transactionId }
}

export enum TableName {
  //admin
  auditlog = "AdmAuditLog",
  errorlog = "AdmErrorLog",
  userlog = "AdmUserLog",
  user = "AdmUser",
  userRole = "AdmUserRole",
  userGroup = "AdmUserGroup",
  userGroupRights = "AdmUserGroupRights",
  userRights = "AdmUserRights",
  userProfile = "AdmUserProfile",
  shareData = "AdmShareData",
  company = "AdmCompany",
  document = "AdmDocument",
  notDefine = "AdmNotDefine",

  //mater
  accountGroup = "M_AccountGroup",
  accountSetup = "M_AccountSetup",
  accountSetupCategory = "M_AccountSetupCategory",
  accountSetupDt = "M_AccountSetupDt",
  accountType = "M_AccountType",
  bank = "M_Bank",
  bankAddress = "M_BankAddress",
  bankContact = "M_BankContact",
  barge = "M_Barge",
  bargeGLMapping = "M_BargeGLMapping",
  category = "M_Category",
  charge = "M_Charge",
  chargeGLMapping = "M_ChargeGLMapping",
  chartOfAccount = "M_ChartOfAccount",
  coaCategory1 = "M_COACategory1",
  coaCategory2 = "M_COACategory2",
  coaCategory3 = "M_COACategory3",
  country = "M_Country",
  creditTerm = "M_CreditTerm",
  creditTermDt = "M_CreditTermDt",
  currency = "M_Currency",
  currencyDt = "M_CurrencyDt",
  currencyLocalDt = "M_CurrencyLocalDt",
  customer = "M_Customer",
  customerAddress = "M_CustomerAddress",
  customerContact = "M_CustomerContact",
  customerCreditLimit = "M_CustomerCreditLimit",
  department = "M_Department",
  designation = "M_Designation",
  documentType = "M_DocumentType",
  employee = "M_Employee",
  employeeCategory = "M_EmployeeCategory",
  entityTypes = "M_EntityTypes",
  groupCreditLimit = "M_GroupCreditLimit",
  groupCreditLimitCustomer = "M_GroupCreditLimit_Customer",
  groupCreditLimitDt = "M_GroupCreditLimitDt",
  gst = "M_Gst",
  gstCategory = "M_GstCategory",
  gstDt = "M_GstDt",
  leaveType = "M_LeaveType",
  loanType = "M_LoanType",
  orderType = "M_OrderType",
  orderTypeCategory = "M_OrderTypeCategory",
  paymentType = "M_PaymentType",
  port = "M_Port",
  portRegion = "M_PortRegion",
  product = "M_Product",
  serviceType = "M_ServiceType",
  serviceTypeCategory = "M_ServiceTypeCategory",
  shift = "M_Shift",
  status = "M_Status",
  subCategory = "M_SubCategory",
  supplier = "M_Supplier",
  supplierAddress = "M_SupplierAddress",
  supplierBank = "M_SupplierBank",
  supplierContact = "M_SupplierContact",
  task = "M_Task",
  tax = "M_Tax",
  taxCategory = "M_TaxCategory",
  taxDt = "M_TaxDt",
  uom = "M_Uom",
  uomDt = "M_UomDt",
  vessel = "M_Vessel",
  visa = "M_Visa",
  geoLocation = "M_GeoLocation",
  supplyType = "M_SupplyType",
  cargoType = "M_CargoType",
  rank = "M_Rank",
  voyage = "M_Voyage",
  workLocation = "M_WorkLocation",
  serviceMode = "M_ServiceMode",
  carrier = "M_Carrier",
  landingType = "M_LandingType",
  landingPurpose = "M_LandingPurpose",
  taskStatus = "M_TaskStatus",
  passType = "M_PassType",
  consignmentType = "M_ConsignmentType",
  jobStatus = "M_JobStatus",
  vatServiceCategory = "M_VATServiceCategory",
  transportLocation = "M_TransportLocation",
  transportMode = "M_TransportMode",

  // operations
  checklist = "checklist",
  portExpense = "portExpense",
  launchService = "launchService",
  equipmentUsed = "equipmentUsed",
  agencyRemuneration = "agencyRemuneration",
  consignmentExport = "consignmentExport",
  consignmentImport = "consignmentImport",
  crewMiscellaneous = "crewMiscellaneous",
  crewSignOff = "crewSignOff",
  crewSignOn = "crewSignOn",
  freshWater = "freshWater",
  landingItems = "landingItems",
  medicalAssistance = "medicalAssistance",
  otherService = "otherService",
  thirdParty = "thirdParty",
  techniciansSurveyors = "techniciansSurveyors",
  debitNote = "debitNote",
  tariff = "tariff",

  //AR
  arInvoice = "arInvoice",
  arInvoiceDt = "arInvoiceDt",
  arInvoiceCtm = "arInvoiceCtm",
  arInvoiceCtmDt = "arInvoiceCtmDt",
  arInvoiceHistory = "arInvoiceHistory",
  arDebitNote = "arDebitNote",
  arDebitNoteDt = "arDebitNoteDt",
  arDebitNoteHistory = "arDebitNoteHistory",
  arCreditNote = "arCreditNote",
  arCreditNoteDt = "arCreditNoteDt",
  arCreditNoteHistory = "arCreditNoteHistory",
  arAdjustment = "arAdjustment",
  arAdjustmentDt = "arAdjustmentDt",
  arAdjustmentHistory = "arAdjustmentHistory",
  arReceipt = "arReceipt",
  arReceiptDt = "arReceiptDt",
  arReceiptHistory = "arReceiptHistory",
  arRefund = "arRefund",
  arRefundDt = "arRefundDt",
  arRefundHistory = "arRefundHistory",
  arDocSetOff = "arDocSetOff",
  arDocSetOffDt = "arDocSetOffDt",
  arDocSetOffHistory = "arDocSetOffHistory",
  arOutTransaction = "arOutTransaction",
  //AP
  apInvoice = "apInvoice",
  apInvoiceDt = "apInvoiceDt",
  apInvoiceHistory = "apInvoiceHistory",
  apDebitNote = "apDebitNote",
  apDebitNoteDt = "apDebitNoteDt",
  apDebitNoteHistory = "apDebitNoteHistory",
  apCreditNote = "apCreditNote",
  apCreditNoteDt = "apCreditNoteDt",
  apCreditNoteHistory = "apCreditNoteHistory",
  apAdjustment = "apAdjustment",
  apAdjustmentDt = "apAdjustmentDt",
  apAdjustmentHistory = "apAdjustmentHistory",
  apPayment = "apPayment",
  apPaymentDt = "apPaymentDt",
  apPaymentHistory = "apPaymentHistory",
  apRefund = "apRefund",
  apRefundDt = "apRefundDt",
  apRefundHistory = "apRefundHistory",
  apDocSetOff = "apDocSetOff",
  apDocSetOffDt = "apDocSetOffDt",
  apDocSetOffHistory = "apDocSetOffHistory",
  apOutTransaction = "apOutTransaction",
  //CB
  cbGenReceipt = "cbGenReceipt",
  cbGenReceiptDt = "cbGenReceiptDt",
  cbGenReceiptHistory = "cbGenReceiptHistory",
  cbGenPayment = "cbGenPayment",
  cbGenPaymentDt = "cbGenPaymentDt",
  cbGenPaymentHistory = "cbGenPaymentHistory",
  cbPettyCash = "cbPettyCash",
  cbPettyCashDt = "cbPettyCashDt",
  cbPettyCashHistory = "cbPettyCashHistory",
  cbBankTransfer = "cbBankTransfer",
  cbBankTransferDt = "cbBankTransferDt",
  cbBankTransferHistory = "cbBankTransferHistory",
  cbBankRecon = "cbBankRecon",
  cbBankReconDt = "cbBankReconDt",
  cbBankReconHistory = "cbBankReconHistory",
  cbBatchPayment = "cbBatchPayment",
  cbBatchPaymentDt = "cbBatchPaymentDt",
  cbBatchPaymentHistory = "cbBatchPaymentHistory",
  cbBankTransferCtm = "cbBankTransferCtm",
  cbBankTransferCtmDt = "cbBankTransferCtmDt",
  cbBankTransferCtmHistory = "cbBankTransferCtmHistory",
  //GL
  glJournal = "glJournal",
  glJournalDt = "glJournalDt",
  glJournalHistory = "glJournalHistory",
  glJournalDetails = "glJournalDetails",
  journalEntryHistory = "journalEntryHistory",
  journalEntryDetails = "journalEntryDetails",
  glContra = "glContra",
  glContraDt = "glContraDt",
  glContraHistory = "glContraHistory",
  glContraDetails = "glContraDetails",
  fixedAsset = "fixedAsset",
  openingBalance = "openingBalance",
  yearEndProcess = "yearEndProcess",
  periodClose = "periodClose",
  template = "template",

  //Common
  glPostDetails = "glPostDetails",
  paymentDetails = "paymentDetails",
  otherDocument = "otherDocument",
}
