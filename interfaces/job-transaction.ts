/**
 * Job transaction row as returned from API (e.g. AP invoice details with job info).
 * Matches the grid: ModuleId, TransactionId, InvoiceId, ItemNo, SeqNo, InvoiceNo,
 * AccountDate, SuppInvoiceNo, SupplierName, JobOrderId, JobOrderNo, TaskId, TaskName,
 * ServiceItemNo, ServiceName, Remarks.
 */
export interface IJobTransaction {
  moduleId: number
  transactionId: number
  invoiceId: string
  itemNo: number
  seqNo: number
  invoiceNo: string
  accountDate: string
  suppInvoiceNo: string
  supplierName: string
  jobOrderId: number
  jobOrderNo: string
  taskId: number
  taskName: string
  serviceItemNo: number
  serviceName: string
  remarks: string
}

/** Payload for updating a job transaction (editable fields only). */
export interface IJobTransactionUpdate {
  moduleId: number
  transactionId: number
  invoiceId: string
  itemNo: number
  seqNo: number
  jobOrderId: number
  taskId: number
  serviceItemNo: number
  remarks: string
}
