"use client"

import { useMemo } from "react"
import { format, isValid } from "date-fns"

import { IPdaHd, PDA_STATUS_LABEL } from "@/interfaces/IPda"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface PdaHistoryProps {
  pda: IPdaHd | null
}

interface PdaHistoryRow {
  version: number
  statusLabel: string
  createdBy: string
  createdDate: string
  editedBy: string
  editedDate: string
}

const formatDate = (dateValue: string | Date | null | undefined) => {
  if (!dateValue) return "-"
  const parsed = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (!isValid(parsed) || Number.isNaN(parsed.getTime())) return "-"
  return format(parsed, "dd/MM/yyyy HH:mm:ss")
}

export function PdaHistory({ pda }: PdaHistoryProps) {
  const rows = useMemo<PdaHistoryRow[]>(
    () => [
      {
        version: 1,
        statusLabel: PDA_STATUS_LABEL[pda?.status ?? 0] || "Draft",
        createdBy: pda?.createById ? String(pda.createById) : "-",
        createdDate: formatDate(pda?.createDate),
        editedBy: pda?.editById ? String(pda.editById) : "-",
        editedDate: formatDate(pda?.editDate),
      },
    ],
    [pda]
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-semibold">
                Creation Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created By:</span>
                  <span className="text-sm">{rows[0]?.createdBy || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Created Date:</span>
                  <span className="text-sm">{rows[0]?.createdDate || "-"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-muted-foreground text-sm font-semibold">
                Last Modified
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Modified By:</span>
                  <span className="text-sm">{rows[0]?.editedBy || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Modified Date:</span>
                  <span className="text-sm">{rows[0]?.editedDate || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="p-2 text-left">Version</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Created By</th>
                  <th className="p-2 text-left">Created Date</th>
                  <th className="p-2 text-left">Edited By</th>
                  <th className="p-2 text-left">Edited Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.version} className="border-t">
                    <td className="p-2">
                      <Badge variant="secondary" className="text-xs">
                        {row.version}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {row.statusLabel}
                      </Badge>
                    </td>
                    <td className="p-2">{row.createdBy}</td>
                    <td className="p-2">{row.createdDate}</td>
                    <td className="p-2">{row.editedBy}</td>
                    <td className="p-2">{row.editedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

