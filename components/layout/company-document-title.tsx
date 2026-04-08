"use client"

import { useEffect } from "react"
import { useParams, usePathname } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "ERP"

/**
 * Sets the tab title to include the active company name for /[companyId]/* routes.
 * Resets to the site name when this layout unmounts (e.g. navigating to company-select).
 */
export function CompanyDocumentTitle() {
  const params = useParams()
  const pathname = usePathname()
  const companyId = params.companyId as string | undefined
  const currentCompany = useAuthStore((s) => s.currentCompany)

  useEffect(() => {
    return () => {
      document.title = siteName
    }
  }, [])

  useEffect(() => {
    if (
      !companyId ||
      currentCompany?.companyId !== companyId ||
      !currentCompany.companyName
    ) {
      return
    }
    const fullTitle = `${currentCompany.companyName} – ${siteName}`
    const apply = () => {
      document.title = fullTitle
    }
    // Next.js overwrites document.title on client navigations from root metadata; pathname
    // is in deps so we re-apply. setTimeout(0) runs after Next's title update in the same tick.
    apply()
    const timeoutId = window.setTimeout(apply, 0)
    return () => window.clearTimeout(timeoutId)
  }, [
    companyId,
    pathname,
    currentCompany?.companyId,
    currentCompany?.companyName,
  ])

  return null
}
