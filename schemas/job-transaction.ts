import * as z from "zod"

/** Schema for updating a job transaction. Only editable fields. */
export const JobTransactionUpdateSchema = z.object({
  moduleId: z.number(),
  transactionId: z.number(),
  invoiceId: z.string(),
  itemNo: z.number(),
  seqNo: z.number(),
  jobOrderId: z.number().min(0, "Job Order is required"),
  taskId: z.number().min(0, "Task is required"),
  serviceItemNo: z.number().min(0, "Service is required"),
  remarks: z.string().optional(),
})

export type JobTransactionUpdateSchemaType = z.infer<
  typeof JobTransactionUpdateSchema
>
