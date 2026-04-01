"use client"

import { useCallback, useEffect } from "react"
import { IJobTransaction } from "@/interfaces"
import { IPurchaseData } from "@/interfaces/checklist"
import {
  IJobOrderLookup,
  IServiceItemNoLookup,
  ITaskLookup,
} from "@/interfaces/lookup"
import {
  JobTransactionUpdateSchema,
  JobTransactionUpdateSchemaType,
} from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { ApJobTransaction } from "@/lib/api-routes"
import { useGetJobOrderByIdNo } from "@/hooks/use-checklist"
import { useGet, usePersist } from "@/hooks/use-common"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DynamicJobOrderAutocomplete,
  JobOrderServiceAutocomplete,
  JobOrderTaskAutocomplete,
} from "@/components/autocomplete"

interface PurchaseJobTransactionRow
  extends Omit<
    IPurchaseData,
    "seqNo" | "jobOrderId" | "taskId" | "serviceItemNo"
  > {
  seqNo?: number
  jobOrderId?: number
  jobOrderNo?: string
  taskId?: number
  taskName?: string
  serviceItemNo?: number
  serviceName?: string
  invoiceId?: string
}

interface PurchaseJobTransactionFormProps {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  row: PurchaseJobTransactionRow | null
  onSuccessAction: () => void
}

const JobTransactionFormSchema = JobTransactionUpdateSchema.extend({
  jobOrderNo: z.string().optional(),
  taskName: z.string().optional(),
  serviceItemNoName: z.string().optional(),
  documentNo: z.string().optional(),
  suppInvoiceNo: z.string().optional(),
  accountDate: z.string().optional(),
})

type FormValues = z.infer<typeof JobTransactionFormSchema>

export function JobTransactionForm({
  open,
  onOpenChangeAction,
  row,
  onSuccessAction,
}: PurchaseJobTransactionFormProps) {
  const updateMutation = usePersist<JobTransactionUpdateSchemaType>(
    ApJobTransaction.update
  )

  const { data: transactionResponse } = useGet<IJobTransaction>(
    ApJobTransaction.getList,
    `job-transaction-${row?.documentNo ?? ""}-${row?.itemNo}`,
    row?.documentNo ? String(row.documentNo) : "",
    {
      enabled: open && !!row?.documentNo,
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: "always",
    }
  )
  const { data: jobOrderResponse } = useGetJobOrderByIdNo(
    row?.jobOrderId ? String(row.jobOrderId) : ""
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(JobTransactionFormSchema),
    defaultValues: {
      moduleId: 0,
      transactionId: 0,
      invoiceId: "",
      itemNo: 0,
      seqNo: 0,
      jobOrderId: 0,
      jobOrderNo: "",
      taskId: 0,
      taskName: "",
      serviceItemNo: 0,
      serviceItemNoName: "",
      remarks: "",
      documentNo: "",
      suppInvoiceNo: "",
      accountDate: "",
    },
  })

  const watchedJobOrderId = form.watch("jobOrderId")
  const watchedTaskId = form.watch("taskId")
  const transactionData =
    transactionResponse?.result === 1 && Array.isArray(transactionResponse.data)
      ? (transactionResponse.data.find(
          (item) =>
            item.itemNo === row?.itemNo &&
            (item.invoiceId === row?.documentId ||
              item.invoiceNo === row?.documentNo)
        ) ?? null)
      : null

  const handleJobOrderChange = useCallback(
    (selectedOption: IJobOrderLookup | null) => {
      if (selectedOption) {
        form.setValue("jobOrderId", selectedOption.jobOrderId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("jobOrderNo", selectedOption.jobOrderNo || "")
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        form.setValue("jobOrderId", 0, { shouldValidate: true })
        form.setValue("jobOrderNo", "")
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    },
    [form]
  )

  const handleTaskChange = useCallback(
    (selectedOption: ITaskLookup | null) => {
      if (selectedOption) {
        form.setValue("taskId", selectedOption.taskId, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue("taskName", selectedOption.taskName || "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      } else {
        form.setValue("taskId", 0, { shouldValidate: true })
        form.setValue("taskName", "")
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    },
    [form]
  )

  const handleServiceChange = useCallback(
    (selectedOption: IServiceItemNoLookup | null) => {
      if (selectedOption) {
        form.setValue("serviceItemNo", selectedOption.serviceItemNo, {
          shouldValidate: true,
          shouldDirty: true,
        })
        form.setValue(
          "serviceItemNoName",
          selectedOption.serviceItemNoName || ""
        )
      } else {
        form.setValue("serviceItemNo", 0, { shouldValidate: true })
        form.setValue("serviceItemNoName", "")
      }
    },
    [form]
  )

  useEffect(() => {
    if (open && row) {
      const sourceRow = transactionData ?? row
      const accountDateDisplay = sourceRow.accountDate
        ? new Date(sourceRow.accountDate).toLocaleDateString()
        : ""

      const invoiceIdStr = String(
        "documentId" in sourceRow
          ? sourceRow.documentId
          : (sourceRow.invoiceId ?? "")
      )
      const documentNoStr =
        "documentNo" in sourceRow
          ? sourceRow.documentNo || ""
          : sourceRow.invoiceNo || ""

      form.reset({
        moduleId: sourceRow.moduleId,
        transactionId: sourceRow.transactionId,
        invoiceId: invoiceIdStr,
        itemNo: sourceRow.itemNo,
        seqNo: sourceRow.seqNo,
        jobOrderId: sourceRow.jobOrderId,
        jobOrderNo: sourceRow.jobOrderNo || "",
        taskId: sourceRow.taskId ?? 0,
        taskName: sourceRow.taskName || "",
        serviceItemNo: sourceRow.serviceItemNo ?? 0,
        serviceItemNoName: sourceRow.serviceName || "",
        remarks: sourceRow.remarks || "",
        documentNo: documentNoStr,
        suppInvoiceNo: sourceRow.suppInvoiceNo || "",
        accountDate: accountDateDisplay,
      })
    }
  }, [open, row, transactionData, form])

  useEffect(() => {
    if (!open) return

    const jobOrderNo =
      row?.jobOrderNo ||
      jobOrderResponse?.data?.jobOrderNo ||
      jobOrderResponse?.data?.invoiceNo ||
      ""

    if (jobOrderNo) {
      form.setValue("jobOrderNo", jobOrderNo)
    }
  }, [open, row?.jobOrderNo, jobOrderResponse, form])

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const payload: JobTransactionUpdateSchemaType = {
        moduleId: values.moduleId,
        transactionId: values.transactionId,
        invoiceId: values.invoiceId,
        itemNo: values.itemNo,
        seqNo: values.seqNo,
        jobOrderId: values.jobOrderId,
        taskId: values.taskId,
        serviceItemNo: values.serviceItemNo,
        remarks: values.remarks ?? "",
      }

      try {
        const response = await updateMutation.mutateAsync(payload)
        if (response.result === 1) {
          onSuccessAction()
          onOpenChangeAction(false)
        }
      } catch {
        // usePersist handles toast on error
      }
    },
    [updateMutation, onSuccessAction, onOpenChangeAction]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Job Transaction</DialogTitle>
          <DialogDescription>
            Update Job Order, Task, Service and Remarks for this purchase line.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="job-transaction-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1"
          >
            <FormField
              control={form.control}
              name="documentNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document No</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="suppInvoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supp Invoice No</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accountDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DynamicJobOrderAutocomplete
              form={form}
              name="jobOrderId"
              label="Job Order"
              onChangeEvent={handleJobOrderChange}
            />
            <JobOrderTaskAutocomplete
              key={`task-${watchedJobOrderId}`}
              form={form}
              name="taskId"
              jobOrderId={watchedJobOrderId || 0}
              label="Task"
              onChangeEvent={handleTaskChange}
            />
            <JobOrderServiceAutocomplete
              key={`service-${watchedJobOrderId}-${watchedTaskId}`}
              form={form}
              name="serviceItemNo"
              jobOrderId={watchedJobOrderId || 0}
              taskId={watchedTaskId || 0}
              label="Service"
              onChangeEvent={handleServiceChange}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Remarks"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChangeAction(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="job-transaction-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
