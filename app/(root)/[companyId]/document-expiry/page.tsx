import { redirect } from "next/navigation"

export default async function DocumentExpiryIndexPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  redirect(`/${companyId}/document-expiry/dashboard`)
}
