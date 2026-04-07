"use client"

import { CbBankTransferCtmHdSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"

import AccountDetails from "./history/account-details"
import EditVersionDetails from "./history/edit-version-details"
import GLPostDetails from "./history/gl-post-details"

interface HistoryProps {
  form: UseFormReturn<CbBankTransferCtmHdSchemaType>
  isEdit: boolean
}

export default function History({ form, isEdit: _isEdit }: HistoryProps) {
  const formValues = form.getValues()

  // Convert dates to strings if they are Date objects
  const formatDateToString = (
    date: string | Date | null | undefined
  ): string => {
    if (!date) return ""
    if (date instanceof Date) {
      return date.toISOString()
    }
    return String(date)
  }

  const accountDetails = {
    createBy: formValues.createBy || "",
    createDate: formatDateToString(formValues.createDate),
    editBy: formValues.editBy || "",
    editDate: formatDateToString(formValues.editDate),
    cancelBy: formValues.cancelBy || "",
    cancelDate: formatDateToString(formValues.cancelDate),
    appBy: formValues.appBy || "",
    appDate: formatDateToString(formValues.appDate),
  }

  return (
    <div className="divide-y divide-border/60 pb-1">
      <AccountDetails {...accountDetails} />
      <GLPostDetails transferId={form.getValues().transferId || ""} />
      <EditVersionDetails transferId={form.getValues().transferId || ""} />
    </div>
  )
}
