"use client"

import { useParams } from "next/navigation"

import { TallyServiceDetailPage } from "../components/tally-service-detail-page"

export default function TallyServiceByIdPage() {
  const params = useParams()
  const tallyServiceId = params.tallyServiceId as string

  return (
    <TallyServiceDetailPage mode="edit" tallyServiceId={tallyServiceId} />
  )
}
