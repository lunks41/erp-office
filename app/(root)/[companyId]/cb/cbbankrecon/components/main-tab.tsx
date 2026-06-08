"use client"

import { useCompanyStore } from "@/stores/company-store"
// main-tab.tsx - Bank Reconciliation

import { useEffect } from "react"
import {
  calculateClosingBalance,
  calculateTotalAmounts,
} from "@/helpers/cb-bankrecon-calculations"
import { ICbBankReconDt } from "@/interfaces"
import { IMandatoryFields, IVisibleFields } from "@/interfaces/setting"
import { CbBankReconDtSchemaType, CbBankReconHdSchemaType } from "@/schemas"
import { UseFormReturn } from "react-hook-form"
import BankReconDetailsTable from "./cbbankrecon-details-table"
import BankReconForm from "./cbbankrecon-form"

interface MainProps {
  form: UseFormReturn<CbBankReconHdSchemaType>
  onRefreshAction: () => Promise<void>
  isEdit: boolean
  visible: IVisibleFields
  required: IMandatoryFields
  companyId: number
}

export default function Main({
  form,
  onRefreshAction,
  isEdit,
  visible,
  required,
  companyId,
}: MainProps) {
  const { decimals } = useCompanyStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2

  // Watch data_details for reactive updates
  const dataDetails = form.watch("data_details") || []
  const opBalAmt = form.watch("opBalAmt") ?? 0
  const debitTotAmt = form.watch("debitTotAmt") ?? 0
  const creditTotAmt = form.watch("creditTotAmt") ?? 0

  // Recalculate header totals when details change
  useEffect(() => {
    if (dataDetails.length === 0) {
      // Reset all amounts to 0 if no details
      form.setValue("totAmt", 0)
      form.setValue("debitTotAmt", 0)
      form.setValue("creditTotAmt", 0)
      form.setValue("allocTotAmt", 0)
      form.setValue("unAllocTotAmt", 0)
      return
    }

    // Calculate base currency totals and debit/credit
    const totals = calculateTotalAmounts(
      dataDetails as unknown as ICbBankReconDt[],
      amtDec,
      locAmtDec
    )
    form.setValue("totAmt", totals.totAmt)
    form.setValue("debitTotAmt", totals.debitTotAmt)
    form.setValue("creditTotAmt", totals.creditTotAmt)
    form.setValue("allocTotAmt", totals.allocTotAmt)
    form.setValue("unAllocTotAmt", totals.unAllocTotAmt)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataDetails, amtDec, locAmtDec])

  // Keep closing balance in sync with opening balance and detail totals
  useEffect(() => {
    form.setValue(
      "clBalAmt",
      calculateClosingBalance(opBalAmt, debitTotAmt, creditTotAmt, amtDec)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opBalAmt, debitTotAmt, creditTotAmt, amtDec])

  const handleDelete = (itemNo: number) => {
    const currentData = form.getValues("data_details") || []
    const filteredData = currentData.filter((item) => item.itemNo !== itemNo)

    form.setValue(
      "data_details",
      filteredData as unknown as CbBankReconDtSchemaType[],
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    )
    form.trigger("data_details")
  }

  const handleBulkDelete = (selectedItemNos: number[]) => {
    const currentData = form.getValues("data_details") || []
    const filteredData = currentData.filter(
      (item) => !selectedItemNos.includes(item.itemNo ?? 0)
    )

    form.setValue(
      "data_details",
      filteredData as unknown as CbBankReconDtSchemaType[],
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    )
    form.trigger("data_details")
  }

  const handleDataReorder = (newData: ICbBankReconDt[]) => {
    form.setValue(
      "data_details",
      newData as unknown as CbBankReconDtSchemaType[],
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    )
  }

  const handleCellUpdate = (
    itemNo: number,
    field: keyof ICbBankReconDt,
    value: string | Date | boolean
  ) => {
    const currentData = form.getValues("data_details") || []
    const updated = currentData.map((item) =>
      item.itemNo === itemNo ? { ...item, [field]: value } : item
    )

    form.setValue(
      "data_details",
      updated as unknown as CbBankReconDtSchemaType[],
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    )
    form.trigger("data_details")
  }

  const handleSelectAll = (selected: boolean) => {
    const currentData = form.getValues("data_details") || []
    const updated = currentData.map((item) => ({ ...item, isSel: selected }))

    form.setValue(
      "data_details",
      updated as unknown as CbBankReconDtSchemaType[],
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      }
    )
    form.trigger("data_details")
  }

  return (
    <div className="w-full space-y-4">
      <BankReconForm
        form={form}
        onRefreshAction={onRefreshAction}
        isEdit={isEdit}
        visible={visible}
        required={required}
        companyId={companyId}
      />

      <BankReconDetailsTable
        data={dataDetails as unknown as ICbBankReconDt[]}
        onDeleteAction={handleDelete}
        onBulkDeleteAction={handleBulkDelete}
        onDataReorder={handleDataReorder}
        onCellUpdate={handleCellUpdate}
        onSelectAllAction={handleSelectAll}
        visible={visible}
      />
    </div>
  )
}
