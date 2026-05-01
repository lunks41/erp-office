"use client"

import { useParams } from "next/navigation"
import { PdaDetailPage } from "../components/pda-detail-page"

export default function PdaDetailRoutePage() {
  const params = useParams()
  const pdaId = Number(params.pdaId || 0)

  return <PdaDetailPage pdaId={pdaId} />
}
