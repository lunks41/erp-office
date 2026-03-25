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
import { Spinner } from "@/components/ui/spinner"

interface SaveConfirmationProps {
  // Title of the confirmation dialog
  title?: string
  // Name of the item to save (will be shown in the description)
  itemName?: string
  // When set, replaces the default "Do you want to …" description
  description?: string
  // Whether the dialog is open
  open?: boolean
  // Called when the dialog open state changes
  onOpenChange?: (open: boolean) => void
  // Called when the user confirms the save
  onConfirm: () => void
  // Called when the user cancels the save
  onCancelAction?: () => void
  // Whether the save operation is in progress
  isSaving?: boolean
  // Type of operation (create, update, etc.)
  operationType?: "create" | "update" | "save" | "clone"
}

export function SaveConfirmation({
  title = "Are you sure?",
  itemName,
  description,
  open,
  onOpenChange,
  onConfirm,
  onCancelAction,
  isSaving = false,
  operationType = "save",
}: SaveConfirmationProps) {
  // Use internal state if open/onOpenChange are not provided
  const [internalOpen, setInternalOpen] = useState(false)

  // Determine if we're using controlled or uncontrolled state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Handle the confirm action
  const handleConfirm = () => {
    onConfirm()
    setIsOpen(false)
  }

  // Handle the cancel action
  const handleCancel = () => {
    onCancelAction?.()
    setIsOpen(false)
  }

  const fullDescription =
    description ??
    (itemName
      ? `Do you want to ${operationType} "${itemName}"?`
      : `Do you want to ${operationType} this item?`)

  // Get the appropriate button text based on operation type
  const getButtonText = () => {
    if (isSaving) {
      switch (operationType) {
        case "create":
          return "Creating..."
        case "clone":
          return "Cloning..."
        case "update":
          return "Updating..."
        default:
          return "Saving..."
      }
    }

    switch (operationType) {
      case "create":
        return "Yes, Create"
      case "clone":
        return "Yes, Clone"
      case "update":
        return "Yes, Update"
      default:
        return "Yes, Save"
    }
  }

  // Get the appropriate button color based on operation type
  const getButtonColor = () => {
    switch (operationType) {
      case "create":
      case "clone":
        return "!bg-green-600 !text-white hover:!bg-green-700"
      case "update":
        return "!bg-blue-600 !text-white hover:!bg-blue-700"
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90"
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{fullDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isSaving}>
            No
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isSaving}
            className={getButtonColor()}
          >
            {isSaving && <Spinner className="mr-2" size="sm" />}
            {getButtonText()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
