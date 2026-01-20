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

interface DeleteConfirmationProps {
  // Title of the confirmation dialog
  title?: string
  // Description of the confirmation dialog
  description?: string
  // Name of the item to delete (will be shown in the description)
  itemName?: string
  // Whether the dialog is open
  open?: boolean
  // Called when the dialog open state changes
  onOpenChange?: (open: boolean) => void
  // Called when the user confirms the deletion
  onConfirm: () => void
  // Called when the user cancels the deletion
  onCancelAction?: () => void
  // Whether the delete operation is in progress
  isDeleting?: boolean
}

export function DeleteConfirmation({
  title = "Are you sure?",
  description = "This action cannot be undone.",
  itemName,
  open,
  onOpenChange,
  onConfirm,
  onCancelAction,
  isDeleting = false,
}: DeleteConfirmationProps) {
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

  // Construct the full description
  const fullDescription = itemName
    ? `You are about to delete "${itemName}". ${description}`
    : description

  const hasMultipleItems = itemName && itemName.includes("<br/>")

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent
        className={hasMultipleItems ? "max-h-[90vh] flex flex-col" : ""}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasMultipleItems ? (
              <div className="flex flex-col">
                <p className="mb-2 font-medium text-red-600">
                  You are about to delete:
                </p>
                <div
                  className="max-h-[50vh] overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3 font-medium text-red-700"
                  dangerouslySetInnerHTML={{ __html: itemName }}
                />
                <p className="mt-2 text-red-600">{description}</p>
              </div>
            ) : (
              <div className="text-red-600">{fullDescription}</div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Spinner className="mr-2" size="sm" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
