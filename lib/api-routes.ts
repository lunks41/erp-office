export const Login = "/auth/login"
export const RefreshToken = "/auth/refreshtoken"

// Admin Endpoints
export const Admin = {
  getUserModules: "/admin/getusersmodules",
  getUserTransactions: "/admin/GetUsersTransactions",
  getUserTransactionsAll: "/admin/GetUsersTransactionsAll",
  getCompanies: "/admin/getusercompany",
  getCompany: "/admin/GetUserCompany",
  getUserRights: "/admin/GetUserRightsbyUser",
  getDocumentById: "/admin/GetDocumentbyid",
  saveDocument: "/admin/SaveDocument",
  deleteDocument: "/admin/DeleteDocument",
  getChecklistLog: "/admin/GetChecklistLog",
}

// User Rights Endpoints
export const UserRights = {
  get: "/admin/getUserRightsbyid",
  add: "/admin/saveUserRights",
  addV1: "/admin/SaveUserRightsV1",
  getV1: "/admin/GetUserRightsbyidV1",
}

// Document Endpoints
export const DocumentType = {
  get: "/master/getdocumenttype",
  getbyId: "/master/getdocumenttypebyid",
  getByCode: "/master/getdocumenttypebycode",
  add: "/master/savedocumenttype",
  delete: "/master/deletedocumenttype",
}

// Document Endpoints
export const LeaveType = {
  get: "/master/getleavetype",
  getbyId: "/master/getleavetypebyid",
  getByCode: "/master/getleavetypebycode",
  add: "/master/saveleavetype",
  delete: "/master/deleteleavetype",
}

// Document Endpoints
export const EntityType = {
  get: "/master/getentitytype",
  getbyId: "/master/getentitytypebyid",
  getByCode: "/master/getentitytypebycode",
  add: "/master/saveentitytype",
  delete: "/master/deleteentitytype",
}

// Document Endpoints
export const LoanType = {
  get: "/master/getloantype",
  getbyId: "/master/getloantypebyid",
  getByCode: "/master/getloantypebycode",
  add: "/master/saveloantype",
  delete: "/master/deleteloantype",
}

// Document Expiry Endpoints
export const DocumentExpiry = {
  get: "/document/GetExpDocument",
  getById: "/document/GetExpDocumentbyid",
  add: "/document/SaveExpDocument",
  update: "/document/SaveExpDocument",
  delete: "/document/DeleteExpDocument",
}

// Attendance Endpoints
export const Hr_Attendance = {
  get: "/hr/GetAttendanceEmployee",
  getV1: "/hr/GetBulkAttendance",
  getById: "/hr/GetAttendanceEmployeeById",
  save: "/hr/SaveAttendanceEmployee",
  saveBulk: "/hr/SaveBulkAttendance",
  delete: "/hr/DeleteAttendanceEmployee",
}

// User Endpoints
export const AuditLog = {
  getauditlog: "/admin/getauditlog",
  getuserlog: "/admin/getuserlog",
  geterrorlog: "/admin/geterrorlog",
}

// User Endpoints
export const User = {
  get: "/admin/getuser",
  getbyid: "/admin/GetUserbyid",
  getbycode: "/admin/GetUserbycode",
  add: "/admin/saveuser",
  delete: "/admin/deleteuser",
  resetPassword: "/admin/resetpassword",
}

// User Group Endpoints
export const UserGroup = {
  get: "/admin/getusergroup",
  getbyid: "/admin/getusergroupbyid",
  getbycode: "/admin/getusergroupbycode",
  add: "/admin/saveusergroup",
  delete: "/admin/deleteusergroup",
}

// User Role Endpoints
export const UserRole = {
  get: "/admin/getuserrole",
  getbyid: "/admin/getuserrolebyid",
  getbycode: "/admin/getuserrolebycode",
  add: "/admin/saveuserrole",
  delete: "/admin/deleteuserrole",
}

// User Group Rights Endpoints
export const UserGroupRights = {
  get: "/admin/getusergrouprightsbyid",
  add: "/admin/saveusergrouprights",
  clone: "/admin/cloneusergrouprights",
}

// User Group Report Rights Endpoints
export const UserGroupReportRights = {
  get: "/admin/getusergroupreportrightsbyid",
  add: "/admin/saveusergroupreportrights",
  clone: "/admin/cloneusergroupreportrights",
}

// Share Data Endpoints
export const ShareData = {
  get: "/admin/getsharedata",
  add: "/admin/savesharedata",
}

// Basic Setting Endpoints
export const BasicSetting = {
  getExchangeRate: "/setting/getexchangerate",
  getExchangeRateLocal: "/setting/getexchangeratelocal",
  getCheckPeriodClosed: "/setting/getcheckperiodclosed",
  getCheckPeriodClosedByAccountDate: "/setting/GetGlPeriodClose",
  getGstPercentage: "/setting/getgstpercentage",
  getDaysfromCreditTerm: "/setting/getcredittermday",
}

// Decimal Setting Endpoints
export const DecimalSetting = {
  get: "/setting/getdecsetting",
  add: "/setting/savedecsetting",
}

export const TaskServiceSetting = {
  get: "/setting/GetTaskServiceSetting",
  add: "/setting/SaveTaskServiceSetting",
}

// Finance Setting Endpoints
export const FinanceSetting = {
  get: "/setting/getfinsetting",
  add: "/setting/savefinsetting",
}

// User Setting Endpoints
export const UserSetting = {
  get: "/setting/getusersetting",
  add: "/setting/saveusersetting",
}

// Default Setting Endpoints
export const DefaultSetting = {
  get: "/setting/getdefaultsetting",
  add: "/setting/savedefaultsetting",
}

// Dynamic Setting Endpoints
export const DynamicLookupSetting = {
  get: "/setting/getdynamiclookup",
  add: "/setting/savedynamiclookup",
}

// Mandatory Field Setting Endpoints
export const MandatoryFieldSetting = {
  get: "/setting/getmandatoryfieldsbyid",
  getV1: "/setting/getmandatoryfieldsbyidv1",
  add: "/setting/savemandatoryfields",
}

// Visible Field Setting Endpoints
export const VisibleFieldSetting = {
  get: "/setting/getvisiblefieldsbyid",
  getV1: "/setting/getvisiblefieldsbyidv1",
  add: "/setting/savevisiblefields",
}

// Number Format Endpoints
export const NumberFormat = {
  getmodtrnslist: "/setting/getnumberformat",
  getById: "/setting/getnumberformatbyid",
  getByYear: "/setting/getnumberformatbyyear",
  add: "/setting/savenumberformat",
}

// User Grid Setting Endpoints
export const UserGrid = {
  get: "/setting/getusergrid",
  getV2: "/setting/GetUserGridV1",
  getV1: "/setting/GetUserGridByIdV1",
  getById: "/setting/getusergridbyid",
  getByUserId: "/setting/getusergridbyuserid",
  add: "/setting/saveusergrid",
  clone: "/setting/cloneusergrid",
  delete: "/setting/deleteusergrid",
}

// Master Lookup Endpoints
export const Lookup = {
  getCountry: "/master/getcountrylookup",

  getBarge: "/master/getbargelookup",
  getCurrency: "/master/getcurrencylookup",
  getChartOfAccount: "/master/getchartofaccountlookup",
  getBankChartOfAccount: "/master/getbankchartofaccountlookup",
  getReceivableChartOfAccount: "/master/getreceivablechartofaccountlookup",
  getPayableChartOfAccount: "/master/getpayablechartofaccountlookup",
  getAccountSetupCategory: "/master/getaccountsetupcategorylookup",
  getAccountSetup: "/master/getaccountsetuplookup",
  getCategory: "/master/getcategorylookup",
  getSubCategory: "/master/getsubcategorylookup",
  getCoaCategory1: "/master/getcoacategory1lookup",
  getCoaCategory2: "/master/getcoacategory2lookup",
  getCoaCategory3: "/master/getcoacategory3lookup",
  getAccountType: "/master/getaccounttypelookup",
  getAccountGroup: "/master/getaccountgrouplookup",
  getPortRegion: "/master/getportregionlookup",
  getOrderType: "/master/getordertypelookup",
  getOrderTypeCategory: "/master/getordertypecategorylookup",
  getServiceCategory: "/master/GetServiceCategoryLookup",
  getServiceTypeCategory: "/master/getservicetypecategorylookup",
  getDepartment: "/master/getdepartmentlookup",
  getWorkLocation: "/master/getworklocationlookup",
  getCustomer: "/master/getcustomerlookup",
  getCompanyCustomer: "/master/getcompanycustomerlookup",
  getCompanySupplier: "/master/getcompanysupplierlookup",
  getCreditTerm: "/master/getcredittermslookup",
  getBank: "/master/getbanklookup",
  getJobOrder: "/master/getjoborderlookup",
  getJobOrderV1: "/master/getjoborderlookupv1",
  getJobOrderCustomer: "/master/getjobordercustomerlookup",
  getTask: "/master/gettasklookup",
  getCharge: "/master/getchargelookup",
  getTransportCharge: "/master/gettransportchargelookup",
  getYear: "/master/getperiodcloseyear",
  getFutureYear: "/master/getperiodclosefutureyear",
  getGstCategory: "/master/getgstcategorylookup",
  getTaxCategory: "/master/gettaxcategorylookup",
  getProduct: "/master/getproductlookup",
  getGst: "/master/getgstlookup",
  getUom: "/master/getuomlookup",
  getPort: "/master/getportlookup",
  getVoyage: "/master/getvoyagelookup",
  getDesignation: "/master/getdesignationlookup",
  getEmployee: "/master/getemployeelookup",
  getLoanType: "/master/getloantypelookup",
  getLeaveType: "/master/getleavetypelookup",
  getTax: "/master/gettaxlookup",
  getUserGroup: "/master/getusergrouplookup",
  getUserRole: "/master/getuserrolelookup",
  getUser: "/master/getuserlookup",
  getTransaction: "/master/gettransactionlookup",
  getModule: "/master/getmodulelookup",
  getCustomerAddress: "/master/getcustomeraddresslookup_fin",
  getCustomerContact: "/master/getcustomercontactlookup_fin",
  getSupplierAddressList: "/master/getsupplieraddresslookup_fin",
  getSupplierContactList: "/master/getsuppliercontactlookup_fin",
  getSupplierAddress: "/master/getsupplieraddresslookup",
  getSupplierContact: "/master/getsuppliercontactlookup",
  getBankAddress: "/master/getbankaddresslookup_fin",
  getBankContact: "/master/getbankcontactlookup_fin",
  getSupplier: "/master/getsupplierlookup",
  getPaymentType: "/master/getpaymenttypelookup",
  getVessel: "/master/getvessellookup",

  getNumberYear: "/master/getnumberformatnextyear",

  getJobStatus: "/master/getjobstatuslookup",
  getTaskStatus: "/master/gettaskstatuslookup",
  getRank: "/master/getranklookup",
  getGender: "/master/getgenderlookup",
  getVisa: "/master/getvisalookup",
  getGeoLocation: "/master/getgeolocationlookup",
  getSupplyType: "/master/getsupplytypelookup",
  getCargoType: "/master/getcargotypelookup",
  getVesselType: "/master/getvesseltypelookup",
  getPassType: "/master/getpasstypelookup",
  getLandingType: "/master/getlandingtypelookup",
  getLandingPurpose: "/master/getLandingPurposelookup",
  getServiceMode: "/master/getservicemodelookup",
  getTransportMode: "/master/gettransportmodelookup",
  getTransportLocation: "/master/gettransportlocationlookup",
  getConsignmentType: "/master/getconsignmenttypelookup",
  getCarrier: "/master/getcarrierlookup",
  getCompany: "/master/getcompanylookup",
  getComponent: "/master/getcomponentlookup",
  getComponentGroup: "/master/getcomponentgrouplookup",

  getApprovalStatusType: "/master/getapprovalstatuslookup",
  getLoanRequestStatusLookup: "/master/getloanrequeststatuslookup",
  getDisbursementLookup: "/master/getdisbursementlookup",
  getRepaymentStatusLookup: "/master/getrepaymentstatuslookup",
  getComponentLookup: "/master/GetComponentLookup",
  getPayrollComponentGroupLookup: "/master/getpayrollcomponentgrouplookup",

  getDocumentType: "/master/getdocumenttypelookup",
  getEntityType: "/master/getentitytypelookup",
  getEmployer: "/master/getemployerlookup",

  getJobOrderTask: "/master/getjobordertasklookup",
  getJobOrderCharge: "/master/getjoborderchargelookup",

  getVesselDynamic: "/master/getvessellookup_v1",
  getBargeDynamic: "/master/getbargelookup_v1",
  getVoyageDynamic: "/master/getvoyagelookup_v1",
  getCustomerDynamic: "/master/getcustomerlookup_v1",
  getSupplierDynamic: "/master/getsupplierlookup_v1",
  getProductDynamic: "/master/getproductlookup_v1",
  getJobOrderDynamic: "/master/getjoborderlookup_v1",

  getJobOrderCompany: "/master/getjobordercompanylookup",
}

// Universal Documents Endpoints
export const UniversalDocuments = {
  get: "/document/getuniversaldocuments",
  getById: "/document/getuniversaldocumentbyid",
  getByEntity: "/document/getuniversaldocumentsbyentity",
  add: "/document/saveuniversaldocument",
  addDetails: "/document/saveuniversaldocumentdetails",
  delete: "/document/deleteuniversaldocument",
  getExpiring: "/document/getexpiringdocuments",
  getExpired: "/document/getexpireddocuments",
}

//Master Endpoints

// Supplier Endpoints
export const Supplier = {
  get: "/master/getsuppliers",
  getById: "/master/getsupplierbyid",
  add: "/master/savesupplier",
  delete: "/master/deletesupplier",
}

// Supplier Address Endpoints
export const SupplierAddress = {
  get: "/master/GetSupplierAddressbySupplierId",
  getBySupplierId: "/master/GetSupplierAddressbyid",
  add: "/master/savesupplieraddress",
  delete: "/master/deletesupplieraddress",
}

// Supplier Contact Endpoints
export const SupplierContact = {
  get: "/master/getsuppliercontactbysupplierid",
  getBySupplierId: "/master/getsuppliercontactbyid",
  add: "/master/savesuppliercontact",
  delete: "/master/deletesuppliercontact",
}

// Bank Endpoints
export const Bank = {
  get: "/master/getbanks",
  getById: "/master/getbankbyid",
  getByCode: "/master/getbankbycode",
  add: "/master/savebank",
  delete: "/master/deletebank",
}

// Bank Address Endpoints
export const BankAddress = {
  get: "/master/GetBankAddressbyBankId",
  getByBankId: "/master/GetBankAddressbyid",
  getByCode: "/master/GetBankAddressbycode",
  add: "/master/savebankaddress",
  delete: "/master/deletebankaddress",
}

// Bank Contact Endpoints
export const BankContact = {
  get: "/master/GetBankContactbyBankId",
  getByBankId: "/master/GetBankContactbyid",
  add: "/master/savebankcontact",
  delete: "/master/deletebankcontact",
}

// Customer Endpoints
export const Customer = {
  get: "/master/getcustomer",
  getById: "/master/getcustomerbyid",
  add: "/master/savecustomer",
  delete: "/master/deletecustomer",
}

// Customer Address Endpoints
export const CustomerAddress = {
  get: "/master/GetCustomerAddressbyCustomerId",
  getByCustomerId: "/master/GetCustomerAddressbyid",
  add: "/master/savecustomeraddress",
  delete: "/master/deletecustomeraddress",
}

// Customer Contact Endpoints
export const CustomerContact = {
  get: "/master/getcustomercontactbycustomerid",
  getByCustomerId: "/master/getcustomercontactbyid",
  add: "/master/savecustomercontact",
  delete: "/master/deletecustomercontact",
}

// Account Group Endpoints
export const AccountGroup = {
  get: "/master/getaccountgroup",
  getByCode: "/master/getaccountgroupbycode",
  add: "/master/saveaccountgroup",
  delete: "/master/deleteaccountgroup",
}

// Account Setup Category Endpoints
export const AccountSetupCategory = {
  get: "/master/getaccountsetupcategory",
  getByCode: "/master/GetAccountSetupCategorybycode",
  add: "/master/saveaccountsetupcategory",
  delete: "/master/deleteaccountsetupcategory",
}

// Account Setup Endpoints
export const AccountSetup = {
  get: "/master/getaccountsetup",
  getByCode: "/master/getaccountsetupbycode",
  add: "/master/saveaccountsetup",
  delete: "/master/deleteaccountsetup",
}

// Account Setup Details Endpoints
export const AccountSetupDt = {
  get: "/master/getaccountsetupdt",
  getByCode: "/master/getaccountsetupdtbycode",
  add: "/master/saveaccountsetupdt",
  delete: "/master/deleteaccountsetupdt",
}

// Account Type Endpoints
export const AccountType = {
  get: "/master/getaccounttype",
  getByCode: "/master/getaccounttypebycode",
  add: "/master/saveaccounttype",
  delete: "/master/deleteaccounttype",
}

// Task Endpoints
export const Task = {
  get: "/master/gettask",
  getByCode: "/master/gettaskbycode",
  add: "/master/savetask",
  delete: "/master/deletetask",
}

// Visa Endpoints
export const Visa = {
  get: "/master/getvisa",
  getByCode: "/master/getvisabycode",
  add: "/master/savevisa",
  delete: "/master/deletevisa",
}

// GeoLocation Endpoints
export const GeoLocation = {
  get: "/master/getgeolocation",
  getByCode: "/master/getgeolocationbycode",
  add: "/master/savegeolocation",
  delete: "/master/deletegeolocation",
}

// SupplyType Endpoints
export const SupplyType = {
  get: "/master/getsupplytype",
  getByCode: "/master/getsupplytypebycode",
  add: "/master/savesupplytype",
  delete: "/master/deletesupplytype",
}

// CargoType Endpoints
export const CargoType = {
  get: "/master/getcargotype",
  getByCode: "/master/getcargotypebycode",
  add: "/master/savecargotype",
  delete: "/master/deletecargotype",
}

// VesselType Endpoints
export const VesselType = {
  get: "/master/getvesseltype",
  getByCode: "/master/getvesseltypebycode",
  add: "/master/savevesseltype",
  delete: "/master/deletevesseltype",
}

// Rank Endpoints
export const Rank = {
  get: "/master/getrank",
  getByCode: "/master/getrankbycode",
  add: "/master/saverank",
  delete: "/master/deleterank",
}

// ServiceMode Endpoints
export const ServiceMode = {
  get: "/master/getservicemode",
  getByCode: "/master/getservicemodebycode",
  add: "/master/saveservicemode",
  delete: "/master/deleteservicemode",
}

// TransportLocation Endpoints
export const TransportLocation = {
  get: "/master/gettransportlocation",
  getByCode: "/master/gettransportlocationbycode",
  add: "/master/savetransportlocation",
  delete: "/master/deletetransportlocation",
}

// TransportMode Endpoints
export const TransportMode = {
  get: "/master/gettransportmode",
  getByCode: "/master/gettransportmodebycode",
  add: "/master/savetransportmode",
  delete: "/master/deletetransportmode",
}

// Carrier Endpoints
export const Carrier = {
  get: "/master/getcarrier",
  getByCode: "/master/getcarrierbycode",
  add: "/master/savecarrier",
  delete: "/master/deletecarrier",
}

// LandingType Endpoints
export const LandingType = {
  get: "/master/getlandingtype",
  getByCode: "/master/getlandingtypebycode",
  add: "/master/savelandingtype",
  delete: "/master/deletelandingtype",
}

// LandingPurpose Endpoints
export const LandingPurpose = {
  get: "/master/getlandingpurpose",
  getByCode: "/master/getlandingpurposebycode",
  add: "/master/savelandingpurpose",
  delete: "/master/deletelandingpurpose",
}

// TaskStatus Endpoints
export const TaskStatus = {
  get: "/master/gettaskstatus",
  getByCode: "/master/gettaskstatusbycode",
  add: "/master/savetaskstatus",
  delete: "/master/deletetaskstatus",
}

// PassType Endpoints
export const PassType = {
  get: "/master/getpasstype",
  getByCode: "/master/getpasstypebycode",
  add: "/master/savepasstype",
  delete: "/master/deletepasstype",
}

// ConsignmentType Endpoints
export const ConsignmentType = {
  get: "/master/getconsignmenttype",
  getByCode: "/master/getconsignmenttypebycode",
  add: "/master/saveconsignmenttype",
  delete: "/master/deleteconsignmenttype",
}

// JobStatus Endpoints
export const JobStatus = {
  get: "/master/getjobstatus",
  getByCode: "/master/getjobstatusbycode",
  add: "/master/savejobstatus",
  delete: "/master/deletejobstatus",
}

// VATServiceCategory Endpoints
export const VATServiceCategory = {
  get: "/master/getvatservicecategory",
  getByCode: "/master/getvatservicecategorybycode",
  add: "/master/savevatservicecategory",
  delete: "/master/deletevatservicecategory",
}

// Charge Endpoints
export const Charge = {
  get: "/master/getcharge",
  getByCode: "/master/getchargebycode",
  add: "/master/savecharge",
  delete: "/master/deletecharge",
}

// ChargeGLMapping Endpoints
export const ChargeGLMapping = {
  get: "/master/getchargeglmapping",
  add: "/master/savechargeglmapping",
  delete: "/master/deletechargeglmapping",
}

// COA Category 1 Endpoints
export const CoaCategory1 = {
  get: "/master/getcoacategory1",
  getByCode: "/master/getcoacategory1bycode",
  add: "/master/savecoacategory1",
  delete: "/master/deletecoacategory1",
}

// COA Category 2 Endpoints
export const CoaCategory2 = {
  get: "/master/getcoacategory2",
  getByCode: "/master/getcoacategory2bycode",
  add: "/master/savecoacategory2",
  delete: "/master/deletecoacategory2",
}

// COA Category 3 Endpoints
export const CoaCategory3 = {
  get: "/master/getcoacategory3",
  getByCode: "/master/getcoacategory3bycode",
  add: "/master/savecoacategory3",
  delete: "/master/deletecoacategory3",
}

// Barge Endpoints
export const Barge = {
  get: "/master/getbarge",
  getByCode: "/master/getbargebycode",
  add: "/master/savebarge",
  delete: "/master/deletebarge",
}

// BargeGLMapping Endpoints
export const BargeGLMapping = {
  get: "/master/getbargeglmapping",
  add: "/master/savebargeglmapping",
  delete: "/master/deletebargeglmapping",
}

// Category Endpoints
export const Category = {
  get: "/master/getcategory",
  getByCode: "/master/getcategorybycode",
  add: "/master/savecategory",
  delete: "/master/deletecategory",
}

// Country Endpoints
export const Country = {
  get: "/master/getcountry",
  getByCode: "/master/getcountrybycode",
  add: "/master/savecountry",
  delete: "/master/deletecountry",
}

// Credit Term Details Endpoints
export const CreditTermDt = {
  get: "/master/getcredittermdt",
  getByCode: "/master/getcredittermdtbycode",
  add: "/master/savecredittermdt",
  delete: "/master/deletecredittermdt",
}

// Credit Term Endpoints
export const CreditTerm = {
  get: "/master/getcreditterm",
  getByCode: "/master/getcredittermbycode",
  add: "/master/savecreditterm",
  delete: "/master/deletecreditterm",
}

// ChartOfAccount Endpoints
export const ChartOfAccount = {
  get: "/master/getchartofaccount",
  getByCode: "/master/getchartofaccountbycode",
  add: "/master/savechartofaccount",
  delete: "/master/deletechartofaccount",
}

// Vessel Endpoints
export const Vessel = {
  get: "/master/getvessel",
  getByCode: "/master/getvesselbycode",
  add: "/master/savevessel",
  delete: "/master/deletevessel",
}

// Voyage Endpoints
export const Voyage = {
  get: "/master/getvoyage",
  getByCode: "/master/getvoyagebycode",
  add: "/master/savevoyage",
  delete: "/master/deletevoyage",
}

// Tax Endpoints
export const Tax = {
  get: "/master/gettax",
  getByCode: "/master/gettaxbycode",
  add: "/master/savetax",
  delete: "/master/deletetax",
}

// Tax Details Endpoints
export const TaxDt = {
  get: "/master/gettaxdt",
  getByCode: "/master/gettaxdtbycode",
  add: "/master/savetaxdt",
  delete: "/master/deletetaxdt",
}

// Tax Category Endpoints
export const TaxCategory = {
  get: "/master/gettaxcategory",
  getByCode: "/master/gettaxcategorybycode",
  add: "/master/savetaxcategory",
  delete: "/master/deletetaxcategory",
}

// Currency Endpoints
export const Currency = {
  get: "/master/getcurrency",
  getByCode: "/master/getcurrencybycode",
  add: "/master/savecurrency",
  delete: "/master/deletecurrency",
  getDt: "/master/getcurrencydt",
  addDt: "/master/savecurrencydt",
  deleteDt: "/master/deletecurrencydt",
  getLocalDt: "/master/getcurrencylocaldt",
  addLocalDt: "/master/savecurrencylocaldt",
  deleteLocalDt: "/master/deletecurrencylocaldt",
}

// Currency Details Endpoints
export const CurrencyDt = {
  get: "/master/getcurrencydt",
  add: "/master/savecurrencydt",
  delete: "/master/deletecurrencydt",
}

// Local Currency Details Endpoints
export const CurrencyLocalDt = {
  get: "/master/getcurrencylocaldt",
  add: "/master/savecurrencylocaldt",
  delete: "/master/deletecurrencylocaldt",
}

// Department Endpoints
export const Department = {
  get: "/master/getdepartment",
  getByCode: "/master/getdepartmentbycode",
  add: "/master/savedepartment",
  delete: "/master/deletedepartment",
}

// Work Location Endpoints
export const WorkLocation = {
  get: "/master/getworklocation",
  getByCode: "/master/getworklocationbycode",
  add: "/master/saveworklocation",
  delete: "/master/deleteworklocation",
}

// Designation Endpoints
export const Designation = {
  get: "/master/getdesignation",
  getByCode: "/master/getdesignationbycode",
  add: "/master/savedesignation",
  delete: "/master/deletedesignation",
}

// Employee Endpoints
export const Employee = {
  get: "/master/getemployee",
  getById: "/master/getemployeebyid",
  getByUserId: "/master/getemployeebyuserid",
  add: "/master/saveemployee",
  getBankById: "/master/getemployeebankbyid",
  addBank: "/master/saveemployeebank",
  getPersonalById: "/master/getpersonaldetailsbyid",
  addPersonal: "/master/savepersonaldetails",
  delete: "/master/deleteemployee",
}

// Employer Details Endpoints
export const Employer = {
  get: "/hr/getemployer",
  getByCode: "/hr/getemployerbycode",
  add: "/hr/saveemployer",
  delete: "/hr/deleteemployer",
}

// Pay Schedule Endpoints
export const PaySchedule = {
  get: "/hr/setting/getpayschedule",
  getById: "/hr/setting/getpayschedulebyid",
  add: "/hr/setting/savepayschedule",
}

// GST Endpoints
export const Gst = {
  get: "/master/getgst",
  getByCode: "/master/getgstbycode",
  add: "/master/savegst",
  delete: "/master/deletegst",
}

// GST Category Endpoints
export const GstCategory = {
  get: "/master/getgstcategory",
  getByCode: "/master/getgstcategorybycode",
  add: "/master/savegstcategory",
  delete: "/master/deletegstcategory",
}

// GST Details Endpoints
export const GstDt = {
  get: "/master/getgstdt",
  getByCode: "/master/getgstdtbycode",
  add: "/master/savegstdt",
  delete: "/master/deletegstdt",
}

// Port Region Endpoints
export const PortRegion = {
  get: "/master/getportregion",
  getByCode: "/master/getportregionbycode",
  add: "/master/saveportregion",
  delete: "/master/deleteportregion",
}

// Order Type Endpoints
export const OrderType = {
  get: "/master/getordertype",
  getByCode: "/master/getordertypebycode",
  add: "/master/saveordertype",
  delete: "/master/deleteordertype",
}

// Service Type Endpoints
export const ServiceType = {
  get: "/master/getservicetype",
  getByCode: "/master/getservicetypebycode",
  add: "/master/saveservicetype",
  delete: "/master/deleteservicetype",
}

// Order Type Category Endpoints
export const OrderTypeCategory = {
  get: "/master/getordertypecategory",
  getByCode: "/master/getordertypecategorybycode",
  add: "/master/saveordertypecategory",
  delete: "/master/deleteordertypecategory",
}

// Service Type Category Endpoints
export const ServiceTypeCategory = {
  get: "/master/getservicetypecategory",
  getByCode: "/master/getservicetypecategorybycode",
  add: "/master/saveservicetypecategory",
  delete: "/master/deleteservicetypecategory",
}

// Payment Type Endpoints
export const PaymentType = {
  get: "/master/getpaymenttype",
  getByCode: "/master/getpaymenttypebycode",
  add: "/master/savepaymenttype",
  delete: "/master/deletepaymenttype",
}

// Port Endpoints
export const Port = {
  get: "/master/getport",
  getByCode: "/master/getportbycode",
  add: "/master/saveport",
  delete: "/master/deleteport",
}

// Product Endpoints
export const Product = {
  get: "/master/getproduct",
  getByCode: "/master/getproductbycode",
  add: "/master/saveproduct",
  delete: "/master/deleteproduct",
}

// Sub Category Endpoints
export const SubCategory = {
  get: "/master/getsubcategory",
  getByCode: "/master/getsubcategorybycode",
  add: "/master/savesubcategory",
  delete: "/master/deletesubcategory",
}

// UOM Endpoints
export const Uom = {
  get: "/master/getuom",
  getByCode: "/master/getuombycode",
  add: "/master/saveuom",
  delete: "/master/deleteuom",
}

// UOM Detail Endpoints
export const UomDt = {
  get: "/master/getuomdt",
  add: "/master/saveuomdt",
  delete: "/master/deleteuomdt",
}

// Accounts Common Endpoints
export const HistoryDetails = {
  getGlPostingDetails: "/account/getglpostingdetailshistory",
  getPaymentDetails: "/account/getpaymentdetailshistory",
  getCustomerInvoice: "/account/getcustomerinvoice",
  getSupplierInvoice: "/account/getsupplierinvoice",
  getCustomerInvoiceNo: "/account/getcustomerinvoicebyno",
  getSupplierInvoiceNo: "/account/getsupplierinvoicebyno",
}

// Accounts Receivable Endpoints
export const Account = {
  getGlPeriodClose: "/account/getglperiodclose",
  getArOutstandTransaction: "/account/getaroutstandtransactions",
  getApOutstandTransaction: "/account/getapoutstandtransactions",
}

// Accounts Receivable Invoice Endpoints
export const ArInvoice = {
  get: "/account/getarinvoice",
  getByIdNo: "/account/getarinvoicebyidno",
  add: "/account/savearinvoice",
  delete: "/account/deletearinvoice",
  unpost: "/account/unpostarinvoice",
  history: "/account/gethistoryarinvoicebyid",
  historyDetails: "/account/gethistoryarinvoicedetailsbyid",
}

// Accounts Receivable Invoice CTM Endpoints
export const ArInvoiceCtm = {
  get: "/account/getarinvoicectm",
  getByIdNo: "/account/getarinvoicectmbyidno",
  add: "/account/savearinvoicectm",
  delete: "/account/deletearinvoicectm",
  history: "/account/gethistoryarinvoicectmbyid",
  historyDetails: "/account/gethistoryarinvoicectmdetailsbyid",
}

// Accounts Receivable Credit Note Endpoints
export const ArCreditNote = {
  get: "/account/getarcreditnote",
  getByIdNo: "/account/getarcreditnotebyidno",
  add: "/account/savearcreditnote",
  delete: "/account/deletearcreditnote",
  history: "/account/gethistoryarcreditnotebyid",
  historyDetails: "/account/gethistoryarcreditnotedetailsbyid",
}

// Accounts Receivable Debit Note Endpoints
export const ArDebitNote = {
  get: "/account/getardebitnote",
  getByIdNo: "/account/getardebitnotebyidno",
  add: "/account/saveardebitnote",
  delete: "/account/deleteardebitnote",
  history: "/account/gethistoryardebitnotebyid",
  historyDetails: "/account/gethistoryardebitnotedetailsbyid",
}

// Accounts Receivable Receipt Endpoints
export const ArReceipt = {
  get: "/account/getarreceipt",
  getByIdNo: "/account/getarreceiptbyidno",
  add: "/account/savearreceipt",
  delete: "/account/deletearreceipt",
  history: "/account/gethistoryarreceiptbyid",
  historyDetails: "/account/gethistoryarreceiptdetailsbyid",
}

// Accounts Receivable Refund Endpoints
export const ArRefund = {
  get: "/account/getarrefund",
  getByIdNo: "/account/getarrefundbyidno",
  add: "/account/savearrefund",
  delete: "/account/deletearrefund",
  history: "/account/gethistoryarrefundbyid",
  historyDetails: "/account/gethistoryarrefunddetailsbyid",
}

// Accounts Receivable Adjustment Endpoints
export const ArAdjustment = {
  get: "/account/getaradjustment",
  getByIdNo: "/account/getaradjustmentbyidno",
  add: "/account/savearadjustment",
  delete: "/account/deletearadjustment",
  history: "/account/gethistoryaradjustmentbyid",
  historyDetails: "/account/gethistoryaradjustmentdetailsbyid",
}

// Accounts Receivable DOCSetOff Endpoints
export const ArDocSetOff = {
  get: "/account/getardocsetoff",
  getByIdNo: "/account/getardocsetoffbyidno",
  add: "/account/saveardocsetoff",
  delete: "/account/deleteardocsetoff",
  history: "/account/gethistoryardocsetoffbyid",
  historyDetails: "/account/gethistoryardocsetoffdetailsbyid",
}

// Accounts Payable Invoice Endpoints
export const ApInvoice = {
  get: "/account/getapinvoice",
  getByIdNo: "/account/getapinvoicebyidno",
  add: "/account/saveapinvoice",
  delete: "/account/deleteapinvoice",
  history: "/account/gethistoryapinvoicebyid",
  historyDetails: "/account/gethistoryapinvoicedetailsbyid",
}

// Accounts Payable Credit Note Endpoints
export const ApCreditNote = {
  get: "/account/getapcreditnote",
  getByIdNo: "/account/getapcreditnotebyidno",
  add: "/account/saveapcreditnote",
  delete: "/account/deleteapcreditnote",
  history: "/account/gethistoryapcreditnotebyid",
  historyDetails: "/account/gethistoryapcreditnotedetailsbyid",
}

// Accounts Payable Debit Note Endpoints
export const ApDebitNote = {
  get: "/account/getapdebitnote",
  getByIdNo: "/account/getapdebitnotebyidno",
  add: "/account/saveapdebitnote",
  delete: "/account/deleteapdebitnote",
  history: "/account/gethistoryapdebitnotebyid",
  historyDetails: "/account/gethistoryapdebitnotedetailsbyid",
}

// Accounts Payable Payment Endpoints
export const ApPayment = {
  get: "/account/getappayment",
  getByIdNo: "/account/getappaymentbyidno",
  add: "/account/saveappayment",
  delete: "/account/deleteappayment",
  history: "/account/gethistoryappaymentbyid",
  historyDetails: "/account/gethistoryappaymentdetailsbyid",
}

// Accounts Payable Refund Endpoints
export const ApRefund = {
  get: "/account/getaprefund",
  getByIdNo: "/account/getaprefundbyidno",
  add: "/account/saveaprefund",
  delete: "/account/deleteaprefund",
  history: "/account/gethistoryaprefundbyid",
  historyDetails: "/account/gethistoryaprefunddetailsbyid",
}

// Accounts Payable Adjustment Endpoints
export const ApAdjustment = {
  get: "/account/getapadjustment",
  getByIdNo: "/account/getapadjustmentbyidno",
  add: "/account/saveapadjustment",
  delete: "/account/deleteapadjustment",
  history: "/account/gethistoryapadjustmentbyid",
  historyDetails: "/account/gethistoryapadjustmentdetailsbyid",
}

// Accounts Payable DOCSetOff Endpoints
export const ApDocSetOff = {
  get: "/account/getapdocsetoff",
  getByIdNo: "/account/getapdocsetoffbyidno",
  add: "/account/saveapdocsetoff",
  delete: "/account/deleteapdocsetoff",
  history: "/account/gethistoryapdocsetoffbyid",
  historyDetails: "/account/gethistoryapdocsetoffdetailsbyid",
}

// Alias for ApDocsetoff (casing variant)
export const ApDocsetoff = ApDocSetOff

// AP Job Transactions (invoice detail job allocation - update only)
export const ApJobTransaction = {
  getList: "/account/getjobtransaction",
  update: "/account/savejobtransaction",
}

// Cash Book Payment Endpoints
export const CbGenPayment = {
  get: "/account/getcbgenpayment",
  getByIdNo: "/account/getcbgenpaymentbyidno",
  add: "/account/savecbgenpayment",
  delete: "/account/deletecbgenpayment",
  history: "/account/gethistorycbgenpaymentbyid",
  historyDetails: "/account/gethistorycbgenpaymentdetailsbyid",
}

// Alias for CbPayment
export const CbPayment = CbGenPayment

// Cash Book Receipt Endpoints
export const CbGenReceipt = {
  get: "/account/getcbgenreceipt",
  getByIdNo: "/account/getcbgenreceiptbyidno",
  add: "/account/savecbgenreceipt",
  delete: "/account/deletecbgenreceipt",
  history: "/account/GetHistoryCBGenReceiptById",
  historyDetails: "/account/gethistorycbgenreceiptdetailsbyid",
}

// Alias for CbReceipt
export const CbReceipt = CbGenReceipt

// Cash Book Batch Payment Endpoints
export const CbBatchPayment = {
  get: "/account/getcbbatchpayment",
  getByIdNo: "/account/getcbbatchpaymentbyidno",
  add: "/account/savecbbatchpayment",
  delete: "/account/deletecbbatchpayment",
  history: "/account/GetHistoryCBBatchPaymentById",
  historyDetails: "/account/gethistorycbbatchpaymentdetailsbyid",
}

// Cash Book Petty Cash Endpoints
export const CbPettyCash = {
  get: "/account/getcbpettycash",
  getByIdNo: "/account/getcbpettycashbyidno",
  add: "/account/savecbpettycash",
  delete: "/account/deletecbpettycash",
  history: "/account/gethistorycbpettycashbyid",
  historyDetails: "/account/gethistorycbpettycashdetailsbyid",
  checkDuplicateSupplierInvoice: "/account/GetCheckDuplicateSupplierInvoice",
}

// Cash Book Bank Reconciliation Endpoints
export const CbBankRecon = {
  get: "/account/getcbbankrecon",
  getByIdNo: "/account/getcbbankreconbyidno",
  add: "/account/savecbbankrecon",
  delete: "/account/deletecbbankrecon",
  history: "/account/gethistorycbbankreconbyid",
  historyDetails: "/account/gethistorycbbankrecondetailsbyid",
}

// Cash Book Bank Transfer CTM Endpoints
export const CbBankTransferCtm = {
  get: "/account/getcbbanktransferctm",
  getByIdNo: "/account/getcbbanktransferctmbyidno",
  add: "/account/savecbbanktransferctm",
  delete: "/account/deletecbbanktransferctm",
  history: "/account/gethistorycbbanktransferctmbyid",
  historyDetails: "/account/gethistorycbbanktransferctmdetailsbyid",
}

// Cash Book Bank Transfer Endpoints
export const CbBankTransfer = {
  get: "/account/getcbbanktransfer",
  getByIdNo: "/account/getcbbanktransferbyidno",
  add: "/account/savecbbanktransfer",
  delete: "/account/deletecbbanktransfer",
  history: "/account/gethistorycbbanktransferbyid",
  historyDetails: "/account/gethistorycbbanktransferdetailsbyid",
}

// General Ledger Journal Endpoints
export const GLJournal = {
  get: "/account/getgljournal",
  getByIdNo: "/account/getgljournalbyidno",
  add: "/account/savegljournal",
  delete: "/account/deletegljournal",
  history: "/account/gethistorygljournalbyid",
  historyDetails: "/account/gethistorygljournaldetailsbyid",
}

// General Ledger Contra Endpoints
export const GLContra = {
  get: "/account/getglcontra",
  getByIdNo: "/account/getglcontrabyidno",
  add: "/account/saveglcontra",
  delete: "/account/deleteglcontra",
  history: "/account/gethistoryglcontrabyid",
  historyDetails: "/account/gethistoryglcontradetailsbyid",
}

// General Ledger Period Close Endpoints
export const GLPeriodClose = {
  get: "/account/getglperiodclose",
  getById: "/account/getglperiodclosebyid",
  generate: "/account/generateglperiodclose",
  add: "/account/saveglperiodclose",
  delete: "/account/deleteglperiodclose",
}

// General Ledger Opening Balance Endpoints
export const GLOpeningBalance = {
  getById: "/account/GetGLOpeningBalance",
  add: "/account/SaveGLOpeningBalance",
}

// General Ledger Year End Process Endpoints
export const GLYearEndProcess = {
  generate: "/account/GenerateGLYearEndProcess",
  add: "/account/SaveGLYearEndProcess",
}

export const Company = {
  get: "/company",
  add: "/company",
  delete: "/company",
}

// Checklist Endpoints
export const Checklist = {
  get: "/checklist/get",
  getById: "/checklist/getbyid",
  add: "/checklist/save",
  delete: "/checklist/delete",
  getDetails: "/checklist/getdetails",
  saveDetails: "/checklist/savedetails",
}

// Job Order Endpoints
export const JobOrder = {
  get: "/operations/getjoborder",
  getById: "/operations/getjoborderbyid",
  add: "/operations/savejoborder",
  delete: "/operations/deletejoborder",
  getDetails: "/operations/getdetails",
  saveDetails: "/operations/savedetails",
  getTaskCount: "/operations/gettaskcount",
  getHistory: "/operations/getjoborderbyidhistory",
  cloneChecklist: "/operations/CloneChecklist",
  cloneTaskChecklist: "/operations/CloneTaskFromChecklist",
  getAllCompanies: "/operations/getjoborderallcompanies", // Cross-company search
}

// Tariff Endpoints
export const Tariff = {
  getTariffCount: "/operations/gettariffcount",
  getTariffList: "/operations/gettarifflist",
  getTariffByTask: "/operations/gettariffbytask",
  getById: "/operations/gettariffbyid",
  add: "/operations/savetariff",
  delete: "/operations/deletetariff",
  copy: "/operations/copytariff",
  copyCompanyTariff: "/operations/copycompanytariff",
  getTariffRpt: "/operations/gettariffrpt",
}

// Template Endpoints
export const Template = {
  get: "/operations/gettemplate",
  getById: "/operations/gettemplatebyid",
  add: "/operations/savetemplate",
  delete: "/operations/deletetemplate",
}

// Port Expenses Endpoints
export const JobOrder_PortExpenses = {
  get: "/operations/getportexpenses",
  getById: "/operations/GetPortExpensesById",
  add: "/operations/saveportexpenses",
  delete: "/operations/deleteportexpenses",
  bulkDelete: "/operations/DeletePortExpensesBulk",
  getByIdHistory: "/operations/GetPortExpensesByIdHistory",
}

// Launch Services Endpoints
export const JobOrder_LaunchServices = {
  get: "/operations/getlaunchservices",
  getById: "/operations/getlaunchservicesbyid",
  add: "/operations/savelaunchservices",
  delete: "/operations/deletelaunchservices",
  bulkDelete: "/operations/DeleteLaunchServicesBulk",
  getByIdHistory: "/operations/GetLaunchServicesByIdHistory",
}

// Equipment Used Endpoints
export const JobOrder_EquipmentUsed = {
  get: "/operations/getequipmentused",
  getById: "/operations/getequipmentusedbyid",
  add: "/operations/saveequipmentused",
  delete: "/operations/deleteequipmentused",
  bulkDelete: "/operations/DeleteEquipmentUsedBulk",
  getByIdHistory: "/operations/GetEquipmentUsedByIdHistory",
}

// Crew Sign On Endpoints
export const JobOrder_CrewSignOn = {
  get: "/operations/getcrewsignon",
  getById: "/operations/getcrewsignonbyid",
  add: "/operations/savecrewsignon",
  delete: "/operations/deletecrewsignon",
  bulkDelete: "/operations/DeleteCrewSignOnBulk",
  getByIdHistory: "/operations/GetCrewSignOnByIdHistory",
}

// Crew Sign Off Endpoints
export const JobOrder_CrewSignOff = {
  get: "/operations/getcrewsignoff",
  getById: "/operations/getcrewsignoffbyid",
  add: "/operations/savecrewsignoff",
  delete: "/operations/deletecrewsignoff",
  bulkDelete: "/operations/DeleteCrewSignOffBulk",
  getByIdHistory: "/operations/GetCrewSignOffByIdHistory",
}

// Crew Miscellaneous Endpoints
export const JobOrder_CrewMiscellaneous = {
  get: "/operations/getcrewmiscellaneous",
  getById: "/operations/getcrewmiscellaneousbyid",
  add: "/operations/savecrewmiscellaneous",
  delete: "/operations/deletecrewmiscellaneous",
  bulkDelete: "/operations/DeleteCrewMiscellaneousBulk",
  getByIdHistory: "/operations/GetCrewMiscellaneousByIdHistory",
}

// Medical Assistance Endpoints
export const JobOrder_MedicalAssistance = {
  get: "/operations/getmedicalassistance",
  getById: "/operations/getmedicalassistancebyid",
  add: "/operations/savemedicalassistance",
  delete: "/operations/deletemedicalassistance",
  bulkDelete: "/operations/DeleteMedicalAssistanceBulk",
  getByIdHistory: "/operations/GetMedicalAssistanceByIdHistory",
}

// Consignment Import Endpoints
export const JobOrder_ConsignmentImport = {
  get: "/operations/getconsignmentimport",
  getById: "/operations/getconsignmentimportbyid",
  add: "/operations/saveconsignmentimport",
  delete: "/operations/deleteconsignmentimport",
  bulkDelete: "/operations/DeleteConsignmentImportBulk",
  getByIdHistory: "/operations/GetConsignmentImportByIdHistory",
}

// Consignment Export Endpoints
export const JobOrder_ConsignmentExport = {
  get: "/operations/getconsignmentexport",
  getById: "/operations/getconsignmentexportbyid",
  add: "/operations/saveconsignmentexport",
  delete: "/operations/deleteconsignmentexport",
  bulkDelete: "/operations/DeleteConsignmentExportBulk",
  getByIdHistory: "/operations/GetConsignmentExportByIdHistory",
}

// Third Party Endpoints
export const JobOrder_ThirdParty = {
  get: "/operations/getthirdparty",
  getById: "/operations/getthirdpartybyid",
  add: "/operations/savethirdparty",
  delete: "/operations/deletethirdparty",
  bulkDelete: "/operations/DeleteThirdPartyBulk",
  getByIdHistory: "/operations/GetThirdPartyByIdHistory",
}

// Fresh Water Endpoints
export const JobOrder_FreshWater = {
  get: "/operations/getfreshwater",
  getById: "/operations/getfreshwaterbyid",
  add: "/operations/savefreshwater",
  delete: "/operations/deletefreshwater",
  bulkDelete: "/operations/DeleteFreshWaterBulk",
  getByIdHistory: "/operations/GetFreshWaterByIdHistory",
}

// Technicians Surveyors Endpoints
export const JobOrder_TechnicianSurveyor = {
  get: "/operations/gettechniciansurveyor",
  getById: "/operations/gettechniciansurveyorbyid",
  add: "/operations/savetechniciansurveyor",
  delete: "/operations/deletetechniciansurveyor",
  bulkDelete: "/operations/DeleteTechnicianSurveyorBulk",
  getByIdHistory: "/operations/GetTechnicianSurveyorByIdHistory",
}

// Landing Items Endpoints
export const JobOrder_LandingItems = {
  get: "/operations/getlandingitems",
  getById: "/operations/getlandingitemsbyid",
  add: "/operations/savelandingitems",
  delete: "/operations/deletelandingitems",
  bulkDelete: "/operations/DeleteLandingItemsBulk",
  getByIdHistory: "/operations/GetLandingItemsByIdHistory",
}

// Other Service Endpoints
export const JobOrder_OtherService = {
  get: "/operations/getotherservice",
  getById: "/operations/getotherservicebyid",
  add: "/operations/saveotherservice",
  delete: "/operations/deleteotherservice",
  bulkDelete: "/operations/DeleteOtherServiceBulk",
  getByIdHistory: "/operations/GetOtherServiceByIdHistory",
}

// Agency Remuneration Endpoints
export const JobOrder_AgencyRemuneration = {
  get: "/operations/getagencyremuneration",
  getById: "/operations/getagencyremunerationbyid",
  add: "/operations/saveagencyremuneration",
  delete: "/operations/deleteagencyremuneration",
  bulkDelete: "/operations/DeleteAgencyRemunerationBulk",
  getByIdHistory: "/operations/GetAgencyRemunerationByIdHistory",
}

// Reports Endpoints
export const Reports = {
  getPortExpensesReports: "/operations/GetPortExpensesReports",
  getLaunchServiceReports: "/operations/GetLaunchServiceReports",
  getEquipmentUsedReports: "/operations/GetEquipmentUsedReports",
  getCrewSignOnReports: "/operations/GetCrewSignOnReports",
  getCrewSignOffReports: "/operations/GetCrewSignOffReports",
  getCrewMiscellaneousReports: "/operations/GetCrewMiscellaneousReports",
  getMedicalAssistanceReports: "/operations/GetMedicalAssistanceReports",
  getConsignmentImportReports: "/operations/GetConsignmentImportReports",
  getConsignmentExportReports: "/operations/GetConsignmentExportReports",
  getThirdPartyReports: "/operations/GetThirdPartyReports",
  getFreshWaterReports: "/operations/GetFreshWaterReports",
  getTechnicianSurveyorReports: "/operations/GetTechnicianSurveyorReports",
  getLandingItemsReports: "/operations/GetLandingItemsReports",
  getOtherServiceReports: "/operations/GetOtherServiceReports",
  getAgencyRemunerationReports: "/operations/GetAgencyRemunerationReports",
}

// Debit Note Endpoints
export const JobOrder_DebitNote = {
  getById: "/operations/getdebitnotebyid",
  generate: "/operations/generatedebitnote",
  add: "/operations/savedebitnote",
  delete: "/operations/deletedebitnote",
  getDetails: "/operations/getdebitnotedetails",
  saveDetails: "/operations/savedebitnotedetails",
  deleteDetails: "/operations/deletedebitnotedetails",
  getBulkDetails: "/operations/getbulkdetailscharges",
}

// Purchase Endpoints
export const JobOrder_Purchase = {
  getList: "/operations/GetPurchaseList",
  saveBulkList: "/operations/SaveBulkPurchaseList",
}

// Transportation Log Endpoints
export const JobOrder_TransportationLog = {
  get: "/operations/gettransportationlog",
  getById: "/operations/gettransportationlogbyid",
  add: "/operations/savetransportationlog",
  delete: "/operations/deletetransportationlog",
}

// Transportation Log Endpoints (Logistics Module)
export const TransportationLog = {
  get: "/logistics/gettransportation",
  getById: "/logistics/gettransportationbyid",
  add: "/logistics/savetransportation",
  delete: "/logistics/deletetransportation",
}

// Transportation Log Endpoints (Logistics Module)
export const Freight = {
  get: "/logistics/getfreight",
  getById: "/logistics/getfreightbyid",
  add: "/logistics/savefreight",
  delete: "/logistics/deletefreight",
}

// Leave Management Endpoints

export const HrUserRequest = {
  get: "/hr/leave-request",
  add: "/hr/Saveleaverequest",

  getloan: "/hr/loan/getloanrequestbyemployee",
  addloan: "/hr/saveloanrequest",

  getpettycash: "/hr/pettycash-request",
  addpettycash: "/hr/savepettycashrequest",
}

export const HrLeaveRequest = {
  get: "/hr/leave-request/getleaverequest",
  getById: "/hr/leave-request/getleaverequestbyid",
  add: "/hr/leave-request/saveleaverequest",
  update: "/hr/leave-request/saveleaverequest",
  delete: "/hr/leave-request/deleteleaverequest",
  getByEmployee: "/hr/leave-request/employee",
  getByDepartment: "/hr/leave-request/department",
  getByDateRange: "/hr/leave-request/daterangeleave",
  getByStatus: "/hr/leave-request/status",
  getPending: "/hr/leave-request/pendingleaverequest",
  getApproved: "/hr/leave-request/approvedleaverequest",
  getRejected: "/hr/leave-request/rejectedleaverequest",
  bulkAction: "/hr/leave-request/bulk-action",
}

export const HrLeaveBalance = {
  get: "/hr/leave-balance/getleavebalance",
  getById: "/hr/leave-balance/getleavebalancebyid",
  getByEmployee: "/hr/leave-balance/employeeleavebalance",
  add: "/hr/leave-balance/saveleavebalance",
  update: "/hr/leave-balance/saveleavebalance",
  delete: "/hr/leave-balance/deleteleavebalance",
  bulkUpdate: "/hr/leave-balance/bulkupdatleavebalance",
  resetYearly: "/hr/leave-balance/resetyearlyleavebalance",
  summary: "/hr/leave-balance/summaryleavebalance",
}

export const HrLeavePolicy = {
  get: "/hr/leave-policy/getleavepolicy",
  getById: "/hr/leave-policy/getleavepolicybyid",
  add: "/hr/leave-policy/saveleavepolicy",
  update: "/hr/leave-policy/saveleavepolicy",
  delete: "/hr/leave-policy/deleteleavepolicy",
  getByCompany: "/hr/leave-policy/companyleavepolicy",
  getActive: "/hr/leave-policy/activeleavepolicy",
}

export const HrLeaveApproval = {
  get: "/hr/leave-approval/getleaveapproval",
  getById: "/hr/leave-approval/getleaveapprovalbyid",
  getByRequest: "/hr/leave-approval/requestleaveapproval",
  getByApprover: "/hr/leave-approval/approverleaveapproval",
  getPending: "/hr/leave-approval/pendingleaveapproval",
  approve: "/hr/leave-approval/approveleaveapproval",
  reject: "/hr/leave-approval/rejectleaveapproval",
  skip: "/hr/leave-approval/skipleaveapproval",
  cancel: "/hr/leave-approval/cancelleaveapproval",
  getWorkflow: "/hr/leave-approval/workflowleaveapproval",
}

export const Approval = {
  get: "/approval/my-requests",
  getPending: "/approval/pending-approvals",
  getRequestDetail: "/approval/request-detail",
  takeAction: "/approval/take-action",
  getCounts: "/approval/counts",
}

// Payroll Management Endpoints
export const SalaryComponent = {
  getById: "/hr/getsalarycomponentbyid",
  getHistoryById: "/hr/getsalarycomponenthistorybyid",
  add: "/hr/savesalarycomponent",
  getSalary: "/hr/getsalarycomponent",
}

export const PayrollComponent = {
  get: "/hr/setting/getcomponent",
  getSalary: "/hr/setting/getsalarycomponent",
  getById: "/hr/setting/getcomponentbyid",
  add: "/hr/setting/savecomponent",
  update: "/hr/setting/savecomponent",
  delete: "/hr/setting/deletecomponent",
  getByType: "/hr/setting/typecomponent",
  getActive: "/hr/setting/activecomponent",
}

export const PayrollComponentGLMapping = {
  get: "/hr/setting/getcomponentglmapping",
  getById: "/hr/setting/getcomponentglmappingbyid",
  add: "/hr/setting/savecomponentglmapping",
  update: "/hr/setting/savecomponentglmapping",
  delete: "/hr/setting/deletecomponentglmapping",
}

export const HrLoan = {
  //Get DashBoard loan
  getActive: "/hr/loan/active",
  getActiveClosed: "/hr/loan/active_close",
  getHistory: "/hr/loan/all",
  getPending: "/hr/loan/pending",
  getLoanDetails: "/hr/loan/getloandetails",
  getLoanDashboard: "/hr/loan/loan-dashboard",

  //Employee Loan Endpoints
  getEmployee: "/hr/loan/employee",
  getDisbursement: "/hr/loan/disbursement",
  getSkipRequest: "/hr/loan/skiprequest",
  getApprovedRequest: "/hr/loan/approvedloan",
  getRejectedRequest: "/hr/loan/rejectedloan",
  getByDateRange: "/hr/loan/daterangeloan",
  getByStatus: "/hr/loan/status",
  get: "/hr/loan/getloan",
  getById: "/hr/loan/getloanbyid",
  add: "/hr/loan/saveloan",
  update: "/hr/loan/saveloan",
  delete: "/hr/loan/deleteloan",
}

// Inquiry Endpoints
export const Inquiry = {
  getCustomerInquiry: "/inquiry/GetCustomerInquiry",
  getChecklistInquiry: "/inquiry/GetChecklistInquiry",
  getGlTransactionInquiry: "/inquiry/GetGlTransactionInquiry",
  getArTransactionInquiry: "/inquiry/GetArTransactionInquiry",
  getApTransactionInquiry: "/inquiry/GetApTransactionInquiry",
  getInvalidTransactionInquiry: "/inquiry/GetInvalidTransactionInquiry",
}
