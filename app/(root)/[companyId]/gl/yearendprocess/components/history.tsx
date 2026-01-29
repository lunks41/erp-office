"use client"

import { IGLOpeningBalance } from "@/interfaces"

interface HistoryProps {
  fetchedData?: IGLOpeningBalance | IGLOpeningBalance[]
  isEdit: boolean
}

export default function History({
  fetchedData,
  isEdit: _isEdit,
}: HistoryProps) {
  // Extract first item if array, or use the single item
  const firstItem: IGLOpeningBalance | undefined = fetchedData
    ? Array.isArray(fetchedData)
      ? fetchedData[0]
      : fetchedData
    : undefined

  const accountDetails = {
    createBy: firstItem?.createById?.toString() || "",
    createDate: firstItem?.createDate || "",
    editBy: firstItem?.editById?.toString() || "",
    editDate: firstItem?.editDate || "",
    cancelBy: "",
    cancelDate: "",
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4">
        <h3 className="mb-4 text-sm font-semibold">Account Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-muted-foreground text-xs">Created By</label>
            <p className="text-sm font-medium">
              {accountDetails.createBy || "-"}
            </p>
          </div>
          <div>
            <label className="text-muted-foreground text-xs">
              Created Date
            </label>
            <p className="text-sm font-medium">
              {accountDetails.createDate || "-"}
            </p>
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Edited By</label>
            <p className="text-sm font-medium">
              {accountDetails.editBy || "-"}
            </p>
          </div>
          <div>
            <label className="text-muted-foreground text-xs">Edited Date</label>
            <p className="text-sm font-medium">
              {accountDetails.editDate || "-"}
            </p>
          </div>
          {firstItem && (
            <>
              <div>
                <label className="text-muted-foreground text-xs">
                  Edit Version
                </label>
                <p className="text-sm font-medium">
                  {firstItem.editVersion || 0}
                </p>
              </div>
              <div>
                <label className="text-muted-foreground text-xs">
                  Document No
                </label>
                <p className="text-sm font-medium">
                  {firstItem.documentNo || "-"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
