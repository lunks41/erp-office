import { GLOpeningBalanceSchemaType } from "@/schemas"
import { format } from "date-fns"

import { clientDateFormat } from "@/lib/date-utils"

const buildDefaultOpeningBalance = (
  companyId: number,
  createById: number,
  itemNo: number,
  dateFormat: string
): GLOpeningBalanceSchemaType => ({
  companyId,
  documentId: "0",
  itemNo,
  glId: 0,
  documentNo: "",
  accountDate: format(new Date(), dateFormat),
  customerId: 0,
  supplierId: 0,
  currencyId: 0,
  exhRate: 1,
  isDebit: true,
  totAmt: 0,
  totLocalAmt: 0,
  departmentId: 0,
  employeeId: 0,
  productId: 0,
  portId: 0,
  vesselId: 0,
  bargeId: 0,
  voyageId: 0,
  isSystem: false,
  createById,
  createDate: format(new Date(), dateFormat),
  editById: null,
  editDate: null,
  editVersion: 0,
})

// Function to get default values with custom date format
export const getDefaultValues = (
  companyId: number,
  createById: number,
  dateFormat: string = clientDateFormat
) => ({
  defaultOpeningBalanceDetails: buildDefaultOpeningBalance(
    companyId,
    createById,
    1,
    dateFormat
  ),
})

export const defaultOpeningBalanceDetails = buildDefaultOpeningBalance(
  0,
  0,
  1,
  clientDateFormat
)
