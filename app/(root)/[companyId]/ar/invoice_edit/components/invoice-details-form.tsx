"use client"

import {
  IBargeLookup,
  IChartOfAccountLookup,
  IDepartmentLookup,
  IEmployeeLookup,
  IGstLookup,
  IProductLookup,
} from "@/interfaces/lookup"
import { ArInvoiceDtSchemaType } from "@/schemas/invoice"
import { useAuthStore } from "@/stores/auth-store"
import { FormProvider, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  BargeAutocomplete,
  ChartOfAccountAutocomplete,
  DepartmentAutocomplete,
  EmployeeAutocomplete,
  GSTAutocomplete,
  ProductAutocomplete,
} from "@/components/autocomplete"
import CustomNumberInput from "@/components/custom/custom-number-input"
import CustomTextarea from "@/components/custom/custom-textarea"

export default function InvoiceDetailsForm() {
  const { decimals } = useAuthStore()
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2

  const form = useForm<ArInvoiceDtSchemaType>({
    defaultValues: {
      invoiceId: "0",
      invoiceNo: "",
      itemNo: 1,
      seqNo: 1,
      docItemNo: 0,
      productId: 0,
      glId: 0,
      qty: 0,
      billQTY: 0,
      uomId: 0,
      unitPrice: 0,
      totAmt: 0,
      totLocalAmt: 0,
      totCtyAmt: 0,
      remarks: "",
      gstId: 0,
      gstPercentage: 0,
      gstAmt: 0,
      gstLocalAmt: 0,
      gstCtyAmt: 0,
      deliveryDate: null,
      departmentId: 0,
      employeeId: 0,
      portId: 0,
      vesselId: 0,
      bargeId: 0,
      voyageId: 0,
      operationId: null,
      operationNo: null,
      opRefNo: null,
      salesOrderId: null,
      salesOrderNo: null,
      supplyDate: null,
      supplierName: null,
      suppInvoiceNo: null,
      apInvoiceId: null,
      apInvoiceNo: null,
      editVersion: 0,
    },
  })

  const onSubmit = (_data: ArInvoiceDtSchemaType) => {
    // Handle form submission
  }

  // Handle product selection
  const handleProductChange = (selectedOption: IProductLookup | null) => {
    if (selectedOption) {
      form.setValue("productId", selectedOption.productId)
    }
  }

  // Handle department selection
  const handleDepartmentChange = (selectedOption: IDepartmentLookup | null) => {
    if (selectedOption) {
      form.setValue("departmentId", selectedOption.departmentId)
    }
  }

  // Handle employee selection
  const handleEmployeeChange = (selectedOption: IEmployeeLookup | null) => {
    if (selectedOption) {
      form.setValue("employeeId", selectedOption.employeeId)
    }
  }

  // Handle barge selection
  const handleBargeChange = (selectedOption: IBargeLookup | null) => {
    if (selectedOption) {
      form.setValue("bargeId", selectedOption.bargeId)
    }
  }

  // Handle chart of account selection
  const handleChartOfAccountChange = (
    selectedOption: IChartOfAccountLookup | null
  ) => {
    if (selectedOption) {
      form.setValue("glId", selectedOption.glId)
    }
  }

  // Handle GST selection
  const handleGSTChange = (selectedOption: IGstLookup | null) => {
    if (selectedOption) {
      form.setValue("gstId", selectedOption.gstId)
      form.setValue("gstPercentage", selectedOption.gstPercentage)

      // Recalculate GST amounts
      const totAmt = form.getValues("totAmt") || 0
      const totLocalAmt = form.getValues("totLocalAmt") || 0
      const gstPercentage = selectedOption.gstPercentage || 0

      const gstAmt = (totAmt * gstPercentage) / 100
      const gstLocalAmt = (totLocalAmt * gstPercentage) / 100

      form.setValue("gstAmt", gstAmt)
      form.setValue("gstLocalAmt", gstLocalAmt)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Details (New)</h2>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-7 gap-2 rounded-md p-4"
        >
          {/* Product */}
          <ProductAutocomplete
            form={form}
            name="productId"
            label="Product"
            isRequired={true}
            onChangeEvent={handleProductChange}
          />

          {/* Department */}
          <DepartmentAutocomplete
            form={form}
            name="departmentId"
            label="Department"
            isRequired={true}
            onChangeEvent={handleDepartmentChange}
          />

          {/* Employee */}
          <EmployeeAutocomplete
            form={form}
            name="employeeId"
            label="Employee"
            isRequired={true}
            onChangeEvent={handleEmployeeChange}
          />

          {/* Barge */}
          <BargeAutocomplete
            form={form}
            name="bargeId"
            label="Barge"
            isRequired={true}
            onChangeEvent={handleBargeChange}
          />

          {/* Chart Of Account */}
          <ChartOfAccountAutocomplete
            form={form}
            name="glId"
            label="Chart Of Account"
            isRequired={true}
            onChangeEvent={handleChartOfAccountChange}
          />

          {/* Total Amount */}
          <CustomNumberInput
            form={form}
            name="totAmt"
            label="Total Amount"
            round={amtDec}
            className="text-right"
          />

          {/* Local Amount */}
          <CustomNumberInput
            form={form}
            name="totLocalAmt"
            label="Total Local Amount"
            round={locAmtDec}
            className="text-right"
          />

          {/* GST */}
          <GSTAutocomplete
            form={form}
            name="gstId"
            label="VAT"
            isRequired={true}
            onChangeEvent={handleGSTChange}
          />

          {/* GST Percentage */}
          <CustomNumberInput
            form={form}
            name="gstPercentage"
            label="VAT Percentage"
            round={amtDec}
            className="text-right"
          />

          {/* GST Amount */}
          <CustomNumberInput
            form={form}
            name="gstAmt"
            label="VAT Amount"
            round={amtDec}
            isDisabled
            className="text-right"
          />

          {/* GST Local Amount */}
          <CustomNumberInput
            form={form}
            name="gstLocalAmt"
            label="VAT Local Amount"
            round={locAmtDec}
            isDisabled
            className="text-right"
          />

          {/* Remarks */}
          <CustomTextarea
            form={form}
            name="remarks"
            label="Remarks"
            className="col-span-2"
            minRows={2}
            maxRows={6}
          />

          {/* Action buttons */}
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => form.reset()}
            >
              New
            </Button>
            <Button type="submit" size="sm" className="ml-auto">
              Add
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  )
}
