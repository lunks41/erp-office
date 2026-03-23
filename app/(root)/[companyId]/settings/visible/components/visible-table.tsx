"use client"

import { useEffect, useState } from "react"
import { IVisibleFields } from "@/interfaces/setting"
import { ColumnDef } from "@tanstack/react-table"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  useVisibleFieldSave,
  useVisibleFieldbyidGet,
} from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@/components/ui/form"
import { ModuleAutocomplete } from "@/components/autocomplete"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { SettingTable } from "@/components/table/table-setting"

export function VisibleTable() {
  const form = useForm()
  const [selectedModule, setSelectedModule] = useState<{
    moduleId: number
    moduleName: string
  } | null>(null)
  const [visibleFields, setVisibleFields] = useState<IVisibleFields[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  // Fetch visible fields for selected module
  const {
    data: visibleFieldsResponse,
    refetch: refetchVisibleFields,
    isFetching: isFieldsLoading,
  } = useVisibleFieldbyidGet(selectedModule?.moduleId || 0)

  // Save visible fields mutation
  const visibleFieldSave = useVisibleFieldSave()

  // Update visibleFields when response changes
  useEffect(() => {
    if (visibleFieldsResponse?.data) {
      setVisibleFields(visibleFieldsResponse.data)
    } else {
      setVisibleFields([])
    }
  }, [visibleFieldsResponse])

  // When module changes, refetch fields
  useEffect(() => {
    if (selectedModule?.moduleId) {
      refetchVisibleFields()
    } else {
      setVisibleFields([])
    }
  }, [selectedModule?.moduleId, refetchVisibleFields])

  const handleFieldChange = (
    field: IVisibleFields,
    key: string,
    checked: boolean
  ) => {
    setVisibleFields((prev) =>
      prev.map((f) =>
        f.moduleId === field.moduleId && f.transactionId === field.transactionId
          ? { ...f, [key]: checked }
          : f
      )
    )
  }

  // Define columns for the table
  const columns: ColumnDef<IVisibleFields>[] = [
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
            checked={row.original.m_ProductId}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_ProductId", checked as boolean)
            }
          />
        </div>
      ),
      size: 120,
      minSize: 100,
      maxSize: 150,
    },
    {
      accessorKey: "m_QTY",
      header: () => (
        <div className="text-center font-medium text-wrap">QTY</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_QTY}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_QTY", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_BillQTY",
      header: () => (
        <div className="text-center font-medium text-wrap">Bill QTY</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_BillQTY}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_BillQTY", checked as boolean)
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
            checked={row.original.m_UomId}
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
            checked={row.original.m_UnitPrice}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_UnitPrice", checked as boolean)
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
            checked={row.original.m_Remarks}
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
        <div className="text-center font-medium text-wrap">VAT</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_GstId}
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
            checked={row.original.m_DeliveryDate}
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
            checked={row.original.m_DepartmentId}
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
            checked={row.original.m_EmployeeId}
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
            checked={row.original.m_PortId}
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
            checked={row.original.m_VesselId}
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
            checked={row.original.m_BargeId}
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
            checked={row.original.m_VoyageId}
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
            checked={row.original.m_SupplyDate}
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
      accessorKey: "m_BankId",
      header: () => (
        <div className="text-center font-medium text-wrap">Bank</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_BankId}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_BankId", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_CtyCurr",
      header: () => (
        <div className="text-center font-medium text-wrap">
          Country Currency
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_CtyCurr}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_CtyCurr", checked as boolean)
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
            checked={row.original.m_JobOrderId}
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
      accessorKey: "m_GstClaimDate",
      header: () => (
        <div className="text-center font-medium text-wrap">VAT Claim Date</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_GstClaimDate}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_GstClaimDate",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_TrnDate",
      header: () => (
        <div className="text-center font-medium text-wrap">Trn Date</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_TrnDate}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_TrnDate", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_PayeeTo",
      header: () => (
        <div className="text-center font-medium text-wrap">Payee To</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_PayeeTo}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_PayeeTo", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },

    {
      accessorKey: "m_ServiceCategoryId",
      header: () => (
        <div className="text-center font-medium text-wrap">Service Type</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_ServiceCategoryId}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_ServiceCategoryId",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },

    {
      accessorKey: "m_JobOrderIdHd",
      header: () => (
        <div className="text-center font-medium text-wrap">
          Job Order Header
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_JobOrderIdHd}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_JobOrderIdHd",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },

    {
      accessorKey: "m_OtherRemarks",
      header: () => (
        <div className="text-center font-medium text-wrap">Other Remarks</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_OtherRemarks}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_OtherRemarks",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },

    {
      accessorKey: "m_PortIdHd",
      header: () => (
        <div className="text-center font-medium text-wrap">Port Header</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_PortIdHd}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_PortIdHd", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },

    {
      accessorKey: "m_VesselIdHd",
      header: () => (
        <div className="text-center font-medium text-wrap">Vessel Header</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_VesselIdHd}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_VesselIdHd",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },

    {
      accessorKey: "m_AdvRecAmt",
      header: () => (
        <div className="text-center font-medium text-wrap">Adv Rec Amt</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_AdvRecAmt}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_AdvRecAmt", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_BankChgGLId",
      header: () => (
        <div className="text-center font-medium text-wrap">Bank Chg GL</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_BankChgGLId}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_BankChgGLId",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_InvoiceDate",
      header: () => (
        <div className="text-center font-medium text-wrap">Invoice Date</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_InvoiceDate}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_InvoiceDate",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_InvoiceNo",
      header: () => (
        <div className="text-center font-medium text-wrap">Invoice No</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_InvoiceNo}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_InvoiceNo", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_SupplierName",
      header: () => (
        <div className="text-center font-medium text-wrap">Supplier Name</div>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_SupplierName}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_SupplierName",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_GstNo",
      header: () => (
        <div className="text-center font-medium text-wrap">VAT No</div>
      ),

      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_GstNo}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_GstNo", checked as boolean)
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_DebitNoteNo",
      header: () => (
        <div className="text-center font-medium text-wrap">Debit Note No</div>
      ),

      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_DebitNoteNo}
            onCheckedChange={(checked) =>
              handleFieldChange(
                row.original,
                "m_DebitNoteNo",
                checked as boolean
              )
            }
          />
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: "m_BargeIdHd",
      header: () => (
        <div className="text-center font-medium text-wrap">Barge Header</div>
      ),

      cell: ({ row }) => (
        <div className="text-center">
          <Checkbox
            checked={row.original.m_BargeIdHd}
            onCheckedChange={(checked) =>
              handleFieldChange(row.original, "m_BargeIdHd", checked as boolean)
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
      const response = await visibleFieldSave.mutateAsync({
        data: visibleFields.map((field) => ({
          ...field,
          moduleId: selectedModule.moduleId,
        })),
      })

      if (response.result === 1) {
        toast.success("Visible fields saved successfully")
        refetchVisibleFields()
      } else {
        toast.error(response.message || "Failed to save visible fields")
      }
    } catch (error) {
      console.error("Error saving visible fields:", error)
      toast.error("Failed to save visible fields")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => refetchVisibleFields())}>
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
        data={visibleFields}
        columns={columns}
        isLoading={isFieldsLoading}
        emptyMessage="No visible fields found. Please select a module."
        maxHeight="460px"
        stickyColumnCount={2}
      />
      <SaveConfirmation
        title="Save Visible Fields"
        itemName={`visible fields for ${selectedModule?.moduleName || "selected module"}`}
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={saving}
        operationType="save"
      />
    </div>
  )
}
