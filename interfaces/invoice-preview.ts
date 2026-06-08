export interface IInvoicePreviewHeader {
  result?: number
  errorMessage?: string
  invoiceNo?: string
  invoiceId?: number
  sourceId?: number
  sourceType?: string
  referenceNo?: string
  accountDate?: string
  trnDate?: string
  customerId?: number
  customerCode?: string
  customerName?: string
  currencyId?: number
  currencyCode?: string
  exhRate?: number
  gstId?: number
  gstPercentage?: number
  isTaxable?: boolean
  billName?: string
  address1?: string
  address2?: string
  address3?: string
  address4?: string
  pinCode?: string
  phoneNo?: string
  countryName?: string
  customerRegNo?: string
  currencyName?: string
  refNo?: string
  vesselId?: number
  vesselName?: string
  portId?: number
  portName?: string
  totAmt?: number
  gstAmt?: number
  totAmtAftGst?: number
  totLocalAmt?: number
  gstLocalAmt?: number
  totLocalAmtAftGst?: number
  existingInvoiceId?: number
}

export interface IInvoicePreviewLine {
  itemNo?: number
  chargeId?: number
  chargeName?: string
  glCode?: string
  glName?: string
  qty?: number
  unitPrice?: number
  totAmt?: number
  gstAmt?: number
  totAmtAftGst?: number
  remarks?: string
  debitNoteNo?: string
}

export interface IInvoicePreview {
  header: IInvoicePreviewHeader
  lines: IInvoicePreviewLine[]
  previewKey?: string
}
