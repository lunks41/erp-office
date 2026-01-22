"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface PhotoUploadProps {
  currentPhoto?: string
  onPhotoChange: (filePath: string) => void
  isDisabled?: boolean
  label?: string
  className?: string
  photoType?: "employee" | "profile"
  userId?: string
  userName?: string
}

export default function PhotoUpload({
  currentPhoto,
  onPhotoChange,
  isDisabled = false,
  label = "Employee Photo",
  className = "",
  photoType = "employee",
  userId = "",
  userName = "",
}: PhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file.")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Please select an image smaller than 5MB.")
        return
      }

      try {
        // Create preview URL
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)

        // Upload file to server
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("photoType", photoType)
        formData.append("userId", userId)
        if (userName) {
          formData.append("userName", userName)
        }

        const response = await fetch("/api/photos/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const result = await response.json()

        if (result.success) {
          toast.success("Photo uploaded successfully")
          onPhotoChange(result.filePath)
        } else {
          throw new Error(result.error || "Upload failed")
        }
      } catch (error) {
        console.error("Error uploading photo:", error)
        toast.error("Failed to upload photo. Please try again.")
        setPreviewUrl(null)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleRemovePhoto = () => {
    setPreviewUrl(null)
    onPhotoChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getPhotoUrl = () => {
    if (previewUrl) {
      return previewUrl
    }
    if (currentPhoto) {
      // Check if it's a base64 string or a file path
      if (currentPhoto.startsWith("data:") || currentPhoto.length > 100) {
        // It's a base64 string
        return `data:image/jpeg;base64,${currentPhoto}`
      } else {
        // It's a file path
        return currentPhoto
      }
    }
    // Return default photo based on type
    return photoType === "employee"
      ? "/uploads/employee/default.png"
      : "/uploads/avatars/default.png"
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>

      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50">
            {getPhotoUrl() ? (
              <img
                src={getPhotoUrl()}
                alt="Photo"
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Fallback to default image if the photo fails to load
                  const target = e.target as HTMLImageElement
                  target.src =
                    photoType === "employee"
                      ? "/uploads/employee/default.png"
                      : "/uploads/avatars/default.png"
                }}
              />
            ) : (
              <div className="text-center">
                <Camera className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No photo</p>
              </div>
            )}
          </div>

          {getPhotoUrl() && !isUploading && (
            <Button
              size="icon"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemovePhoto}
              disabled={isDisabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose Photo
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isDisabled || isUploading}
          />
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Supported formats: JPG, PNG, GIF (Max 5MB)
        </p>
      </div>
    </div>
  )
}
