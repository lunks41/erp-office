export interface IUserLookup {
  userId: number
  userCode: string
  userName: string
}

export interface ICountryLookup {
  countryId: number
  countryCode: string
  countryName: string
}

export interface IVesselLookup {
  vesselId: number
  vesselName: string
  vesselCode: string
  imoCode: string
}

export interface IJobOrderLookup {
  jobOrderId: number
  jobOrderNo: string
  vesselId: number
  portId: number
}

export interface ITaskLookup {
  taskId: number
  taskName: string
  taskCode: string
}

export interface IChargeLookup {
  chargeId: number
  chargeName: string
  chargeCode: string
  glId: number
}

export interface IServiceLookup {
  serviceId: number
  serviceName: string
  serviceCode: string
}

export interface IServiceItemNoLookup {
  serviceItemNo: number
  serviceItemNoName: string
}

export interface IBargeLookup {
  bargeId: number
  bargeCode: string
  bargeName: string
}

export interface ICurrencyLookup {
  currencyId: number
  currencyCode: string
  currencyName: string
  isMultiply: boolean
}

export interface IChartOfAccountLookup {
  glId: number
  glCode: string
  glName: string
  isSysControl: boolean
  isJobSpecific: boolean
  isBankAccount: boolean
  isOperational: boolean
  isPayableAccount: boolean
  isReceivableAccount: boolean
  isUniversal: boolean
}

export interface ICategoryLookup {
  categoryId: number
  categoryCode: string
  categoryName: string
}

export interface IAccountSetupCategoryLookup {
  accSetupCategoryId: number
  accSetupCategoryCode: string
  accSetupCategoryName: string
}

export interface IGstLookup {
  gstId: number
  gstCode: string
  gstName: string
  gstPercentage: number
}

export interface IGstCategoryLookup {
  gstCategoryId: number
  gstCategoryCode: string
  gstCategoryName: string
}

export interface IAccountSetupLookup {
  accSetupId: number
  accSetupCode: string
  accSetupName: string
}

export interface ICOACategory1Lookup {
  coaCategoryId: number
  coaCategoryCode: string
  coaCategoryName: string
}

export interface ICOACategory2Lookup {
  coaCategoryId: number
  coaCategoryCode: string
  coaCategoryName: string
}

export interface ICOACategory3Lookup {
  coaCategoryId: number
  coaCategoryCode: string
  coaCategoryName: string
}

export interface IAccountTypeLookup {
  accTypeId: number
  accTypeCode: string
  accTypeName: string
}

export interface IAccountGroupLookup {
  accGroupId: number
  accGroupCode: string
  accGroupName: string
}

export interface IDepartmentLookup {
  departmentId: number
  departmentCode: string
  departmentName: string
}

export interface IWorkLocationLookup {
  workLocationId: number
  workLocationCode: string
  workLocationName: string
}

export interface ICustomerLookup {
  customerId: number
  customerCode: string
  customerName: string
  currencyId: number
  creditTermId: number
  bankId: number
}
export interface ICreditTermLookup {
  creditTermId: number
  creditTermCode: string
  creditTermName: string
}

export interface IBankLookup {
  bankId: number
  bankCode: string
  bankName: string
  currencyId: number
}

export interface IYearLookup {
  yearId: number
  yearCode: string
  yearName: string
}

export interface ITaxCategoryLookup {
  taxCategoryId: number
  taxCategoryCode: string
  taxCategoryName: string
}

export interface IProductLookup {
  productId: number
  productCode: string
  productName: string
}

export interface IEmployeeLookup {
  employeeId: number
  employeeCode: string
  employeeName: string
}

export interface IEmployerLookup {
  employerId: number
  employerCode: string
  employerName: string
}

export interface ILeaveTypeLookup {
  leaveTypeId: number
  leaveTypeName: string
  leaveTypeCode: string
  defaultDays: number
  maxDays: number
}

export interface ITaxLookup {
  taxId: number
  taxCode: string
  taxName: string
}
export interface IUomLookup {
  uomId: number
  uomCode: string
  uomName: string
}

export interface IPortLookup {
  portId: number
  portCode: string
  portName: string
  portShortName: string
}

export interface IPortRegionLookup {
  portRegionId: number
  portRegionCode: string
  portRegionName: string
}

export interface IDesignationLookup {
  designationId: number
  designationCode: string
  designationName: string
}

export interface IVoyageLookup {
  voyageId: number
  voyageNo: string
  referenceNo: string
}

export interface ITransactionLookup {
  transactionId: number
  transactionCode: string
  transactionName: string
}

export interface IModuleLookup {
  moduleId: number
  moduleCode: string
  moduleName: string
}

export interface ISupplierLookup {
  supplierId: number
  supplierCode: string
  supplierName: string
  currencyId: number
  creditTermId: number
  bankId: number
  supplierRegNo: string
}

export interface IPaymentTypeLookup {
  paymentTypeId: number
  paymentTypeCode: string
  paymentTypeName: string
}

export interface IDocumentNoModuleTransactions {
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
}

export interface IDynamicLookup {
  companyId: number
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
  createById: number
  createDate: string | Date
  editById: null | string | number
  editDate: null | string | Date
  createBy: null | string | number
  editBy: null | string | number
}

export interface IDocType {
  companyId: number
  transactionId: number
  transactionCode: string
  transactionName: string
  moduleId: number
  moduleCode: string
  moduleName: string
  documentId: string
  documentNo: string
  itemNo: number
  docTypeId: number
  docTypeCode: string
  docTypeName: string
  docPath: string
  remarks: string
  createById: number
  createDate: string | Date
  createBy: string
  editById: number
  editDate: string | Date
  editBy: string
}

export interface IDocument {
  transactionId: number
  moduleId: number
  documentId: string
  documentNo: string
  itemNo: string | number
  docTypeId: number
  docPath: string
  remarks: string
}

export interface IDocumentType {
  docTypeId: number
  docTypeCode: string
  docTypeName: string
}

export interface IUserGroupLookup {
  userGroupId: number
  userGroupCode: string
  userGroupName: string
}

export interface IUserRoleLookup {
  userRoleId: number
  userRoleCode: string
  userRoleName: string
}

export interface ISubCategoryLookup {
  subCategoryId: number
  subCategoryCode: string
  subCategoryName: string
}

export interface IOrderTypeLookup {
  orderTypeId: number
  orderTypeCode: string
  orderTypeName: string
}

export interface IOrderTypeCategoryLookup {
  orderTypeCategoryId: number
  orderTypeCategoryCode: string
  orderTypeCategoryName: string
}

export interface IServiceCategoryLookup {
  serviceCategoryId: number
  serviceCategoryCode: string
  serviceCategoryName: string
}

export interface IServiceTypeLookup {
  serviceTypeId: number
  serviceTypeCode: string
  serviceTypeName: string
}

export interface IServiceTypeCategoryLookup {
  serviceTypeCategoryId: number
  serviceTypeCategoryCode: string
  serviceTypeCategoryName: string
}

export interface IModuleTransactionLookup {
  moduleId: number
  moduleName: string
  transactionId: number
  transactionName: string
}

export interface IDocumentTypeLookup {
  docTypeId: number
  docTypeCode: string
  docTypeName: string
}

export interface IEntityTypeLookup {
  entityTypeId: number
  entityTypeCode: string
  entityTypeName: string
}

export interface IVisaLookup {
  visaId: number
  visaCode: string
  visaName: string
}
export interface ISupplyTypeLookup {
  supplyTypeId: number
  supplyTypeCode: string
  supplyTypeName: string
}
export interface ICargoTypeLookup {
  cargoTypeId: number
  cargoTypeCode: string
  cargoTypeName: string
}
export interface IVesselTypeLookup {
  vesselTypeId: number
  vesselTypeCode: string
  vesselTypeName: string
}
export interface IStatusLookup {
  statusId: number
  statusCode: string
  statusName: string
}

export interface IJobStatusLookup {
  jobStatusId: number
  jobStatusCode: string
  jobStatusName: string
}

export interface ITaskStatusLookup {
  taskStatusId: number
  taskStatusCode: string
  taskStatusName: string
}
export interface IRankLookup {
  rankId: number
  rankCode: string
  rankName: string
}
export interface IGenderLookup {
  genderId: number
  genderCode: string
  genderName: string
}
export interface IVisaLookup {
  visaId: number
  visaCode: string
  visaName: string
}

export interface IGeoLocationLookup {
  geoLocationId: number
  geoLocationCode: string
  geoLocationName: string
  latitude: string
  longitude: string
}

export interface IPassTypeLookup {
  passTypeId: number
  passTypeCode: string
  passTypeName: string
}

export interface ILandingPurposeLookup {
  landingPurposeId: number
  landingPurposeCode: string
  landingPurposeName: string
}

export interface ILandingTypeLookup {
  landingTypeId: number
  landingTypeCode: string
  landingTypeName: string
}

export interface IServiceModeLookup {
  serviceModeId: number
  serviceModeCode: string
  serviceModeName: string
}

export interface ITransportModeLookup {
  transportModeId: number
  transportModeCode: string
  transportModeName: string
}

export interface ITransportLocationLookup {
  transportLocationId: number
  transportLocationCode: string
  transportLocationName: string
}

export interface IConsignmentTypeLookup {
  consignmentTypeId: number
  consignmentTypeCode: string
  consignmentTypeName: string
}

export interface ICarrierLookup {
  carrierId: number
  carrierCode: string
  carrierName: string
}

export interface ICompanyLookup {
  companyId: number
  companyCode: string
  companyName: string
}

export interface IPayrollComponentLookup {
  componentId: number
  componentName: string
  componentCode: string
}

export interface IPayrollComponentGroupLookup {
  componentGroupId: number
  groupName: string
  groupCode: string
}

export interface ILoanTypeLookup {
  loanTypeId: number
  loanTypeCode: string
  loanTypeName: string
}

export interface IStatusTypeLookup {
  statusTypeId: number
  statusTypeCode: string
  statusTypeName: string
}
export interface IYearLookup {
  yearId: number
  yearCode: string
  yearName: string
}
