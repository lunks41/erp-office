"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function AdminActivationPage() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const basePath = pathname.replace(/\/$/, "")
    router.replace(`${basePath}/account`)
  }, [router, pathname])

  return (
    <div className="container mx-auto flex h-64 items-center justify-center px-4 pt-2 pb-4">
      <div className="text-center">
        <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2" />
        <p className="text-muted-foreground text-sm">
          Redirecting to Accounts Activation...
        </p>
      </div>
    </div>
  )
}
