export interface IBank {
  bankId: number
  companyId: number
  bankCode: string
  bankName: string
  currencyId: number
  currencyCode: string
  currencyName: string
  accountNo: string
  swiftCode: string
  iban: string
  remarks1: string
  remarks2: string
  remarks3: string
  glId: number
  isOwnBank: boolean
  isPettyCashBank: boolean
  isActive: boolean
  createById: number
  editById: number
  createBy: string
  editBy: string | null
  createDate: Date | string
  editDate: Date | string
}

export interface IBankFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IBankContact {
  contactId: number
  bankId: number
  bankCode: string
  bankName: string
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

export interface IBankContactFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}

export interface IBankAddress {
  bankId: number
  billName: string
  bankCode: string
  bankName: string
  addressId: number
  address1: string
  address2: string
  address3: string
  address4: string
  pinCode: string
  countryId: number
  countryCode: string
  countryName: string
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

export interface IBankAddressFilter {
  isActive?: boolean
  search?: string
  sortOrder?: "asc" | "desc"
}
