"use client"

import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface CloneConfirmationProps {
  title?: string
  description?: string
  /** When true, shows `description` only (no "Do you want to clone…" prefix). */
  skipDefaultPrompt?: boolean
  itemName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm: () => void
  onCancelAction?: () => void
  /** Wizard step: return to the previous screen (e.g. service selection). */
  onBack?: () => void
  backLabel?: string
  cancelLabel?: string
  confirmLabel?: string
  isCloning?: boolean
  /** When false, parent closes the dialog after async clone (default true for AR/AP/CB/GL). */
  closeOnConfirm?: boolean
}

export function CloneConfirmation({
  title = "Clone Confirmation",
  description = "This will create a copy as a new record.",
  skipDefaultPrompt = false,
  itemName,
  open,
  onOpenChange,
  onConfirm,
  onCancelAction,
  onBack,
  backLabel = "Back",
  cancelLabel = "Cancel",
  confirmLabel = "Clone",
  isCloning = false,
  closeOnConfirm = true,
}: CloneConfirmationProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const handleConfirm = () => {
    onConfirm()
    if (closeOnConfirm) {
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    onCancelAction?.()
    setIsOpen(false)
  }

  const handleBack = () => {
    onBack?.()
    setIsOpen(false)
  }

  const fullDescription = skipDefaultPrompt
    ? description
    : itemName
      ? `Do you want to clone "${itemName}"? ${description}`
      : `Do you want to clone this record? ${description}`

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="text-blue-600">{fullDescription}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row flex-wrap items-center gap-3 sm:justify-end">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              className="mr-auto"
              onClick={handleBack}
              disabled={isCloning}
            >
              {backLabel}
            </Button>
          ) : null}
          <AlertDialogCancel onClick={handleCancel} disabled={isCloning}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isCloning}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isCloning && <Spinner className="mr-2" size="sm" />}
            {isCloning ? "Cloning..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
