"use client"

import { IPdaHd, PDA_STATUS } from "@/interfaces/IPda"
import { Button } from "@/components/ui/button"

import { PdaStatusBadge } from "./PdaStatusBadge"

interface PdaListTableProps {
  rows: IPdaHd[]
  onRowClick: (row: IPdaHd) => void
  onEdit: (row: IPdaHd) => void
  onClone: (row: IPdaHd) => void
  onApprove: (row: IPdaHd) => void
  onDelete: (row: IPdaHd) => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0))

export function PdaListTable({
  rows,
  onRowClick,
  onEdit,
  onClone,
  onApprove,
  onDelete,
}: PdaListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="p-2 text-left">PDA No</th>
            <th className="p-2 text-left">Job Order</th>
            <th className="p-2 text-left">Vessel</th>
            <th className="p-2 text-left">Port</th>
            <th className="p-2 text-left">Type of Call</th>
            <th className="p-2 text-left">Currency</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.pdaId}
              className="cursor-pointer border-t hover:bg-muted/30"
              onClick={() => onRowClick(row)}
            >
              <td className="p-2">{row.pdaNo}</td>
              <td className="p-2">{row.jobOrderNo}</td>
              <td className="p-2">{row.vesselName}</td>
              <td className="p-2">{row.portName}</td>
              <td className="p-2">{row.typeOfCall}</td>
              <td className="p-2">{row.currencyCode}</td>
              <td className="p-2 text-right">{fmt(row.grandTotal || row.totalAmount)}</td>
              <td className="p-2">
                <PdaStatusBadge status={row.status} />
              </td>
              <td className="p-2">
                <div
                  className="flex flex-wrap gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onClone(row)}>
                    Clone
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-700"
                    disabled={row.status !== PDA_STATUS.DRAFT}
                    onClick={() => onApprove(row)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
