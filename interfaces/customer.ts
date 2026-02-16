export interface ICustomer {
  customerId: number
  companyId: number
  customerCode: string
  customerName: string
  customerOtherName: string
  customerShortName: string
  customerRegNo: string
  currencyId: number
  currencyCode: string
  currencyName: string
  bankId: number
  bankCode: string
  bankName: string
  creditTermId: number
  creditTermCode: string
  creditTermName: string
  parentCustomerId: number
  parentCustomerCode: string
  parentCustomerName: string
  accSetupId: number
  accSetupCode: string
  accSetupName: string
  supplierId: number
  supplierCode: string
  supplierName: string
  isCustomer: boolean
  isVendor: boolean
  isTrader: boolean
  isSupplier: boolean
  isCredit: boolean
  remarks: string
  isActive: boolean
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}
export interface ICustomerFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ICustomerContact {
  contactId: number
  customerId: number
  customerCode: string
  customerName: string
  contactName: string
  otherName: string
  mobileNo: string
  offNo: string
  faxNo: string
  emailAdd: string
  messId: string
  contactMessType: string
  isDefault: boolean
  isFinance: boolean
  isSales: boolean
  isActive: boolean
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface ICustomerContactFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface ICustomerAddress {
  customerId: number
  addressId: number
  billName: string
  address1: string
  address2: string
  address3: string
  address4: string
  pinCode: string
  countryId: number
  phoneNo: string
  faxNo: string
  emailAdd: string
  webUrl: string
  isDefaultAdd: boolean
  isDeliveryAdd: boolean
  isFinAdd: boolean
  isSalesAdd: boolean
  isActive: boolean
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface ICustomerAddressFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}
