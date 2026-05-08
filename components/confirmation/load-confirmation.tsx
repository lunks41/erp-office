"use client"

// Add reusable dialog component (outside main component)


import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Spinner } from "../ui/spinner"

type LoadConfirmationProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoad: () => void
  onCancelAction?: () => void
  code?: string
  name?: string
  typeLabel: string
  isLoading?: boolean
  className?: string
  description?: string
  showDetails?: boolean
}

export const LoadConfirmation = ({
  open,
  onOpenChange,
  onLoad,
  onCancelAction,
  code,
  name,
  typeLabel,
  isLoading = false,
  className,
  description,
  showDetails = true,
}: LoadConfirmationProps) => {
  const handleCancel = () => {
    onCancelAction?.()
    onOpenChange(false)
  }

  const handleLoad = () => {
    if (!isLoading) {
      onLoad()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Prevent closing while loading
        if (!isLoading) {
          onOpenChange(isOpen)
        }
      }}
    >
      <DialogContent
        className={className}
        onInteractOutside={(e) => {
          // Prevent closing on outside click while loading
          if (isLoading) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Record Found</DialogTitle>
          <DialogDescription>
            {description ||
              `A ${typeLabel} record with this code already exists. Do you want to load it?`}
          </DialogDescription>
        </DialogHeader>

        {showDetails && (code || name) && (
          <div className="space-y-2 py-4">
            {code && (
              <p className="text-sm">
                <span className="font-medium">Code:</span>{" "}
                <span className="bg-muted rounded px-2 py-1 font-mono">
                  {code}
                </span>
              </p>
            )}
            {name && (
              <p className="text-sm">
                <span className="font-medium">Name:</span>{" "}
                <span className="text-muted-foreground">{name}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Loading...
              </>
            ) : (
              "Load"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
