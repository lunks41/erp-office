"use client"

import { useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import { IMandatoryFields } from "@/interfaces/setting"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  useMandatoryFieldSave,
  useMandatoryFieldbyidGet,
} from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { ModuleAutocomplete } from "@/components/autocomplete"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { SettingTable } from "@/components/table/table-setting"

export function MandatoryTable() {
  const form = useForm()
  const [selectedModule, setSelectedModule] = useState<{
    moduleId: number
    moduleName: string
  } | null>(null)
  const [mandatoryFields, setMandatoryFields] = useState<IMandatoryFields[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  // Fetch mandatory fields for selected module
  const {
    data: mandatoryFieldsResponse,
    refetch: refetchMandatoryFields,
    isFetching: isFieldsLoading,
  } = useMandatoryFieldbyidGet(selectedModule?.moduleId || 0)

  // Save mandatory fields mutation
  const mandatoryFieldSave = useMandatoryFieldSave()

  // Update mandatoryFields when mandatoryFieldsResponse changes
  useEffect(() => {
    if (mandatoryFieldsResponse) {
      const response = mandatoryFieldsResponse as ApiResponse<IMandatoryFields>
      if (response.data && Array.isArray(response.data)) {
        setMandatoryFields(response.data)
      } else {
        setMandatoryFields([])
      }
    } else {
      setMandatoryFields([])
    }
  }, [mandatoryFieldsResponse])

  // Update mandatoryFields when response changes
  useEffect(() => {
    if (mandatoryFieldsResponse?.data) {
      setMandatoryFields(mandatoryFieldsResponse.data)
    } else {
      setMandatoryFields([])
    }
  }, [mandatoryFieldsResponse])

  // When module changes, refetch fields
  useEffect(() => {
    if (selectedModule?.moduleId) {
      refetchMandatoryFields()
    } else {
      setMandatoryFields([])
    }
  }, [selectedModule?.moduleId, refetchMandatoryFields])

  const handleFieldChange = (
    field: IMandatoryFields,
    key: string,
    checked: boolean
  ) => {
    setMandatoryFields((prev) =>
      prev.map((f) =>
        f.moduleId === field.moduleId && f.transactionId === field.transactionId
          ? { ...f, [key]: checked }
          : f
      )
    )
  }

  const columns: ColumnDef<IMandatoryFields>[] = [
    {
      accessorKey: "moduleName",
      header: () => (
        <div className="text-center font-medium text-wrap">Module Name</div>
      ),
      size: 200,
    },
    {
      accessorKey: "transactionName",
      header: () => (
        <div className="text-center font-medium text-wrap">
          Transaction Name
        </div>
      ),
      size: 200,
    },
    {
      accessorKey: "m_ProductId",
      header: () => (
        <div className="text-center font-medium text-wrap">Product</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_ProductId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_ProductId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_JobOrderId",
      header: () => (
        <div className="text-center font-medium text-wrap">Job Order</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_JobOrderId")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_JobOrderId",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_GLId",
      header: () => <div className="text-center font-medium text-wrap">GL</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_GLId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_GLId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_QTY",
      header: () => (
        <div className="text-center font-medium text-wrap">QTY</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_QTY")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_QTY", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_UomId",
      header: () => (
        <div className="text-center font-medium text-wrap">UOM</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_UomId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_UomId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_UnitPrice",
      header: () => (
        <div className="text-center font-medium text-wrap">Unit Price</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_UnitPrice")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_UnitPrice", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_TotAmt",
      header: () => (
        <div className="text-center font-medium text-wrap">Total Amount</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_TotAmt")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_TotAmt", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Remarks",
      header: () => (
        <div className="text-center font-medium text-wrap">Remarks</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Remarks")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_Remarks", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_GstId",
      header: () => (
        <div className="text-center font-medium text-wrap">GST</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_GstId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_GstId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_DeliveryDate",
      header: () => (
        <div className="text-center font-medium text-wrap">Delivery Date</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_DeliveryDate")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_DeliveryDate",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_DepartmentId",
      header: () => (
        <div className="text-center font-medium text-wrap">Department</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_DepartmentId")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_DepartmentId",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_EmployeeId",
      header: () => (
        <div className="text-center font-medium text-wrap">Employee</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_EmployeeId")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_EmployeeId",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_PortId",
      header: () => (
        <div className="text-center font-medium text-wrap">Port</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_PortId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_PortId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_VesselId",
      header: () => (
        <div className="text-center font-medium text-wrap">Vessel</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_VesselId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_VesselId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_BargeId",
      header: () => (
        <div className="text-center font-medium text-wrap">Barge</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_BargeId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_BargeId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_VoyageId",
      header: () => (
        <div className="text-center font-medium text-wrap">Voyage</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_VoyageId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_VoyageId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_SupplyDate",
      header: () => (
        <div className="text-center font-medium text-wrap">Supply Date</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_SupplyDate")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_SupplyDate",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_ReferenceNo",
      header: () => (
        <div className="text-center font-medium text-wrap">Reference No</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_ReferenceNo")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_ReferenceNo",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_SuppInvoiceNo",
      header: () => (
        <div className="text-center font-medium text-wrap">
          Supplier Invoice No
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_SuppInvoiceNo")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_SuppInvoiceNo",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_BankId",
      header: () => (
        <div className="text-center font-medium text-wrap">Bank</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_BankId")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_BankId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_PaymentTypeId",
      header: () => (
        <div className="text-center font-medium text-wrap">Payment Type</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_PaymentTypeId")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_PaymentTypeId",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Remarks_Hd",
      header: () => (
        <div className="text-center font-medium text-wrap">Remarks Hd</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Remarks_Hd")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_Remarks_Hd",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Address1",
      header: () => (
        <div className="text-center font-medium text-wrap">Address 1</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Address1")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_Address1", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Address2",
      header: () => (
        <div className="text-center font-medium text-wrap">Address 2</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Address2")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_Address2", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Address3",
      header: () => (
        <div className="text-center font-medium text-wrap">Address 3</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Address3")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_Address3", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Address4",
      header: () => (
        <div className="text-center font-medium text-wrap">Address 4</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Address4")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_Address4", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_PinCode",
      header: () => (
        <div className="text-center font-medium text-wrap">Pincode</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_PinCode")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_PinCode", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_Countryd",
      header: () => (
        <div className="text-center font-medium text-wrap">Country</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_Countryd")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_Countryd", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_PhoneNo",
      header: () => (
        <div className="text-center font-medium text-wrap">Phone No</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_PhoneNo")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_PhoneNo", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_ContactName",
      header: () => (
        <div className="text-center font-medium text-wrap">Contact Name</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_ContactName")}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_ContactName",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_MobileNo",
      header: () => (
        <div className="text-center font-medium text-wrap">Mobile No</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_MobileNo")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_MobileNo", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_EmailAdd",
      header: () => (
        <div className="text-center font-medium text-wrap">Email</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.getValue("m_EmailAdd")}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_EmailAdd", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
  ]

  const handleSave = async () => {
    if (!selectedModule) {
      toast.error("Please select a module first")
      return
    }
    setShowSaveConfirmation(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedModule) {
      toast.error("Please select a module first")
      return
    }

    try {
      setSaving(true)
      const response = await mandatoryFieldSave.mutateAsync({
        data: mandatoryFields.map((field) => ({
          ...field,
          moduleId: selectedModule.moduleId,
        })),
      })

      if (response.result === 1) {
        toast.success("Mandatory fields saved successfully")
        refetchMandatoryFields()
      } else {
        toast.error(response.message || "Failed to save mandatory fields")
      }
    } catch (error) {
      console.error("Error saving mandatory fields:", error)
      toast.error("Failed to save mandatory fields")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => refetchMandatoryFields())}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-end gap-4">
              <div className="w-64">
                <ModuleAutocomplete
                  form={form}
                  name="moduleId"
                  onChangeEvent={(module) =>
                    setSelectedModule(
                      module
                        ? {
                            moduleId: module.moduleId,
                            moduleName: module.moduleName,
                          }
                        : null
                    )
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                disabled={isFieldsLoading}
              >
                {isFieldsLoading ? "Loading..." : "Search"}
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !selectedModule}
              size="sm"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>

      <SettingTable
        data={mandatoryFields}
        columns={columns}
        isLoading={isFieldsLoading}
        emptyMessage="No mandatory fields found."
        maxHeight="460px"
      />
      <SaveConfirmation
        title="Save Mandatory Fields"
        itemName={`mandatory fields for ${selectedModule?.moduleName || "selected module"}`}
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={saving}
        operationType="save"
      />
    </div>
  )
}
