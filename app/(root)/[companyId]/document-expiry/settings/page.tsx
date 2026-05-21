"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  FileStack,
  FolderTree,
  Link2,
  Tags,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const links = [
  {
    title: "Document types",
    description: "Passport, visa, trade license, and other expiry document types.",
    href: "document-types",
    icon: Tags,
  },
  {
    title: "Categories",
    description: "Group documents by area (employee, vessel, transport, etc.).",
    href: "categories",
    icon: FolderTree,
  },
  {
    title: "Reference types",
    description: "What the document is linked to (employee, vessel, customer, …).",
    href: "reference-types",
    icon: Link2,
  },
  {
    title: "Statuses",
    description: "Expiry workflow statuses shown on documents and dashboards.",
    href: "statuses",
    icon: FileStack,
  },
  {
    title: "Reminder rules",
    description: "When to notify users before documents expire.",
    href: "reminders",
    icon: Bell,
  },
]

export default function DocumentExpirySettingsPage() {
  const params = useParams()
  const companyId = String(params.companyId ?? "")
  const base = `/${companyId}/document-expiry/settings`

  return (
    <div className="@container mx-auto space-y-4 px-4 pt-2 pb-6 sm:px-6 sm:pt-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/${companyId}/document-expiry/dashboard`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Link>
      </Button>

      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Document Expiry settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure lookup data used by document forms and the expiry engine.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={`${base}/${item.href}`}>
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                  <Icon className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
