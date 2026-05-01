"use client"

import { Fragment, useMemo, useState } from "react"
import { Circle, Plus, Trash2 } from "lucide-react"

import { IPdaDt } from "@/interfaces/IPda"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PdaChargeGridProps {
  lines: IPdaDt[]
  advanceReceived?: number
  vatAmount?: number
  onAddSection: (sectionNo: string, description: string) => void
  onAddSubRow: (sectionItemNo: number) => void
  onDeleteRow: (itemNo: number) => void
  onLineChange: (itemNo: number, field: keyof IPdaDt, value: unknown) => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0))

export function PdaChargeGrid({
  lines,
  advanceReceived = 0,
  vatAmount = 0,
  onAddSection,
  onAddSubRow,
  onDeleteRow,
  onLineChange,
}: PdaChargeGridProps) {
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [showAddSectionForm, setShowAddSectionForm] = useState(false)
  const [newSectionNo, setNewSectionNo] = useState("")
  const [newSectionDesc, setNewSectionDesc] = useState("")

  const groupedLines = useMemo(() => {
    const sections = lines.filter((r) => r.rowType === 1)
    return sections.map((section) => ({
      ...section,
      children: lines.filter((r) => r.rowType === 0 && r.parentItemNo === section.itemNo),
    }))
  }, [lines])

  const subTotal = lines.reduce(
    (sum, line) => sum + (line.rowType === 1 ? 0 : Number(line.amount || 0)),
    0
  )
  const grandTotal = subTotal + Number(vatAmount || 0) - Number(advanceReceived || 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => setShowAddSectionForm(true)}>
          Add Section
        </Button>
        {selectedSection ? (
          <Button type="button" onClick={() => onAddSubRow(selectedSection)}>
            Add Sub-row To Selected Section
          </Button>
        ) : null}
      </div>

      {showAddSectionForm ? (
        <div className="grid gap-2 rounded-md border p-3 md:grid-cols-[120px_1fr_auto]">
          <Input
            placeholder="SectionNo"
            value={newSectionNo}
            onChange={(e) => setNewSectionNo(e.target.value)}
          />
          <Input
            placeholder="Section heading"
            value={newSectionDesc}
            onChange={(e) => setNewSectionDesc(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                if (!newSectionNo.trim() || !newSectionDesc.trim()) return
                onAddSection(newSectionNo.trim(), newSectionDesc.trim())
                setNewSectionNo("")
                setNewSectionDesc("")
                setShowAddSectionForm(false)
              }}
            >
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowAddSectionForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="p-2 text-left">SectionNo</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">UnitPrice</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-left">Comment</th>
            </tr>
          </thead>
          <tbody>
            {groupedLines.map((section) => (
              <Fragment key={`group-${section.itemNo}`}>
                <tr
                  key={`sec-${section.itemNo}`}
                  className="group cursor-pointer bg-blue-50 text-blue-800 font-medium dark:bg-blue-950"
                  onClick={() => setSelectedSection(section.itemNo)}
                >
                  <td className="p-2">{section.sectionNo || section.itemNo}</td>
                  <td className="p-2">{section.description}</td>
                  <td className="p-2 text-right" />
                  <td className="p-2">{fmt(section.sectionAmount || 0)}</td>
                  <td className="p-2" />
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-xs italic">{section.remarks}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddSubRow(section.itemNo)
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" /> sub-row
                      </Button>
                    </div>
                  </td>
                </tr>
                {section.children.map((line) => (
                  <tr key={`sub-${line.itemNo}`} className="bg-white">
                    <td className="p-2" />
                    <td className="p-2 pl-6">
                      <div className="flex items-center gap-2">
                        {line.isEstimate ? (
                          <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
                        ) : null}
                        <span>{line.description}</span>
                      </div>
                    </td>
                    <td className="p-2 text-right text-muted-foreground">${fmt(line.rate)}</td>
                    <td className="p-2">
                      <Input value={fmt(line.amount)} readOnly />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        className="w-24"
                        step="0.01"
                        value={line.qty}
                        onChange={(e) =>
                          onLineChange(line.itemNo, "qty", Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="p-2">
                      <div
                        className={`text-xs italic ${
                          line.isWarningComment || /surcharge/i.test(line.remarks || "")
                            ? "text-orange-600 font-medium"
                            : "text-blue-600"
                        }`}
                      >
                        {line.remarks}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteRow(line.itemNo)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}

            {groupedLines.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                  Add a section to start entering charge lines.
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot className="bg-muted/40 font-medium">
            <tr>
              <td className="p-2" colSpan={3}>
                Sub Total
              </td>
              <td className="p-2">{fmt(subTotal)}</td>
              <td className="p-2" colSpan={2} />
            </tr>
            <tr>
              <td className="p-2" colSpan={3}>
                VAT
              </td>
              <td className="p-2">{fmt(vatAmount)}</td>
              <td className="p-2" colSpan={2} />
            </tr>
            <tr>
              <td className="p-2" colSpan={3}>
                Advance Received
              </td>
              <td className="p-2">{fmt(advanceReceived)}</td>
              <td className="p-2" colSpan={2} />
            </tr>
            <tr className="font-semibold">
              <td className="p-2" colSpan={3}>
                Grand Total
              </td>
              <td className="p-2">{fmt(grandTotal)}</td>
              <td className="p-2" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
