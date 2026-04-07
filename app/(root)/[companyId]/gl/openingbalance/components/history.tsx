"use client"

import { IGLOpeningBalance } from "@/interfaces"
import { GLOpeningBalanceSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"

interface HistoryProps {
  form: UseFormReturn<GLOpeningBalanceSchemaType>
  isEdit: boolean
}

export default function History({ form, isEdit: _isEdit }: HistoryProps) {
  const _accountDetails = {
    createBy:
      (form.getValues() as IGLOpeningBalance).createById?.toString() || "",
    createDate: (form.getValues() as IGLOpeningBalance).createDate || "",
    editBy: (form.getValues() as IGLOpeningBalance).editById
      ? (form.getValues() as IGLOpeningBalance).editById!.toString()
      : "",
    editDate: (form.getValues() as IGLOpeningBalance).editDate || "",
    cancelBy: "",
    cancelDate: "",
  }

  return <div className="divide-y divide-border/60 pb-1"></div>
}
