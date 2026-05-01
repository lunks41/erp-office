"use client"

import { IPdaDt } from "@/interfaces/IPda"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PdaLoadTariffDialogProps {
  open: boolean
  lines: IPdaDt[]
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function PdaLoadTariffDialog({
  open,
  lines,
  isLoading = false,
  onOpenChange,
  onConfirm,
}: PdaLoadTariffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Load from Tariff</DialogTitle>
          <DialogDescription>
            {lines.length} tariff line(s) found. Confirm to insert them into the charge
            grid.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[340px] overflow-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Task</th>
                <th className="p-2 text-left">Charge</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Rate</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={`${line.tariffId}-${line.tariffItemNo}-${line.itemNo}`}>
                  <td className="p-2">{line.itemNo}</td>
                  <td className="p-2">{line.taskName}</td>
                  <td className="p-2">{line.chargeName}</td>
                  <td className="p-2">{line.description}</td>
                  <td className="p-2">{line.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Loading..." : "Insert Lines"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
