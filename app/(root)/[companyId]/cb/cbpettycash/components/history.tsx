"use client"

import { CbPettyCashHdSchemaType } from "@/schemas"
import { useAuthStore } from "@/stores/auth-store"
import { UseFormReturn } from "react-hook-form"

import AccountDetails from "./history/account-details"
import EditVersionDetails from "./history/edit-version-details"
import GLPostDetails from "./history/gl-post-details"

interface HistoryProps {
  form: UseFormReturn<CbPettyCashHdSchemaType>
  isEdit: boolean
}

export default function History({ form, isEdit: _isEdit }: HistoryProps) {
  const { decimals } = useAuthStore()
  const _dateFormat = decimals[0]?.dateFormat || "yyyy-MM-dd"

  const accountDetails = {
    createBy: form.getValues().createBy || "", // Default value since createBy doesn't exist in form schema
    createDate: form.getValues().createDate || "", // Default value since createDate doesn't exist in form schema
    editBy: form.getValues().editBy || "", // Default value since editBy doesn't exist in form schema
    editDate: form.getValues().editDate || "", // Default value since editDate doesn't exist in form schema
    cancelBy: form.getValues().cancelBy || "", // Default value since cancelBy doesn't exist in form schema
    cancelDate: form.getValues().cancelDate || "", // Default value since cancelDate doesn't exist in form schema
    appBy: form.getValues().appBy || "", // Default value since appBy doesn't exist in form schema
    appDate: form.getValues().appDate || "", // Default value since appDate doesn't exist in form schema
  }

  return (
    <div className="divide-y divide-border/60 pb-1">
      <AccountDetails {...accountDetails} />
      <GLPostDetails paymentId={form.getValues().paymentId || ""} />
      <EditVersionDetails paymentId={form.getValues().paymentId || ""} />
    </div>
  )
}
