"use client"

import { ApPaymentHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { UseFormReturn } from "react-hook-form"

import AccountDetails from "./history/account-details"
import EditVersionDetails from "./history/edit-version-details"
import GLPostDetails from "./history/gl-post-details"
import PaymentDetails from "./history/payment-details"

interface HistoryProps {
  form: UseFormReturn<ApPaymentHdSchemaType>
  isEdit: boolean
}

export default function History({ form, isEdit: _isEdit }: HistoryProps) {
  console.log("form values", form.getValues())
  const { decimals } = useAuthStore()
  const _dateFormat = decimals[0]?.dateFormat || "yyyy-MM-dd"

  const formValues = form.getValues()
  const accountDetails = {
    createBy: formValues.createBy || "",
    createDate: (formValues.createDate || "").toString(),
    editBy: formValues.editBy || "",
    editDate: formValues.editDate ? formValues.editDate?.toString() : "",
    cancelBy: formValues.cancelBy || "",
    cancelDate: formValues.cancelDate ? formValues.cancelDate?.toString() : "",
    appBy: formValues.appBy || "",
    appDate: formValues.appDate ? formValues.appDate?.toString() : "",
  }

  return (
    <div className="divide-y divide-border/60 pb-1">
      <AccountDetails {...accountDetails} />
      <PaymentDetails paymentId={form.getValues().paymentId || ""} />
      <GLPostDetails paymentId={form.getValues().paymentId || ""} />
      <EditVersionDetails paymentId={form.getValues().paymentId || ""} />
    </div>
  )
}
