"use client"

import { format } from "date-fns"

import CustomAccordion, {
  CustomAccordionContent,
  CustomAccordionItem,
  CustomAccordionTrigger,
} from "@/components/custom/custom-accordion"

interface AuditTrailAccordionProps {
  createBy?: string | null
  createDate?: string | Date | null
  editBy?: string | null
  editDate?: string | Date | null
  datetimeFormat: string
  className?: string
}

export function AuditTrailAccordion({
  createBy,
  createDate,
  editBy,
  editDate,
  datetimeFormat,
  className,
}: AuditTrailAccordionProps) {
  const hasAuditData = !!(createBy || createDate || editBy || editDate)
  if (!hasAuditData) return null

  return (
    <div className={className ?? "space-y-1 pt-1"}>
      <div className="border-t pt-2">
        <CustomAccordion
          type="single"
          collapsible
          className="rounded-md border border-slate-200"
        >
          <CustomAccordionItem value="audit-info" className="border-none">
            <CustomAccordionTrigger className="hover:bg-muted/30 rounded-t-md px-4 py-1.5">
              <div className="mr-2 flex flex-1 items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-600">
                  Audit Trail
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>Created</span>
                  <span>&bull;</span>
                  <span>Modified</span>
                </div>
              </div>
            </CustomAccordionTrigger>
            <CustomAccordionContent className="px-4 pb-0">
              <div className="grid grid-cols-1 gap-3 border-t py-1.5 md:grid-cols-2">
                {createDate && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                      Created By
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">
                        {createBy || "-"}
                      </span>
                      <span className="text-xs">
                        {format(new Date(createDate), datetimeFormat)}
                      </span>
                    </div>
                  </div>
                )}
                {editBy && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                      Last Modified By
                    </p>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="font-semibold text-slate-700">
                        {editBy}
                      </span>
                      <span className="text-xs">
                        {editDate ? format(new Date(editDate), datetimeFormat) : "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CustomAccordionContent>
          </CustomAccordionItem>
        </CustomAccordion>
      </div>
    </div>
  )
}
