"use client"

import { PdaEditorPage } from "./PdaEditorPage"

interface PdaDetailPageProps {
  pdaId: number
}

export function PdaDetailPage({ pdaId }: PdaDetailPageProps) {
  return <PdaEditorPage mode="detail" pdaId={pdaId} />
}
