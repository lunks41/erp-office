"use client"

// main-tab.tsx - IMPROVED VERSION

import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankTransferSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"

import BankTransferForm from "./cbbanktransfer-form"

interface MainProps {
  form: UseFormReturn<CbBankTransferSchemaType>
  onSuccessAction: (action: string) => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
}

export default function Main({
  form,
  onSuccessAction,
  isEdit,
  visible,
  required,
  companyId,
}: MainProps) {
  return (
    <div className="w-full">
      <BankTransferForm
        form={form}
        onSuccessAction={onSuccessAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
      />
    </div>
  )
}
