"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface PdaConvertToDaDialogProps {
  open: boolean
  pdaAmount: number
  onOpenChange: (open: boolean) => void
  onConfirm: (actualAmount: number) => void
}

export function PdaConvertToDaDialog({
  open,
  pdaAmount,
  onOpenChange,
  onConfirm,
}: PdaConvertToDaDialogProps) {
  const [actualAmount, setActualAmount] = useState<number>(pdaAmount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert PDA to DA</DialogTitle>
          <DialogDescription>
            Compare PDA amount with actual DA amount before conversion.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">PDA Amount</label>
            <Input value={pdaAmount} readOnly />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Actual Amount</label>
            <Input
              type="number"
              step="0.01"
              value={actualAmount}
              onChange={(e) => setActualAmount(Number(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(actualAmount)}>Convert to DA</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
