"use client"

import { CheckCircle2, Circle, Mail, Send, ShieldCheck } from "lucide-react"

import { PDA_STATUS } from "@/interfaces/IPda"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PdaTimelineProps {
  status: number
}

interface TimelineStep {
  key: "draft" | "approved" | "sent" | "converted"
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const STEPS: TimelineStep[] = [
  {
    key: "draft",
    label: "Draft",
    description: "PDA created and currently editable.",
    icon: Circle,
  },
  {
    key: "approved",
    label: "Approved",
    description: "Approved internally and locked for review.",
    icon: ShieldCheck,
  },
  {
    key: "sent",
    label: "Sent",
    description: "Shared with customer for confirmation.",
    icon: Send,
  },
  {
    key: "converted",
    label: "Converted",
    description: "Converted to DA and completed.",
    icon: Mail,
  },
]

function getCurrentStepIndex(status: number) {
  if (status === PDA_STATUS.CONVERTED) return 3
  if (status === PDA_STATUS.APPROVED) return 1
  return 0
}

export function PdaTimeline({ status }: PdaTimelineProps) {
  const currentStepIndex = getCurrentStepIndex(status)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="relative space-y-3">
          <div className="bg-border absolute top-0 left-4 h-full w-0.5" />

          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const Icon = step.icon

            return (
              <div key={step.key} className="relative flex gap-4">
                <div className="relative z-10 shrink-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                      isCompleted || isCurrent
                        ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                        : "bg-muted border-border text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-1 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{step.label}</span>
                    <Badge
                      variant="outline"
                      className={
                        isCompleted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : isCurrent
                            ? "border-border bg-card text-blue-700"
                            : "text-muted-foreground"
                      }
                    >
                      {isCompleted ? "Done" : isCurrent ? "Current" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

