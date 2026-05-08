"use client"

import { useCompanyStore } from "@/stores/company-store"

import { ArDebitNoteHdSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"
import AccountDetails from "./history/account-details"
import EditVersionDetails from "./history/edit-version-details"
import GLPostDetails from "./history/gl-post-details"
import PaymentDetails from "./history/payment-details"

interface HistoryProps {
  form: UseFormReturn<ArDebitNoteHdSchemaType>
  isEdit: boolean
}

export default function History({ form, isEdit: _isEdit }: HistoryProps) {
  const { decimals } = useCompanyStore()
  const _dateFormat = decimals[0]?.dateFormat || "yyyy-MM-dd"

  const accountDetails = {
    createBy: form.getValues().createBy || "", // Default value since createBy doesn't exist in form schema
    createDate: form.getValues().createDate || "", // Default value since createDate doesn't exist in form schema
    editBy: form.getValues().editBy || "", // Default value since editBy doesn't exist in form schema
    editDate: form.getValues().editDate || "", // Default value since editDate doesn't exist in form schema
    cancelBy: form.getValues().cancelBy || "", // Default value since cancelBy doesn't exist in form schema
    cancelDate: form.getValues().cancelDate || "", // Default value since cancelDate doesn't exist in form schema
    balanceAmt: Number(form.getValues().balAmt || 0),
    balanceBaseAmt: Number(form.getValues().balLocalAmt || 0),
    paymentAmt: Number(form.getValues().payAmt || 0),
    paymentBaseAmt: Number(form.getValues().payLocalAmt || 0),
  }

  return (
    <div className="divide-y divide-border/60 pb-1">
      <AccountDetails {...accountDetails} />
      <PaymentDetails debitNoteId={form.getValues().debitNoteId || ""} />
      <GLPostDetails debitNoteId={form.getValues().debitNoteId || ""} />
      <EditVersionDetails debitNoteId={form.getValues().debitNoteId || ""} />
    </div>
  )
}
