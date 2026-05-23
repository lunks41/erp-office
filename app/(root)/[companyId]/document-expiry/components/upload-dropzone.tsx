"use client"

import { useCallback, useState } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

export function UploadDropzone({
  onFileSelect,
  disabled,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  className,
}: {
  onFileSelect: (file: File) => void
  disabled?: boolean
  accept?: string
  className?: string
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length || disabled) return
      onFileSelect(files[0])
    },
    [disabled, onFileSelect]
  )

  return (
    <label
      className={cn(
        "border-muted-foreground/30 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 transition-colors",
        dragOver && "border-primary bg-muted/50",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <Upload className="text-muted-foreground h-8 w-8" />
      <span className="text-sm font-medium">Drop file or click to upload</span>
      <span className="text-muted-foreground text-xs">
        PDF, Word, or images
      </span>
      <input
        type="file"
        className="sr-only"
        accept={accept}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  )
}
