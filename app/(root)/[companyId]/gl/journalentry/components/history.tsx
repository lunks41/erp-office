"use client"

import { GLJournalHdSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"

import AccountDetails from "./history/account-details"
import EditVersionDetails from "./history/edit-version-details"
import GLPostDetails from "./history/gl-post-details"

interface HistoryProps {
  form: UseFormReturn<GLJournalHdSchemaType>
  isEdit: boolean
}

export default function History({ form, isEdit: _isEdit }: HistoryProps) {
  const accountDetails = {
    createBy: form.getValues().createBy || "",
    createDate: form.getValues().createDate || "",
    editBy: form.getValues().editBy || "",
    editDate: form.getValues().editDate || "",
    cancelBy: form.getValues().cancelBy || "",
    cancelDate: form.getValues().cancelDate || "",
  }

  return (
    <div className="divide-y divide-border/60 pb-1">
      <AccountDetails {...accountDetails} />
      <GLPostDetails journalId={form.getValues().journalId || ""} />
      <EditVersionDetails journalId={form.getValues().journalId || ""} />
    </div>
  )
}
