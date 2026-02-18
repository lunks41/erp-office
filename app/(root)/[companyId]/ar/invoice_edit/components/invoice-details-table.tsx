import { useCallback, useEffect, useState } from "react"
import {
  calculateMultiplierAmount,
  calculatePercentagecAmount,
  handleGstPercentageChange,
  mathRound,
} from "@/helpers/account"
import {
  IInvoiceDetail,
  calculateCtyAmounts,
  calculateLocalAmounts,
  calculateTotalAmount,
  calculateTotalAmounts,
  recalculateDetailAmounts,
} from "@/helpers/invoice-calculations"
import {
  IBargeLookup,
  IChartOfAccountLookup,
  IDepartmentLookup,
  IEmployeeLookup,
  IGstLookup,
  IPortLookup,
  IProductLookup,
  IUomLookup,
  IVesselLookup,
  IVoyageLookup,
} from "@/interfaces/lookup"
import { IGridSetting, IVisibleFields } from "@/interfaces/setting"
import { ArInvoiceDtSchemaType, ArInvoiceHdSchemaType } from "@/schemas/invoice"
import { useAuthStore } from "@/stores/auth-store"
import {
  Cell,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format, parse } from "date-fns"
import {
  FileSpreadsheet,
  FileText,
  Layout,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import { FormProvider, UseFormReturn, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { getData } from "@/lib/api-client"
import { BasicSetting } from "@/lib/api-routes"
import { clientDateFormat } from "@/lib/date-utils"
import { ARTransactionId, ModuleId, cn } from "@/lib/utils"
import { usePersist } from "@/hooks/use-common"
import { useGetGridLayout } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BargeAutocomplete,
  ChartOfAccountAutocomplete,
  DepartmentAutocomplete,
  EmployeeAutocomplete,
  GSTAutocomplete,
  PortAutocomplete,
  ProductAutocomplete,
  UomAutocomplete,
  VesselAutocomplete,
  VoyageAutocomplete,
} from "@/components/autocomplete"
import CustomInput from "@/components/custom/custom-input"
import CustomNumberInputCellRefs from "@/components/custom/custom-number-input-cellrefs"

// UUID generation function that works across all environments
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface InvoiceDetailsTableProps {
  form: UseFormReturn<ArInvoiceHdSchemaType>
  visible: IVisibleFields
}

const cellRefs = new Map<string, HTMLInputElement>()

// Extend ArInvoiceDtSchemaType to include id field
interface InvoiceDetailRow extends ArInvoiceDtSchemaType {
  id: string
}

export default function InvoiceDetailsTable({
  form,
  visible,
}: InvoiceDetailsTableProps) {
  const { decimals } = useAuthStore()
  const qtyDec = decimals[0]?.qtyDec || 2
  const priceDec = decimals[0]?.priceDec || 2
  const amtDec = decimals[0]?.amtDec || 2
  const locAmtDec = decimals[0]?.locAmtDec || 2
  const ctyAmtDec = decimals[0]?.ctyAmtDec || 2

  const moduleId = ModuleId.ar
  const transactionId = ARTransactionId.invoice
  const grdName = "arInvoiceDt"
  const [mounted, setMounted] = useState(false)

  const invoiceDetailForm = useForm<Record<string, number | string>>({
    defaultValues: {},
  })

  const { data: gridSettings } = useGetGridLayout(
    moduleId.toString(),
    transactionId.toString(),
    grdName
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const [data, setData] = useState<InvoiceDetailRow[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnSearch, setColumnSearch] = useState("")
  const [activeButton, setActiveButton] = useState<"show" | "hide" | null>(null)
  const [rowSelection, setRowSelection] = useState({})

  // Add state for form updates
  const [formUpdateNeeded, setFormUpdateNeeded] = useState(false)
  const [formDetails, setFormDetails] = useState<InvoiceDetailRow[]>([])

  const invoiceId = form.watch("invoiceId")

  useEffect(() => {
    const data_details = form.getValues("data_details")
    if (
      data_details &&
      Array.isArray(data_details) &&
      data_details.length > 0
    ) {
      const validData = data_details.map((item) => ({
        id: generateUUID(),
        invoiceId: String(item.invoiceId || "0"),
        invoiceNo: String(item.invoiceNo || ""),
        itemNo: Number(item.itemNo || 0),
        seqNo: Number(item.seqNo || 0),
        docItemNo: Number(item.docItemNo || 0),
        productId: Number(item.productId || 0),
        glId: Number(item.glId || 0),
        qty: Number(item.billQTY || 0), // Always set qty to billQTY
        billQTY: Number(item.billQTY || 0),
        uomId: Number(item.uomId || 0),
        unitPrice: Number(item.unitPrice || 0),
        totAmt: Number(item.totAmt || 0),
        totLocalAmt: Number(item.totLocalAmt || 0),
        totCtyAmt: Number(item.totCtyAmt || 0),
        remarks: String(item.remarks || ""),
        gstId: Number(item.gstId || 0),
        gstPercentage: Number(item.gstPercentage || 0),
        gstAmt: Number(item.gstAmt || 0),
        gstLocalAmt: Number(item.gstLocalAmt || 0),
        gstCtyAmt: Number(item.gstCtyAmt || 0),
        deliveryDate: item.deliveryDate ? String(item.deliveryDate) : null,
        departmentId: Number(item.departmentId || 0),
        employeeId: Number(item.employeeId || 0),
        portId: Number(item.portId || 0),
        vesselId: Number(item.vesselId || 0),
        bargeId: Number(item.bargeId || 0),
        voyageId: Number(item.voyageId || 0),
        operationId: String(item.operationId || "0"),
        operationNo: String(item.operationNo || ""),
        opRefNo: String(item.opRefNo || ""),
        salesOrderId: String(item.salesOrderId || "0"),
        salesOrderNo: String(item.salesOrderNo || ""),
        supplyDate: item.supplyDate ? String(item.supplyDate) : null,
        supplierName: String(item.supplierName || ""),
        suppInvoiceNo: String(item.suppInvoiceNo || ""),
        apInvoiceId: String(item.apInvoiceId || "0"),
        apInvoiceNo: String(item.apInvoiceNo || ""),
        editVersion: Number(item.editVersion || 0),
      })) as InvoiceDetailRow[]
      setData(validData)
      validData.forEach((row) => {
        invoiceDetailForm.setValue(`itemNo-${row.id}`, row.itemNo || 0)
        invoiceDetailForm.setValue(`docItemNo-${row.id}`, row.docItemNo || 0)
        invoiceDetailForm.setValue(`productId-${row.id}`, row.productId || 0)
        invoiceDetailForm.setValue(`glId-${row.id}`, row.glId || 0)
        invoiceDetailForm.setValue(`uomId-${row.id}`, row.uomId || 0)
        invoiceDetailForm.setValue(`gstId-${row.id}`, row.gstId || 0)
        invoiceDetailForm.setValue(
          `departmentId-${row.id}`,
          row.departmentId || 0
        )
        invoiceDetailForm.setValue(`employeeId-${row.id}`, row.employeeId || 0)
        invoiceDetailForm.setValue(`portId-${row.id}`, row.portId || 0)
        invoiceDetailForm.setValue(`vesselId-${row.id}`, row.vesselId || 0)
        invoiceDetailForm.setValue(`bargeId-${row.id}`, row.bargeId || 0)
        invoiceDetailForm.setValue(`voyageId-${row.id}`, row.voyageId || 0)
        invoiceDetailForm.setValue(
          `operationId-${row.id}`,
          row.operationId || "0"
        )
        invoiceDetailForm.setValue(
          `operationNo-${row.id}`,
          row.operationNo || ""
        )
        invoiceDetailForm.setValue(`opRefNo-${row.id}`, row.opRefNo || "")
        invoiceDetailForm.setValue(
          `salesOrderId-${row.id}`,
          row.salesOrderId || ""
        )
        invoiceDetailForm.setValue(
          `salesOrderNo-${row.id}`,
          row.salesOrderNo || ""
        )

        invoiceDetailForm.setValue(
          `supplierName-${row.id}`,
          row.supplierName || ""
        )
        invoiceDetailForm.setValue(
          `suppInvoiceNo-${row.id}`,
          row.suppInvoiceNo || ""
        )
        invoiceDetailForm.setValue(
          `apInvoiceId-${row.id}`,
          row.apInvoiceId || ""
        )
        invoiceDetailForm.setValue(
          `apInvoiceNo-${row.id}`,
          row.apInvoiceNo || ""
        )

        invoiceDetailForm.setValue(`qty-${row.id}`, row.qty || 0)
        invoiceDetailForm.setValue(`seqNo-${row.id}`, row.seqNo || 0)
        invoiceDetailForm.setValue(`billQTY-${row.id}`, row.billQTY || 0)
        invoiceDetailForm.setValue(`unitPrice-${row.id}`, row.unitPrice || 0)
        invoiceDetailForm.setValue(`totAmt-${row.id}`, row.totAmt || 0)
        invoiceDetailForm.setValue(
          `totLocalAmt-${row.id}`,
          row.totLocalAmt || 0
        )
        invoiceDetailForm.setValue(
          `gstPercentage-${row.id}`,
          row.gstPercentage || 0
        )
        invoiceDetailForm.setValue(`gstAmt-${row.id}`, row.gstAmt || 0)
        invoiceDetailForm.setValue(
          `gstLocalAmt-${row.id}`,
          row.gstLocalAmt || 0
        )
        // Add other fields as needed
      })
    } else {
      setData([])
    }
  }, [invoiceId, form, invoiceDetailForm])

  // Effect to handle form updates
  useEffect(() => {
    if (formUpdateNeeded && formDetails.length > 0) {
      // Update the main form's data_details
      form.setValue("data_details", formDetails)
      form.trigger("data_details")

      // Calculate and update totals
      const totals = calculateTotalAmounts(
        formDetails as IInvoiceDetail[],
        amtDec
      )
      // Update main form header values
      form.setValue("totAmt", totals.totAmt)
      form.trigger("totAmt")
      form.setValue("gstAmt", totals.gstAmt)
      form.trigger("gstAmt")
      form.setValue("totAmtAftGst", totals.totAmtAftGst)
      form.trigger("totAmtAftGst")

      const localAmounts = calculateLocalAmounts(
        formDetails as IInvoiceDetail[],
        locAmtDec
      )
      form.setValue("totLocalAmt", localAmounts.totLocalAmt)
      form.trigger("totLocalAmt")
      form.setValue("gstLocalAmt", localAmounts.gstLocalAmt)
      form.trigger("gstLocalAmt")
      form.setValue("totLocalAmtAftGst", localAmounts.totLocalAmtAftGst)
      form.trigger("totLocalAmtAftGst")

      const countryAmounts = visible?.m_CtyCurr
        ? calculateCtyAmounts(formDetails as IInvoiceDetail[], ctyAmtDec)
        : null

      if (countryAmounts && visible?.m_CtyCurr) {
        form.setValue("totCtyAmt", countryAmounts.totCtyAmt)
        form.trigger("totCtyAmt")
        form.setValue("gstCtyAmt", countryAmounts.gstCtyAmt)
        form.trigger("gstCtyAmt")
        form.setValue("totCtyAmtAftGst", countryAmounts.totCtyAmtAftGst)
        form.trigger("totCtyAmtAftGst")
      }

      setFormUpdateNeeded(false)
    }
  }, [
    formUpdateNeeded,
    formDetails,
    form,
    visible,
    amtDec,
    locAmtDec,
    ctyAmtDec,
  ])

  // Sync form values whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      // Convert data back to the form's expected format
      const formDetails = data.map((item) => ({
        ...item,
        deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
        supplyDate: item.supplyDate ? new Date(item.supplyDate) : null,
      }))

      setFormDetails(formDetails)
      setFormUpdateNeeded(true)
    }
  }, [data])

  const handleAddRow = () => {
    const maxSeqNo =
      data.length > 0 ? Math.max(...data.map((row) => row.seqNo)) : 0
    const newSeqNo = maxSeqNo + 1
    //const newId = crypto.randomUUID(),
    const newId = generateUUID()

    const newRow: InvoiceDetailRow = {
      id: newId,
      invoiceId: "0",
      invoiceNo: "",
      itemNo: newSeqNo,
      seqNo: newSeqNo,
      docItemNo: newSeqNo,
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
      deliveryDate: "",
      departmentId: 0,
      employeeId: 0,
      portId: 0,
      vesselId: 0,
      bargeId: 0,
      voyageId: 0,
      operationId: "0",
      operationNo: "",
      opRefNo: "",
      salesOrderId: "",
      salesOrderNo: "",
      supplyDate: "",
      supplierName: "",
      suppInvoiceNo: "",
      apInvoiceId: "",
      apInvoiceNo: "",
      editVersion: 0,
    }

    // Initialize form values for the new row
    invoiceDetailForm.setValue(`seqNo-${newId}`, newSeqNo)
    invoiceDetailForm.setValue(`itemNo-${newId}`, newSeqNo)
    invoiceDetailForm.setValue(`docItemNo-${newId}`, newSeqNo)
    invoiceDetailForm.setValue(`productId-${newId}`, 0)
    invoiceDetailForm.setValue(`glId-${newId}`, 0)
    invoiceDetailForm.setValue(`uomId-${newId}`, 0)
    invoiceDetailForm.setValue(`gstId-${newId}`, 0)
    invoiceDetailForm.setValue(`departmentId-${newId}`, 0)
    invoiceDetailForm.setValue(`employeeId-${newId}`, 0)
    invoiceDetailForm.setValue(`portId-${newId}`, 0)
    invoiceDetailForm.setValue(`vesselId-${newId}`, 0)
    invoiceDetailForm.setValue(`bargeId-${newId}`, 0)
    invoiceDetailForm.setValue(`voyageId-${newId}`, 0)
    invoiceDetailForm.setValue(`operationId-${newId}`, "0")
    invoiceDetailForm.setValue(`operationNo-${newId}`, "")
    invoiceDetailForm.setValue(`opRefNo-${newId}`, "")
    invoiceDetailForm.setValue(`salesOrderId-${newId}`, "")
    invoiceDetailForm.setValue(`salesOrderNo-${newId}`, "")
    invoiceDetailForm.setValue(`supplyDate-${newId}`, "")
    invoiceDetailForm.setValue(`supplierName-${newId}`, "")
    invoiceDetailForm.setValue(`suppInvoiceNo-${newId}`, "")
    invoiceDetailForm.setValue(`apInvoiceId-${newId}`, "")
    invoiceDetailForm.setValue(`apInvoiceNo-${newId}`, "")
    invoiceDetailForm.setValue(`deliveryDate-${newId}`, "")
    invoiceDetailForm.setValue(`qty-${newId}`, 0)
    invoiceDetailForm.setValue(`billQTY-${newId}`, 0)
    invoiceDetailForm.setValue(`unitPrice-${newId}`, 0)
    invoiceDetailForm.setValue(`totAmt-${newId}`, 0)
    invoiceDetailForm.setValue(`totLocalAmt-${newId}`, 0)
    invoiceDetailForm.setValue(`gstPercentage-${newId}`, 0)
    invoiceDetailForm.setValue(`gstAmt-${newId}`, 0)
    invoiceDetailForm.setValue(`gstLocalAmt-${newId}`, 0)

    // Update data state
    setData((old) => [...old, newRow])

    // Sync with main form in next tick
    setTimeout(() => {
      syncSchemaType()
    }, 0)
  }

  const handleDeleteRow = (rowIndex: number) => {
    const rowId = data[rowIndex].id
    setData((old) => old.filter((_, index) => index !== rowIndex))
    // Clean up refs for the deleted row
    cellRefs.forEach((_, key) => {
      if (key.startsWith(rowId)) cellRefs.delete(key)
    })
    // Sync with main form after deletion
    syncSchemaType()
  }

  useEffect(() => {
    return () => {
      cellRefs.clear() // Cleanup on unmount
    }
  }, [])

  const saveGridSettings = usePersist<IGridSetting>("/setting/saveUserGrid")

  const updateData = <T extends string | number | null>(
    id: string,
    columnId: keyof InvoiceDetailRow,
    value: T
  ) => {
    setData((prevData) =>
      prevData.map((row) => {
        if (row.id === id) {
          return { ...row, [columnId]: value }
        }
        return row
      })
    )
  }

  // Add this new function to sync form values
  const syncSchemaType = useCallback(() => {
    // Map the current data with form values
    const updatedDetails = data.map((row) => {
      // Get all the numeric values from invoiceDetailForm
      const formValues = {
        billQTY: parseFloat(
          invoiceDetailForm.getValues(`billQTY-${row.id}`)?.toString() || "0"
        ),
        unitPrice: parseFloat(
          invoiceDetailForm.getValues(`unitPrice-${row.id}`)?.toString() || "0"
        ),
        totAmt: parseFloat(
          invoiceDetailForm.getValues(`totAmt-${row.id}`)?.toString() || "0"
        ),
        totLocalAmt: parseFloat(
          invoiceDetailForm.getValues(`totLocalAmt-${row.id}`)?.toString() ||
            "0"
        ),
        totCtyAmt: parseFloat(
          invoiceDetailForm.getValues(`totCtyAmt-${row.id}`)?.toString() || "0"
        ),
        gstPercentage: parseFloat(
          invoiceDetailForm.getValues(`gstPercentage-${row.id}`)?.toString() ||
            "0"
        ),
        gstAmt: parseFloat(
          invoiceDetailForm.getValues(`gstAmt-${row.id}`)?.toString() || "0"
        ),
        gstLocalAmt: parseFloat(
          invoiceDetailForm.getValues(`gstLocalAmt-${row.id}`)?.toString() ||
            "0"
        ),
        gstCtyAmt: parseFloat(
          invoiceDetailForm.getValues(`gstCtyAmt-${row.id}`)?.toString() || "0"
        ),

        // Get all the non-numeric values
        remarks:
          invoiceDetailForm.getValues(`remarks-${row.id}`)?.toString() || "",
        productId: parseInt(
          invoiceDetailForm.getValues(`productId-${row.id}`)?.toString() || "0"
        ),
        glId: parseInt(
          invoiceDetailForm.getValues(`glId-${row.id}`)?.toString() || "0"
        ),
        uomId: parseInt(
          invoiceDetailForm.getValues(`uomId-${row.id}`)?.toString() || "0"
        ),
        gstId: parseInt(
          invoiceDetailForm.getValues(`gstId-${row.id}`)?.toString() || "0"
        ),
        departmentId: parseInt(
          invoiceDetailForm.getValues(`departmentId-${row.id}`)?.toString() ||
            "0"
        ),
        employeeId: parseInt(
          invoiceDetailForm.getValues(`employeeId-${row.id}`)?.toString() || "0"
        ),
        portId: parseInt(
          invoiceDetailForm.getValues(`portId-${row.id}`)?.toString() || "0"
        ),
        vesselId: parseInt(
          invoiceDetailForm.getValues(`vesselId-${row.id}`)?.toString() || "0"
        ),
        bargeId: parseInt(
          invoiceDetailForm.getValues(`bargeId-${row.id}`)?.toString() || "0"
        ),
        voyageId: parseInt(
          invoiceDetailForm.getValues(`voyageId-${row.id}`)?.toString() || "0"
        ),
      }

      // Merge with existing row data
      return {
        ...row,
        ...formValues,
        supplierName: row.supplierName === undefined ? null : row.supplierName,
        qty: formValues.billQTY,
      }
    })

    // Set the form data and trigger update
    setFormDetails(updatedDetails)
    setFormUpdateNeeded(true)
  }, [data, invoiceDetailForm, setFormDetails, setFormUpdateNeeded])

  // Update the handleQtyOrPriceChange function
  const handleQtyOrPriceChange = (
    rowId: string,
    field: "billQTY" | "unitPrice",
    rawValue: string,
    nextField?: string
  ) => {
    const exchangeRate = form.getValues().exhRate || 0
    const countryExchangeRate = form.getValues().ctyExhRate || 0
    const newBillQTY =
      field === "billQTY"
        ? parseFloat(rawValue) || 0
        : parseFloat(
            invoiceDetailForm.getValues(`billQTY-${rowId}`)?.toString() || "0"
          )
    const newUnitPrice =
      field === "unitPrice"
        ? parseFloat(rawValue) || 0
        : parseFloat(
            invoiceDetailForm.getValues(`unitPrice-${rowId}`)?.toString() || "0"
          )

    const totAmt = calculateTotalAmount(newBillQTY, newUnitPrice, {
      amtDec: decimals[0]?.amtDec || 2,
      locAmtDec: decimals[0]?.locAmtDec || 2,
      ctyAmtDec: decimals[0]?.ctyAmtDec || 2,
    })

    // Get the current row data
    const rowData = data.find((row) => row.id === rowId)
    if (rowData) {
      // Update the row with new values
      const updatedRow = {
        ...rowData,
        billQTY: newBillQTY,
        unitPrice: newUnitPrice,
        totAmt,
      }

      // Recalculate all amounts for this row
      const recalculatedRow = recalculateDetailAmounts(
        updatedRow as IInvoiceDetail,
        exchangeRate,
        countryExchangeRate,
        {
          amtDec: decimals[0]?.amtDec || 2,
          locAmtDec: decimals[0]?.locAmtDec || 2,
          ctyAmtDec: decimals[0]?.ctyAmtDec || 2,
        },
        !!visible?.m_CtyCurr
      )

      // Update the data state
      setData((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row
          return recalculatedRow as InvoiceDetailRow
        })
      )

      // Update form values in the next tick
      setTimeout(() => {
        // Update the detail form values
        invoiceDetailForm.setValue(
          `billQTY-${rowId}`,
          mathRound(newBillQTY, qtyDec)
        )
        invoiceDetailForm.setValue(
          `unitPrice-${rowId}`,
          mathRound(newUnitPrice, priceDec)
        )
        invoiceDetailForm.setValue(`totAmt-${rowId}`, mathRound(totAmt, amtDec))
        invoiceDetailForm.setValue(
          `totLocalAmt-${rowId}`,
          mathRound(recalculatedRow.totLocalAmt || 0, locAmtDec)
        )
        invoiceDetailForm.setValue(
          `gstAmt-${rowId}`,
          mathRound(recalculatedRow.gstAmt || 0, amtDec)
        )
        invoiceDetailForm.setValue(
          `gstLocalAmt-${rowId}`,
          mathRound(recalculatedRow.gstLocalAmt || 0, locAmtDec)
        )

        if (visible?.m_CtyCurr) {
          invoiceDetailForm.setValue(
            `totCtyAmt-${rowId}`,
            mathRound(recalculatedRow.totCtyAmt || 0, ctyAmtDec)
          )
          invoiceDetailForm.setValue(
            `gstCtyAmt-${rowId}`,
            mathRound(recalculatedRow.gstCtyAmt || 0, ctyAmtDec)
          )
        }

        // Sync all values to main form
        syncSchemaType()

        // Move focus to next field if specified
        if (nextField) {
          const nextRef = cellRefs.get(rowId + "-" + nextField)
          if (nextRef) {
            nextRef.focus()
            nextRef.select()
          }
        }
      }, 0)
    }
  }

  // Update the handleTotalAmountChange function
  const handleTotalAmountChange = (rowId: string) => {
    const exchangeRate = form.getValues().exhRate || 0
    const countryExchangeRate = form.getValues().ctyExhRate || 0

    setData((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          return recalculateDetailAmounts(
            { ...row } as IInvoiceDetail,
            exchangeRate,
            countryExchangeRate,
            {
              amtDec: decimals[0]?.amtDec || 2,
              locAmtDec: decimals[0]?.locAmtDec || 2,
              ctyAmtDec: decimals[0]?.ctyAmtDec || 2,
            },
            !!visible?.m_CtyCurr
          ) as InvoiceDetailRow
        }
        return row
      })
    )

    // Use setTimeout to avoid render phase updates
    setTimeout(() => {
      syncSchemaType()
    }, 0)
  }

  // Update the exchange rate watcher
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "exhRate" || name === "ctyExhRate") {
        // Recalculate all rows with new exchange rate
        setData((prev) =>
          prev.map((row) => {
            const exchangeRate = form.getValues().exhRate || 0
            const countryExchangeRate = form.getValues().ctyExhRate || 0
            const totAmt = parseFloat(row.totAmt?.toString() as string) || 0
            const gstPercentage = parseFloat(row.gstPercentage?.toString()) || 0
            const gstAmt = calculateMultiplierAmount(
              totAmt,
              gstPercentage,
              amtDec
            )

            // Calculate local amounts
            const totLocalAmt = calculateMultiplierAmount(
              totAmt,
              exchangeRate,
              locAmtDec
            )
            const gstLocalAmt = calculateMultiplierAmount(
              gstAmt,
              exchangeRate,
              locAmtDec
            )

            // Calculate country amounts if visible
            let totCtyAmt = 0
            let gstCtyAmt = 0
            if (visible?.m_CtyCurr) {
              totCtyAmt = calculateMultiplierAmount(
                totAmt,
                countryExchangeRate,
                ctyAmtDec
              )
              gstCtyAmt = calculateMultiplierAmount(
                gstAmt,
                countryExchangeRate,
                ctyAmtDec
              )
            }

            // Update form values
            invoiceDetailForm.setValue(
              `totLocalAmt-${row.id}`,
              mathRound(totLocalAmt, locAmtDec)
            )
            invoiceDetailForm.setValue(
              `gstLocalAmt-${row.id}`,
              mathRound(gstLocalAmt, locAmtDec)
            )
            if (visible?.m_CtyCurr) {
              invoiceDetailForm.setValue(
                `totCtyAmt-${row.id}`,
                mathRound(totCtyAmt, ctyAmtDec)
              )
              invoiceDetailForm.setValue(
                `gstCtyAmt-${row.id}`,
                mathRound(gstCtyAmt, ctyAmtDec)
              )
            }

            return {
              ...row,
              gstAmt,
              totLocalAmt,
              gstLocalAmt,
              totCtyAmt,
              gstCtyAmt,
            }
          })
        )
        syncSchemaType()
      }
    })

    return () => subscription.unsubscribe()
  }, [
    form,
    visible,
    amtDec,
    locAmtDec,
    ctyAmtDec,
    invoiceDetailForm,
    syncSchemaType,
  ])

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error("No data available to export")
      return
    }
    try {
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Details")
      XLSX.writeFile(workbook, "invoice_details.xlsx")
      toast.success("Excel file downloaded successfully")
    } catch (error) {
      console.error("Error exporting Excel:", error)
      toast.error("Failed to export Excel")
    }
  }

  const handleExportPdf = (_data: InvoiceDetailRow[]) => {}

  const columns: ColumnDef<InvoiceDetailRow>[] = [
    {
      accessorKey: "actions",
      header: "Actions",
      enableHiding: false,
      size: 80,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
    },
    {
      accessorKey: "itemNo",
      header: "Item No",
      size: 60,
    },
    {
      accessorKey: "docItemNo",
      header: "Doc Item No",
      size: 80,
    },
    {
      accessorKey: "seqNo",
      header: "Seq No",
      size: 60,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`seqNo-${row.original.id}`}
          round={0}
          className="text-right"
          onChangeEvent={(value) =>
            setTimeout(() => updateData(row.original.id, "seqNo", value), 0)
          }
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
        />
      ),
    },
    {
      accessorKey: "productId",
      header: "Product",
      size: 150,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <div className="w-full">
          <ProductAutocomplete
            form={invoiceDetailForm}
            name={`productId-${row.original.id}`}
            onChangeEvent={(selectedOption: IProductLookup | null) =>
              setTimeout(
                () =>
                  updateData(
                    row.original.id,
                    "productId",
                    selectedOption?.productId || 0
                  ),
                0
              )
            }
          />
        </div>
      ),
    },
    {
      accessorKey: "glId",
      header: "Chart Account",
      size: 200,
      cell: ({ row }) => (
        <div className="w-full">
          <ChartOfAccountAutocomplete
            form={invoiceDetailForm}
            name={`glId-${row.original.id}`}
            onChangeEvent={(selectedOption: IChartOfAccountLookup | null) =>
              setTimeout(
                () =>
                  updateData(
                    row.original.id,
                    "glId",
                    selectedOption?.glId || 0
                  ),
                0
              )
            }
          />
        </div>
      ),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <div className="w-full">
          <div className="w-full">
            <CustomInput
              form={invoiceDetailForm}
              name={`remarks-${row.original.id}`}
              onBlurEvent={(e: React.FocusEvent<HTMLInputElement>) =>
                setTimeout(() => {
                  const value =
                    e.target.value === undefined ? "" : e.target.value
                  updateData(row.original.id, "remarks", value)
                }, 0)
              }
            />
          </div>
        </div>
      ),
    },
    {
      accessorKey: "qty",
      header: "Quantity",
      size: 150,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`qty-${row.original.id}`}
          round={qtyDec}
          className="text-right"
          onBlurEvent={(e: React.FocusEvent<HTMLInputElement>) =>
            setTimeout(() => {
              const newQty = parseFloat(e.target.value) || 0
              updateData(row.original.id, "qty", newQty)
              updateData(row.original.id, "billQTY", newQty)
              invoiceDetailForm.setValue(`billQTY-${row.original.id}`, newQty)
              handleQtyOrPriceChange(
                row.original.id,
                "billQTY",
                e.target.value || "0",
                "billQTY"
              )
            }, 0)
          }
        />
      ),
    },
    {
      accessorKey: "billQTY",
      header: "Bill Quantity",
      size: 150,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`billQTY-${row.original.id}`}
          round={qtyDec}
          className="text-right"
          onBlurEvent={(e: React.FocusEvent<HTMLInputElement>) =>
            setTimeout(() => {
              handleQtyOrPriceChange(
                row.original.id,
                "billQTY",
                e.target.value,
                "unitPrice"
              )
            }, 0)
          }
        />
      ),
    },
    {
      accessorKey: "uomId",
      header: "UOM",
      size: 150,
      cell: ({ row }) => (
        <div className="w-full">
          <UomAutocomplete
            form={invoiceDetailForm}
            name={`uomId-${row.original.id}`}
            onChangeEvent={(selectedOption: IUomLookup | null) =>
              setTimeout(
                () =>
                  updateData(
                    row.original.id,
                    "uomId",
                    selectedOption?.uomId || 0
                  ),
                0
              )
            }
          />
        </div>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      size: 150,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`unitPrice-${row.original.id}`}
          round={priceDec}
          className="text-right"
          onBlurEvent={(e: React.FocusEvent<HTMLInputElement>) =>
            setTimeout(() => {
              handleQtyOrPriceChange(
                row.original.id,
                "unitPrice",
                e.target.value,
                "totAmt"
              )
            }, 0)
          }
        />
      ),
    },
    {
      accessorKey: "totAmt",
      header: "Amount",
      size: 150,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`totAmt-${row.original.id}`}
          round={amtDec}
          className="text-right"
          onBlurEvent={() =>
            setTimeout(() => handleTotalAmountChange(row.original.id), 0)
          }
        />
      ),
    },
    {
      accessorKey: "totLocalAmt",
      header: "Local Amount",
      size: 120,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`totLocalAmt-${row.original.id}`}
          round={amtDec}
          className="text-right"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab") {
              e.preventDefault()
              const nextKey = `totCtyAmt-${row.original.id}`
              const nextRef = cellRefs.get(nextKey)
              if (nextRef) {
                nextRef.focus()
                nextRef.select()
              }
            }
          }}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
          ref={(el) => {
            const key = `totLocalAmt-${row.original.id}`
            if (el) cellRefs.set(key, el)
            else cellRefs.delete(key)
          }}
          isDisabled={true}
        />
      ),
    },
    {
      accessorKey: "totCtyAmt",
      header: "Country Amount",
      size: 120,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`totCtyAmt-${row.original.id}`}
          round={ctyAmtDec}
          className="text-right"
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab") {
              e.preventDefault()
              const nextKey = `gstId-${row.original.id}`
              const nextRef = cellRefs.get(nextKey)
              if (nextRef) {
                nextRef.focus()
                nextRef.select()
              }
            }
          }}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
          ref={(el) => {
            const key = `totCtyAmt-${row.original.id}`
            if (el) cellRefs.set(key, el)
            else cellRefs.delete(key)
          }}
          isDisabled={true}
        />
      ),
    },
    {
      accessorKey: "gstId",
      header: "Gst",
      size: 150,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <GSTAutocomplete
          form={invoiceDetailForm}
          name={`gstId-${row.original.id}`}
          onChangeEvent={async (selectedOption: IGstLookup | null) =>
            setTimeout(async () => {
              if (selectedOption) {
                await updateData(row.original.id, "gstId", selectedOption.gstId)
                // Get the account date from the header form
                const accountDate = form.getValues().accountDate

                if (accountDate && selectedOption.gstId) {
                  try {
                    const dt = format(
                      parse(
                        accountDate.toString(),
                        clientDateFormat,
                        new Date()
                      ),
                      "yyyy-MM-dd"
                    )

                    const res = await getData(
                      `${BasicSetting.getGstPercentage}/${selectedOption.gstId}/${dt}`
                    )

                    // Update the GST percentage for this specific row
                    const gstPercentage = res?.data.data || 0
                    await updateData(
                      row.original.id,
                      "gstPercentage",
                      gstPercentage
                    )
                    invoiceDetailForm.setValue(
                      `gstPercentage-${row.original.id}`,
                      gstPercentage
                    )

                    // Get the current row data
                    const rowData = data.find(
                      (item) => item.id === row.original.id
                    )
                    if (rowData) {
                      // Update GST amount based on total amount and new GST percentage
                      const gstAmt = calculatePercentagecAmount(
                        rowData.totAmt || 0,
                        gstPercentage,
                        amtDec
                      )
                      await updateData(row.original.id, "gstAmt", gstAmt)
                      invoiceDetailForm.setValue(
                        `gstAmt-${row.original.id}`,
                        gstAmt
                      )

                      // Update GST local amount
                      const exchangeRate = form.getValues().exhRate || 0
                      const gstLocalAmt = calculateMultiplierAmount(
                        gstAmt,
                        exchangeRate,
                        locAmtDec
                      )
                      await updateData(
                        row.original.id,
                        "gstLocalAmt",
                        gstLocalAmt
                      )
                      invoiceDetailForm.setValue(
                        `gstLocalAmt-${row.original.id}`,
                        gstLocalAmt
                      )

                      // Update GST country amount if visible
                      if (visible?.m_CtyCurr) {
                        const countryExchangeRate =
                          form.getValues().ctyExhRate || 0
                        const gstCtyAmt = calculateMultiplierAmount(
                          gstAmt,
                          countryExchangeRate,
                          ctyAmtDec
                        )
                        await updateData(
                          row.original.id,
                          "gstCtyAmt",
                          gstCtyAmt
                        )
                        invoiceDetailForm.setValue(
                          `gstCtyAmt-${row.original.id}`,
                          gstCtyAmt
                        )
                      }
                    }
                  } catch (error) {
                    console.error("Error fetching GST percentage:", error)
                  }
                }
              }
            }, 0)
          }
        />
      ),
    },
    {
      accessorKey: "gstPercentage",
      header: "VAT %",
      size: 100,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`gstPercentage-${row.original.id}`}
          round={priceDec}
          className="text-right"
          onBlurEvent={() =>
            setTimeout(() => {
              handleGstPercentageChange(
                form,
                invoiceDetailForm,
                decimals[0],
                visible
              )
            }, 0)
          }
        />
      ),
    },
    {
      accessorKey: "gstAmt",
      header: "VAT Amount",
      size: 120,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`gstAmt-${row.original.id}`}
          round={amtDec}
          className="text-right"
          onBlurEvent={() =>
            setTimeout(() => {
              // If there is any logic to update GST Amount, place it here
              // Example: updateData(row.original.id, "gstAmt", ...)
            }, 0)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab") {
              e.preventDefault()
              const nextKey = `gstLocalAmt-${row.original.id}`
              const nextRef = cellRefs.get(nextKey)
              if (nextRef) {
                nextRef.focus()
                nextRef.select()
              }
            }
          }}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
          ref={(el) => {
            const key = `gstAmt-${row.original.id}`
            if (el) cellRefs.set(key, el)
            else cellRefs.delete(key)
          }}
        />
      ),
    },
    {
      accessorKey: "gstLocalAmt",
      header: "VAT Local Amount",
      size: 120,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`gstLocalAmt-${row.original.id}`}
          round={amtDec}
          className="text-right"
          onBlurEvent={() =>
            setTimeout(() => {
              // If there is any logic to update VAT Local Amount, place it here
            }, 0)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab") {
              e.preventDefault()
              const nextKey = `gstCtyAmt-${row.original.id}`
              const nextRef = cellRefs.get(nextKey)
              if (nextRef) {
                nextRef.focus()
                nextRef.select()
              }
            }
          }}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
          ref={(el) => {
            const key = `gstLocalAmt-${row.original.id}`
            if (el) cellRefs.set(key, el)
            else cellRefs.delete(key)
          }}
          isDisabled={true}
        />
      ),
    },
    {
      accessorKey: "gstCtyAmt",
      header: "GST Country Amount",
      size: 120,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <CustomNumberInputCellRefs
          form={invoiceDetailForm}
          name={`gstCtyAmt-${row.original.id}`}
          round={ctyAmtDec}
          className="text-right"
          onBlurEvent={() =>
            setTimeout(() => {
              // If there is any logic to update GST Country Amount, place it here
            }, 0)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Tab") {
              e.preventDefault()
              const nextKey = `deliveryDate-${row.original.id}`
              const nextRef = cellRefs.get(nextKey)
              if (nextRef) {
                nextRef.focus()
                nextRef.select()
              }
            }
          }}
          onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
          ref={(el) => {
            const key = `gstCtyAmt-${row.original.id}`
            if (el) cellRefs.set(key, el)
            else cellRefs.delete(key)
          }}
          isDisabled={true}
        />
      ),
    },

    {
      accessorKey: "departmentId",
      header: "Department",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <DepartmentAutocomplete
          form={invoiceDetailForm}
          name={`departmentId-${row.original.id}`}
          onChangeEvent={(selectedOption: IDepartmentLookup | null) =>
            setTimeout(
              () =>
                updateData(
                  row.original.id,
                  "departmentId",
                  selectedOption?.departmentId || 0
                ),
              0
            )
          }
        />
      ),
    },
    {
      accessorKey: "employeeId",
      header: "Employee",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <EmployeeAutocomplete
          form={invoiceDetailForm}
          name={`employeeId-${row.original.id}`}
          onChangeEvent={(selectedOption: IEmployeeLookup | null) =>
            setTimeout(
              () =>
                updateData(
                  row.original.id,
                  "employeeId",
                  selectedOption?.employeeId || 0
                ),
              0
            )
          }
        />
      ),
    },
    {
      accessorKey: "portId",
      header: "Port",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <PortAutocomplete
          form={invoiceDetailForm}
          name={`portId-${row.original.id}`}
          onChangeEvent={(selectedOption: IPortLookup | null) =>
            setTimeout(
              () =>
                updateData(
                  row.original.id,
                  "portId",
                  selectedOption?.portId || 0
                ),
              0
            )
          }
        />
      ),
    },
    {
      accessorKey: "vesselId",
      header: "Vessel",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <VesselAutocomplete
          form={invoiceDetailForm}
          name={`vesselId-${row.original.id}`}
          onChangeEvent={(selectedOption: IVesselLookup | null) =>
            setTimeout(
              () =>
                updateData(
                  row.original.id,
                  "vesselId",
                  selectedOption?.vesselId || 0
                ),
              0
            )
          }
        />
      ),
    },
    {
      accessorKey: "bargeId",
      header: "Barge",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <BargeAutocomplete
          form={invoiceDetailForm}
          name={`bargeId-${row.original.id}`}
          onChangeEvent={(selectedOption: IBargeLookup | null) =>
            setTimeout(
              () =>
                updateData(
                  row.original.id,
                  "bargeId",
                  selectedOption?.bargeId || 0
                ),
              0
            )
          }
        />
      ),
    },
    {
      accessorKey: "voyageId",
      header: "Voyage",
      size: 200,
      cell: ({ row }: { row: { original: InvoiceDetailRow } }) => (
        <VoyageAutocomplete
          form={invoiceDetailForm}
          name={`voyageId-${row.original.id}`}
          onChangeEvent={(selectedOption: IVoyageLookup | null) =>
            setTimeout(
              () =>
                updateData(
                  row.original.id,
                  "voyageId",
                  selectedOption?.voyageId || 0
                ),
              0
            )
          }
        />
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
    },
  })

  // Load grid settings after table is created
  useEffect(() => {
    if (gridSettings && table) {
      try {
        const colVisible = JSON.parse(gridSettings.grdColVisible || "{}")
        const colOrder = JSON.parse(gridSettings.grdColOrder || "[]")
        const colSize = JSON.parse(gridSettings.grdColSize || "{}")
        const sort = JSON.parse(gridSettings.grdSort || "[]")

        setColumnVisibility(colVisible)
        setSorting(sort)

        table.getAllColumns().forEach((column) => {
          if (colSize[column.id]) {
            column.getSize()
          }
        })

        if (colOrder.length > 0) {
          table.setColumnOrder(colOrder)
        }
      } catch (error) {
        console.error("Error parsing grid settings:", error)
      }
    }
  }, [gridSettings, table])

  const handleSaveLayout = async () => {
    try {
      const visibleColumns = table.getAllColumns()
      const columnVisibility = Object.fromEntries(
        visibleColumns.map((col) => [col.id, col.getIsVisible()])
      )
      const columnSize = Object.fromEntries(
        visibleColumns.map((col) => [col.id, col.getSize()])
      )
      const columnOrder = visibleColumns.map((col) => col.id)

      const gridSettings: IGridSetting = {
        moduleId,
        transactionId,
        grdName,
        grdKey: grdName,
        grdColVisible: JSON.stringify(columnVisibility),
        grdColOrder: JSON.stringify(columnOrder),
        grdColSize: JSON.stringify(columnSize),
        grdSort: JSON.stringify(sorting),
        grdString: "",
      }

      await saveGridSettings.mutateAsync(gridSettings)
      toast.success("Layout saved successfully")
    } catch (error) {
      console.error("Error saving layout:", error)
      toast.error("Failed to save layout")
    }
  }

  const filteredColumns = table.getAllColumns().filter((column) => {
    if (!column.getCanHide()) return false
    return column.id.toLowerCase().includes(columnSearch.toLowerCase())
  })

  const handleShowAll = (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveButton("show")
    table.getAllColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(true)
      }
    })
  }

  const handleHideAll = (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveButton("hide")
    table.getAllColumns().forEach((column) => {
      if (column.getCanHide()) {
        column.toggleVisibility(false)
      }
    })
  }

  useEffect(() => {
    const handleTabNavigation = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const active = document.activeElement as HTMLElement
      if (!active) return
      // Only handle if inside our table
      if (!active.closest(".invoice-details-table")) return
      // Find all focusable inputs in the table
      const focusable = Array.from(
        document.querySelectorAll(
          ".invoice-details-table input, .invoice-details-table select, .invoice-details-table textarea, .invoice-details-table [tabindex='0']"
        )
      ) as HTMLElement[]
      if (focusable.length === 0) return
      const idx = focusable.indexOf(active)
      let nextIdx = e.shiftKey ? idx - 1 : idx + 1
      if (nextIdx < 0) nextIdx = focusable.length - 1
      if (nextIdx >= focusable.length) nextIdx = 0
      e.preventDefault()
      focusable[nextIdx].focus()
      focusable[nextIdx].scrollIntoView({ block: "nearest", inline: "nearest" })
    }
    document.addEventListener("keydown", handleTabNavigation, true)
    return () => {
      document.removeEventListener("keydown", handleTabNavigation, true)
    }
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="invoice-details-table w-full overflow-x-auto rounded-lg border bg-white shadow-md dark:bg-zinc-900">
      <FormProvider {...invoiceDetailForm}>
        <Card className="border-none shadow-lg">
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-sm hover:shadow"
                    onClick={handleAddRow}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Row
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Export to Excel"
                    onClick={handleExportExcel}
                  >
                    <FileSpreadsheet className="mr-1 h-4 w-4 text-green-600" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Export to PDF"
                    onClick={() => handleExportPdf(data)}
                  >
                    <FileText className="mr-1 h-4 w-4 text-red-600" />
                    Pdf
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Save Layout"
                    onClick={handleSaveLayout}
                  >
                    <Layout className="mr-1 h-4 w-4" />
                    Save Layout
                  </Button>
                  {Object.keys(rowSelection).length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const selectedRows = table.getSelectedRowModel().rows
                        selectedRows.forEach((row) => {
                          handleDeleteRow(row.index)
                        })
                        setRowSelection({})
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete {Object.keys(rowSelection).length} records
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-[300px]"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <SlidersHorizontal className="mr-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <div className="p-2">
                        <Input
                          placeholder="Search columns..."
                          value={columnSearch}
                          onChange={(e) => setColumnSearch(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      <div className="flex gap-2 p-2">
                        <Button
                          variant={
                            activeButton === "show" ? "default" : "outline"
                          }
                          size="sm"
                          className="flex-1"
                          onClick={handleShowAll}
                        >
                          Show All
                        </Button>
                        <Button
                          variant={
                            activeButton === "hide" ? "default" : "outline"
                          }
                          size="sm"
                          className="flex-1"
                          onClick={handleHideAll}
                        >
                          Hide All
                        </Button>
                      </div>
                      <DropdownMenuItem className="my-1 h-px p-0" disabled />
                      {filteredColumns.map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => {
                            column.toggleVisibility(!!value)
                          }}
                          onSelect={(e) => {
                            e.preventDefault()
                          }}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* 2. Responsive, sticky, zebra, modern table */}
              <div
                className="overflow-x-auto overflow-y-auto rounded-lg border"
                style={{ maxHeight: "calc(100vh - 200px)" }}
              >
                <Table
                  className="w-full min-w-[1200px] border-collapse border"
                  style={{ tableLayout: "fixed" }}
                >
                  <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className={
                              header.id === "actions"
                                ? "bg-muted/90 sticky left-0 z-20 border-r border-b border-gray-200 dark:border-zinc-800"
                                : "border-b border-gray-200 dark:border-zinc-800"
                            }
                            style={{
                              width: header.getSize(),
                              position:
                                header.id === "actions" ? "sticky" : "relative",
                              left: header.id === "actions" ? 0 : "auto",
                              zIndex: header.id === "actions" ? 20 : 10,
                            }}
                          >
                            {header.isPlaceholder
                              ? ""
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row, rowIdx) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className={
                            (rowIdx % 2 === 0
                              ? "bg-white dark:bg-zinc-900"
                              : "bg-gray-50 dark:bg-zinc-800") +
                            (row.getIsSelected() ? " ring-2 ring-blue-400" : "")
                          }
                          style={{ transition: "background 0.2s" }}
                        >
                          {row
                            .getVisibleCells()
                            .map((cell: Cell<InvoiceDetailRow, unknown>) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  cell.column.id === "actions"
                                    ? "bg-muted/90 sticky left-0 z-20 border-r border-gray-200 dark:border-zinc-800"
                                    : "border-gray-200 dark:border-zinc-800",
                                  "overflow-hidden px-2 py-1 align-middle text-sm text-ellipsis whitespace-nowrap select-text",
                                  "focus-within:ring-2 focus-within:ring-blue-400"
                                )}
                                style={{
                                  width: cell.column.getSize(),
                                  position:
                                    cell.column.id === "actions"
                                      ? "sticky"
                                      : "relative",
                                  left:
                                    cell.column.id === "actions" ? 0 : "auto",
                                  zIndex:
                                    cell.column.id === "actions" ? 20 : 10,
                                  outline: row.getIsSelected()
                                    ? "2px solid #2563eb"
                                    : undefined,
                                }}
                                tabIndex={-1}
                              >
                                {/* Tooltip for truncated/important fields */}
                                <div
                                  className="h-full w-full"
                                  title={
                                    typeof cell.getValue() === "string" &&
                                    (cell.getValue() as string).length > 20
                                      ? (cell.getValue() as string)
                                      : undefined
                                  }
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </div>
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          No data.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </FormProvider>
    </div>
  )
}
