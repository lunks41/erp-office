"use client"

import { PDA_STATUS, PDA_STATUS_LABEL } from "@/interfaces/IPda"
import { Badge } from "@/components/ui/badge"

interface PdaStatusBadgeProps {
  status: number
}

export function PdaStatusBadge({ status }: PdaStatusBadgeProps) {
  const label = PDA_STATUS_LABEL[status] ?? "Unknown"
  const className =
    status === PDA_STATUS.APPROVED
      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
      : status === PDA_STATUS.CONVERTED
        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
        : "bg-slate-100 text-slate-700 hover:bg-slate-100"

  return <Badge className={className}>{label}</Badge>
}
