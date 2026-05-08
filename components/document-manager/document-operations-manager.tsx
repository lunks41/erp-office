"use client"

import { useCallback, useMemo, useState } from "react"
import { IDocType, IDocument, IDocumentTypeLookup } from "@/interfaces/lookup"
import { useQueryClient } from "@tanstack/react-query"
import {
  Download,
  FileIcon,
  FileText,
  Printer,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Admin } from "@/lib/api-routes"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import DocumentTypeAutocomplete from "@/components/autocomplete/autocomplete-document-type"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import CustomTextarea from "@/components/custom/custom-textarea"

import DocumentOperationsManagerTable from "./document-operations-manager-table"

interface DocumentOperationsManagerProps {
  moduleId: number
  transactionId: number
  recordId?: string // Invoice ID, etc.
  recordNo?: string // Invoice No, etc.
  companyId?: number
  onUploadSuccess?: () => void
  maxFileSize?: number // in MB
  allowedFileTypes?: string[]
  maxFiles?: number
}

interface UploadFile {
  file: File
  id: string
  preview?: string
  progress?: number
  status?: "pending" | "uploading" | "success" | "failed"
  error?: string
}

export default function DocumentOperationsManager({
  moduleId,
  transactionId,
  recordId = "0",
  recordNo = "",
  companyId,
  onUploadSuccess,
  maxFileSize = 10, // 10MB default
  allowedFileTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
  ],
  maxFiles = 20,
}: DocumentOperationsManagerProps) {
  const form = useForm()
  const queryClient = useQueryClient()

  const [selectedDocType, setSelectedDocType] =
    useState<IDocumentTypeLookup | null>(null)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<IDocType | null>(
    null
  )
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [documentToDelete, setDocumentToDelete] = useState<IDocType | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [documentsToDelete, setDocumentsToDelete] = useState<IDocType[]>([])

  const { data: documents, isLoading } = useGet<IDocType>(
    `${Admin.getDocumentById}/${moduleId}/${transactionId}/${recordId}`,
    `documents-${moduleId}-${transactionId}-${recordId}`
  )

  const buildDocKey = useCallback(
    (doc: IDocType) => `${doc.documentId}-${doc.itemNo}`,
    []
  )

  const saveDocumentMutation = usePersist<IDocument | IDocument[]>(
    Admin.saveDocument
  )
  const deleteDocumentMutation = useDelete(Admin.deleteDocument)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  // Add files with validation - memoized to prevent re-creation
  const addFiles = useCallback(
    (files: File[]) => {
      setUploadFiles((prev) => {
        const newFiles: UploadFile[] = []

        for (const file of files) {
          // Check file count
          if (prev.length + newFiles.length >= maxFiles) {
            toast.error(`Maximum ${maxFiles} files allowed`)
            break
          }

          // Check file size
          const fileSizeMB = file.size / (1024 * 1024)
          if (fileSizeMB > maxFileSize) {
            toast.error(`${file.name} exceeds ${maxFileSize}MB limit`)
            continue
          }

          // Check file type
          const fileExt = "." + file.name.split(".").pop()?.toLowerCase()
          if (!allowedFileTypes.includes(fileExt)) {
            toast.error(`${file.name} type not allowed`)
            continue
          }

          // Add file
          newFiles.push({
            file,
            id: Math.random().toString(36).substr(2, 9),
            progress: 0,
            status: "pending",
          })
        }

        if (newFiles.length > 0) {
          toast.success(`${newFiles.length} file(s) added`)
          return [...prev, ...newFiles]
        }

        return prev
      })
    },
    [maxFiles, maxFileSize, allowedFileTypes]
  )

  // Remove file from upload queue
  const removeFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Retry failed upload
  const retryUpload = (id: string) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: "pending", progress: 0, error: undefined }
          : f
      )
    )
  }

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      addFiles(files)
    },
    [addFiles]
  )

  // Upload all files
  const handleUploadAll = async () => {
    if (!selectedDocType || uploadFiles.length === 0) {
      toast.error("Please select document type and add files")
      return
    }

    if (recordId === "0") {
      toast.error("Please save the record first before uploading documents")
      return
    }

    setIsUploading(true)
    let successCount = 0
    let failCount = 0

    try {
      // Step 1: Get the maximum itemNo from existing documents
      let maxItemNo = 0
      if (Array.isArray(documents?.data) && documents.data.length > 0) {
        maxItemNo = Math.max(
          ...(documents.data as IDocType[]).map((doc) => doc.itemNo || 0)
        )
      }

      // Step 2: Upload all files and collect their paths
      const documentsToSave: IDocument[] = []

      for (let index = 0; index < uploadFiles.length; index++) {
        const uploadFile = uploadFiles[index]

        // Update status to uploading
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "uploading", progress: 0 }
              : f
          )
        )

        try {
          // Upload the file to get the file path
          const formData = new FormData()
          formData.append("file", uploadFile.file)
          formData.append("moduleId", moduleId.toString())
          formData.append("transactionId", transactionId.toString())
          formData.append("documentId", recordId)
          if (companyId) {
            formData.append("companyId", companyId.toString())
          }

          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id && f.status === "uploading"
                  ? {
                      ...f,
                      progress: Math.min(
                        (f.progress || 0) + Math.random() * 20,
                        90
                      ),
                    }
                  : f
              )
            )
          }, 200)

          const uploadResponse = await fetch(`/api/documents/upload`, {
            method: "POST",
            body: formData,
          })

          clearInterval(progressInterval)

          if (!uploadResponse.ok) {
            throw new Error("File upload failed")
          }

          const uploadResult = await uploadResponse.json()
          const filePath = uploadResult.filePath || uploadFile.file.name

          // Update status to success
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: "success", progress: 100 }
                : f
            )
          )

          // Collect document metadata with incremented itemNo
          const documentData: IDocument = {
            transactionId: transactionId,
            moduleId: moduleId,
            documentId: recordId,
            documentNo: recordNo,
            itemNo: maxItemNo + index + 1,
            docTypeId: selectedDocType.docTypeId,
            docPath: filePath,
            remarks: form.getValues("remarks") || "",
          }

          documentsToSave.push(documentData)
          successCount++
        } catch (error) {
          console.error(`Failed to upload ${uploadFile.file.name}:`, error)
          failCount++

          // Update status to failed
          setUploadFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: "failed",
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : f
            )
          )
        }
      }

      // Step 3: Save all document metadata in one API call
      if (documentsToSave.length > 0) {
        try {
          const saveResult =
            await saveDocumentMutation.mutateAsync(documentsToSave)

          if (saveResult.result === 1) {
            toast.success(
              `${successCount} document(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ""}`
            )

            // Clear successful uploads after a delay
            setTimeout(() => {
              setUploadFiles((prev) =>
                prev.filter((f) => f.status !== "success")
              )
              if (uploadFiles.every((f) => f.status === "success")) {
                setSelectedDocType(null)
                form.setValue("docTypeId", "")
                form.setValue("remarks", "")
              }
            }, 2000)

            queryClient.invalidateQueries({
              queryKey: [`documents-${moduleId}-${transactionId}-${recordId}`],
            })
            onUploadSuccess?.()
          } else {
            throw new Error(saveResult.message || "Save failed")
          }
        } catch (error) {
          console.error("Failed to save documents:", error)
          toast.error("Failed to save document metadata")
        }
      } else {
        toast.error("All uploads failed")
      }
    } finally {
      setIsUploading(false)
    }
  }

  // Delete document - opens confirmation dialog
  const handleDelete = (doc: IDocType) => {
    setDocumentToDelete(doc)
  }

  // Confirm delete and perform actual deletion
  const handleConfirmDelete = async () => {
    if (!documentToDelete) return

    setIsDeleting(true)
    try {
      // Build the full API URL with all required parameters
      const deleteUrl = `/${moduleId}/${transactionId}/${documentToDelete.documentId}/${documentToDelete.itemNo}`
      const response = await deleteDocumentMutation.mutateAsync(deleteUrl)

      if (response.result === 1) {
        // Also delete the physical file
        try {
          // Extract the relative path from docPath and encode each segment
          const pathSegments = documentToDelete.docPath
            .replace(/^\/documents\//, "")
            .split("/")
            .map((segment) => encodeURIComponent(segment))
            .join("/")
          const deleteFileResponse = await fetch(
            `/api/documents/delete/${pathSegments}`,
            {
              method: "DELETE",
            }
          )
          if (!deleteFileResponse.ok) {
            console.warn(
              "Failed to delete physical file:",
              documentToDelete.docPath
            )
          }
        } catch (fileError) {
          console.error("Error deleting physical file:", fileError)
        }

        queryClient.invalidateQueries({
          queryKey: [`documents-${moduleId}-${transactionId}-${recordId}`],
        })

        toast.success("Document deleted successfully")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete document")
    } finally {
      setIsDeleting(false)
      setDocumentToDelete(null)
    }
  }

  // Preview document
  const handlePreview = (doc: IDocType) => {
    setSelectedDocument(doc)
    // Use API route for serving documents with proper cache control
    // Encode each path segment to handle special characters in file names
    const pathSegments = doc.docPath
      .replace("/documents/", "")
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
    const cacheBuster = `?v=${Date.now()}`
    setPreviewUrl(`/api/documents/serve/${pathSegments}${cacheBuster}`)
  }

  // Download document
  const handleDownload = (doc: IDocType) => {
    const link = document.createElement("a")
    // Use API route for serving documents with proper cache control
    // Encode each path segment to handle special characters in file names
    const pathSegments = doc.docPath
      .replace("/documents/", "")
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
    const cacheBuster = `?v=${Date.now()}`
    link.href = `/api/documents/serve/${pathSegments}${cacheBuster}`
    // Use original file name from database for download (preserved in fileName field)
    link.download = doc.docPath.split("/").pop() || "document"
    link.click()
  }

  // Handle bulk selection change
  const handleBulkSelectionChange = useCallback((selectedIds: string[]) => {
    console.log("handleBulkSelectionChange called with:", selectedIds)
    setSelectedDocumentIds(selectedIds)
  }, [])

  // Bulk download documents
  const handleBulkDownload = useCallback(() => {
    console.log("handleBulkDownload called")
    console.log("selectedDocumentIds:", selectedDocumentIds)
    console.log("documents?.data:", documents?.data)

    if (selectedDocumentIds.length === 0) {
      toast.error("Please select at least one document to download")
      return
    }

    if (!Array.isArray(documents?.data)) {
      toast.error("No documents available")
      return
    }

    // Convert all IDs to strings for comparison
    const selectedIdsSet = new Set(selectedDocumentIds.map((id) => id.trim()))
    console.log("selectedIdsSet:", Array.from(selectedIdsSet))
    console.log(
      "All document keys:",
      documents.data.map((d: IDocType) => buildDocKey(d))
    )

    let selectedDocs = (documents.data as IDocType[]).filter((doc) => {
      const docKey = buildDocKey(doc)
      const isSelected = selectedIdsSet.has(docKey)
      console.log(
        `Document Key: "${docKey}" (itemNo: ${doc.itemNo}), Selected: ${isSelected}`
      )
      return isSelected
    })

    console.log("selectedDocs count:", selectedDocs.length)
    console.log("selectedDocumentIds count:", selectedDocumentIds.length)
    console.log(
      "selectedDocs:",
      selectedDocs.map((d) => ({ id: d.documentId, path: d.docPath }))
    )

    if (selectedDocs.length === 0) {
      toast.error("Selected documents not found")
      return
    }

    // Safety check: ensure we're not downloading more than selected
    if (selectedDocs.length > selectedDocumentIds.length) {
      console.error("ERROR: More documents matched than selected!", {
        selectedDocs: selectedDocs.length,
        selectedIds: selectedDocumentIds.length,
        selectedIdsArray: selectedDocumentIds,
        matchedDocKeys: selectedDocs.map((d) => buildDocKey(d)),
        allDocKeys: documents.data.map((d: IDocType) => buildDocKey(d)),
      })
      // Only download the exact number that was selected
      // Take only the documents that match the selected IDs exactly
      selectedDocs = selectedDocs
        .filter((doc) => {
          const docKey = buildDocKey(doc)
          return selectedIdsSet.has(docKey)
        })
        .slice(0, selectedDocumentIds.length)

      console.log(`Limiting download to ${selectedDocs.length} documents`)

      if (selectedDocs.length === 0) {
        toast.error("Could not match selected documents. Please try again.")
        return
      }
    }

    // Allow download if we have at least some documents (in case some were deleted)
    if (selectedDocs.length === 0) {
      toast.error("Selected documents not found")
      return
    }

    // Log if we found fewer documents than selected (some might have been deleted)
    if (selectedDocs.length < selectedDocumentIds.length) {
      console.warn(
        `Warning: Found ${selectedDocs.length} documents but ${selectedDocumentIds.length} were selected. Some documents may have been deleted.`
      )
    }

    console.log(
      `Downloading exactly ${selectedDocs.length} document(s) as selected`
    )
    selectedDocs.forEach((doc, index) => {
      setTimeout(() => {
        console.log(
          `Downloading document ${index + 1}/${selectedDocs.length}: ${doc.docPath}`
        )
        const link = document.createElement("a")
        // Encode each path segment to handle special characters in file names
        const pathSegments = doc.docPath
          .replace("/documents/", "")
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")
        const cacheBuster = `?v=${Date.now()}`
        link.href = `/api/documents/serve/${pathSegments}${cacheBuster}`
        // Use original file name from database for download
        link.download = doc.docPath.split("/").pop() || "document"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }, index * 200) // Stagger by 200ms to avoid browser blocking
    })

    toast.success(`Downloading ${selectedDocs.length} document(s)`)
  }, [selectedDocumentIds, documents?.data, buildDocKey])

  // Bulk print documents
  const handleBulkPrint = useCallback(() => {
    console.log("handleBulkPrint called")
    console.log("selectedDocumentIds:", selectedDocumentIds)
    console.log("documents?.data:", documents?.data)

    if (selectedDocumentIds.length === 0) {
      toast.error("Please select at least one document to print")
      return
    }

    if (!Array.isArray(documents?.data)) {
      toast.error("No documents available")
      return
    }

    // Convert all IDs to strings for comparison
    const selectedIdsSet = new Set(selectedDocumentIds.map((id) => id.trim()))
    console.log("selectedIdsSet:", Array.from(selectedIdsSet))
    console.log(
      "All document keys:",
      documents.data.map((d: IDocType) => buildDocKey(d))
    )

    let selectedDocs = (documents.data as IDocType[]).filter((doc) => {
      const docKey = buildDocKey(doc)
      const isSelected = selectedIdsSet.has(docKey)
      console.log(
        `Document Key: "${docKey}" (itemNo: ${doc.itemNo}), Selected: ${isSelected}`
      )
      return isSelected
    })

    console.log("selectedDocs count:", selectedDocs.length)
    console.log("selectedDocumentIds count:", selectedDocumentIds.length)
    console.log(
      "selectedDocs:",
      selectedDocs.map((d) => ({ id: d.documentId, path: d.docPath }))
    )

    if (selectedDocs.length === 0) {
      toast.error("Selected documents not found")
      return
    }

    // Safety check: ensure we're not printing more than selected
    if (selectedDocs.length > selectedDocumentIds.length) {
      console.error("ERROR: More documents matched than selected!", {
        selectedDocs: selectedDocs.length,
        selectedIds: selectedDocumentIds.length,
        selectedIdsArray: selectedDocumentIds,
        matchedDocKeys: selectedDocs.map((d) => buildDocKey(d)),
        allDocKeys: documents.data.map((d: IDocType) => buildDocKey(d)),
      })
      // Only print the exact number that was selected
      selectedDocs = selectedDocs
        .filter((doc) => {
          const docKey = buildDocKey(doc)
          return selectedIdsSet.has(docKey)
        })
        .slice(0, selectedDocumentIds.length)

      console.log(`Limiting print to ${selectedDocs.length} documents`)

      if (selectedDocs.length === 0) {
        toast.error("Could not match selected documents. Please try again.")
        return
      }
    }

    // Open each document in a new window and trigger print
    selectedDocs.forEach((doc, index) => {
      // Encode each path segment to handle special characters in file names
      const pathSegments = doc.docPath
        .replace("/documents/", "")
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")
      const cacheBuster = `?v=${Date.now()}`
      const printUrl = `/api/documents/serve/${pathSegments}${cacheBuster}`

      // Use setTimeout to stagger window opens and avoid browser popup blockers
      setTimeout(() => {
        const printWindow = window.open(printUrl, `_blank_${index}`)
        if (printWindow) {
          // Wait for the window to load, then trigger print
          // Use both onload and a fallback timer for better compatibility
          const triggerPrint = () => {
            try {
              printWindow.print()
            } catch (error) {
              console.error("Error triggering print:", error)
            }
          }

          // Try multiple approaches for better browser compatibility
          if (printWindow.addEventListener) {
            printWindow.addEventListener("load", () => {
              setTimeout(triggerPrint, 1000)
            })
          } else if (printWindow.onload) {
            printWindow.onload = () => {
              setTimeout(triggerPrint, 1000)
            }
          } else {
            // Fallback: wait a bit and try to print
            setTimeout(triggerPrint, 2000)
          }
        }
      }, index * 500) // Stagger by 500ms to avoid popup blockers
    })

    toast.success(`Printing ${selectedDocs.length} document(s)`)
  }, [selectedDocumentIds, documents?.data, buildDocKey])

  // Bulk delete documents
  const handleBulkDelete = useCallback(() => {
    if (selectedDocumentIds.length === 0) {
      toast.error("Please select at least one document to delete")
      return
    }

    if (!Array.isArray(documents?.data)) {
      toast.error("No documents available")
      return
    }

    const selectedDocs = (documents.data as IDocType[]).filter((doc) =>
      selectedDocumentIds.includes(buildDocKey(doc))
    )

    if (selectedDocs.length === 0) {
      toast.error("Selected documents not found")
      return
    }

    setDocumentsToDelete(selectedDocs)
  }, [selectedDocumentIds, documents?.data, buildDocKey])

  // Confirm bulk delete and perform actual deletion
  const handleConfirmBulkDelete = async () => {
    if (documentsToDelete.length === 0) return

    setIsBulkDeleting(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const doc of documentsToDelete) {
        try {
          // Build the full API URL with all required parameters
          const deleteUrl = `/${moduleId}/${transactionId}/${doc.documentId}/${doc.itemNo}`
          const response = await deleteDocumentMutation.mutateAsync(deleteUrl)

          if (response.result === 1) {
            // Also delete the physical file
            try {
              const pathSegments = doc.docPath
                .replace(/^\/documents\//, "")
                .split("/")
                .map((segment) => encodeURIComponent(segment))
                .join("/")
              const deleteFileResponse = await fetch(
                `/api/documents/delete/${pathSegments}`,
                {
                  method: "DELETE",
                }
              )
              if (!deleteFileResponse.ok) {
                console.warn("Failed to delete physical file:", doc.docPath)
              }
            } catch (fileError) {
              console.error("Error deleting physical file:", fileError)
            }

            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error(`Delete error for document ${doc.documentId}:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        queryClient.invalidateQueries({
          queryKey: [`documents-${moduleId}-${transactionId}-${recordId}`],
        })

        toast.success(
          `${successCount} document(s) deleted successfully${failCount > 0 ? `, ${failCount} failed` : ""}`
        )
        setSelectedDocumentIds([])
      } else {
        toast.error("Failed to delete documents")
      }
    } catch (error) {
      console.error("Bulk delete error:", error)
      toast.error("Failed to delete documents")
    } finally {
      setIsBulkDeleting(false)
      setDocumentsToDelete([])
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <>
      <div className="grid grid-cols-10 gap-2">
        {/* Upload Section - 30% */}
        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span>Upload Documents</span>
                  {recordId !== "0" && (
                    <Badge variant="outline" className="w-fit">
                      {recordNo || recordId}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Document Type Selection */}
                <div className="grid gap-2">
                  <Label>Document Type *</Label>
                  <DocumentTypeAutocomplete
                    form={form}
                    name="docTypeId"
                    label=""
                    onChangeEvent={(option) => {
                      setSelectedDocType(option)
                      // Clear remarks when document type changes
                      form.setValue("remarks", "")
                    }}
                  />
                  <CustomTextarea
                    form={form}
                    name="remarks"
                    label="Remarks"
                    placeholder="Enter remarks"
                  />
                </div>

                {/* Drag & Drop Zone */}
                <div
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">
                    Drag & drop files here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum {maxFiles} files, {maxFileSize}MB per file
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported: {allowedFileTypes.join(", ")}
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept={allowedFileTypes.join(",")}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <FileIcon className="mr-2 h-4 w-4" />
                    Browse Files
                  </Button>
                </div>

                {/* Selected Files List */}
                {uploadFiles.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        Selected Files ({uploadFiles.length})
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploadFiles([])}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {uploadFiles.map((uploadFile) => (
                        <div
                          key={uploadFile.id}
                          className="rounded-lg border border-gray-200 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full">
                                <FileText className="h-4 w-4" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {uploadFile.file.name}
                                </p>
                                <div className="flex items-center gap-2">
                                  {uploadFile.status === "uploading" && (
                                    <span className="text-xs font-medium">
                                      {Math.round(uploadFile.progress || 0)}%
                                    </span>
                                  )}
                                  {uploadFile.status === "success" && (
                                    <span className="text-xs font-medium">
                                      Complete
                                    </span>
                                  )}
                                  {uploadFile.status === "failed" && (
                                    <span className="text-xs font-medium">
                                      Failed
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="mb-2 text-xs text-gray-500">
                                {formatFileSize(uploadFile.file.size)}
                              </p>

                              {/* Progress Bar */}
                              {(uploadFile.status === "uploading" ||
                                uploadFile.status === "success") && (
                                <div className="h-2 w-full rounded-full">
                                  <div
                                    className="h-2 rounded-full bg-gray-500 transition-all duration-300"
                                    style={{
                                      width: `${uploadFile.progress || 0}%`,
                                    }}
                                  />
                                </div>
                              )}

                              {/* Error Message */}
                              {uploadFile.status === "failed" &&
                                uploadFile.error && (
                                  <p className="mt-1 text-xs">
                                    {uploadFile.error}
                                  </p>
                                )}
                            </div>

                            <div className="flex items-center gap-1">
                              {uploadFile.status === "failed" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => retryUpload(uploadFile.id)}
                                  className="h-8 w-8 p-0 hover:text-gray-700"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(uploadFile.id)}
                                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={
                    !selectedDocType ||
                    uploadFiles.length === 0 ||
                    isUploading ||
                    recordId === "0"
                  }
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Uploading{" "}
                      {
                        uploadFiles.filter((f) => f.status === "uploading")
                          .length
                      }{" "}
                      of {uploadFiles.length} file(s)...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload{" "}
                      {uploadFiles.length > 0 ? `${uploadFiles.length} ` : ""}
                      File(s)
                    </>
                  )}
                </Button>

                {recordId === "0" && (
                  <p className="text-center text-sm text-orange-600">
                    💡 Please save the invoice first before uploading documents
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uploaded Documents List - 70% */}
        <div className="col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documents List</span>
                <div className="flex items-center gap-2">
                  {selectedDocumentIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        {selectedDocumentIds.length} selected
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDownload}
                        disabled={selectedDocumentIds.length === 0}
                        title="Download selected documents"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download ({selectedDocumentIds.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkPrint}
                        disabled={selectedDocumentIds.length === 0}
                        title="Print selected documents"
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print ({selectedDocumentIds.length})
                      </Button>
                    </div>
                  )}
                  {documents?.data && Array.isArray(documents.data) && (
                    <Badge variant="secondary">
                      {documents.data.length} document(s)
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentOperationsManagerTable
                data={useMemo(
                  () =>
                    Array.isArray(documents?.data)
                      ? (documents.data as IDocType[]).map((doc) => ({
                          ...doc,
                          selectionId: buildDocKey(doc),
                        }))
                      : [],
                  [documents?.data, buildDocKey]
                )}
                isLoading={isLoading}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDeleteAction={handleDelete}
                onRefreshAction={useCallback(() => {
                  queryClient.invalidateQueries({
                    queryKey: [
                      `documents-${moduleId}-${transactionId}-${recordId}`,
                    ],
                  })
                }, [queryClient, moduleId, transactionId, recordId])}
                onBulkSelectionChange={handleBulkSelectionChange}
                onBulkDeleteAction={handleBulkDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => {
          setSelectedDocument(null)
          setPreviewUrl("")
        }}
      >
        <DialogContent className="h-[90vh] w-[90vw] max-w-none!">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Document Preview</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    selectedDocument && handleDownload(selectedDocument)
                  }
                >
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="mt-4">
              <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Type:</strong> {selectedDocument.docTypeName}
                  </p>
                  <p>
                    <strong>File Name:</strong>{" "}
                    {selectedDocument.docPath?.split("/").pop()}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Remarks:</strong>{" "}
                    {selectedDocument.remarks || "N/A"}
                  </p>
                  <p>
                    By {selectedDocument.createBy || "N/A"} on{" "}
                    {selectedDocument.createDate
                      ? new Date(
                          selectedDocument.createDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <iframe
                src={previewUrl}
                className="h-[600px] w-full rounded border"
                title="Document Preview"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Delete Document"
        itemName={
          documentToDelete
            ? documentToDelete.docPath?.split("/").pop() || "this document"
            : undefined
        }
        description="This action cannot be undone. The document will be permanently removed."
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmation
        open={documentsToDelete.length > 0}
        onOpenChange={(open) => !open && setDocumentsToDelete([])}
        onConfirm={handleConfirmBulkDelete}
        isDeleting={isBulkDeleting}
        title="Delete Documents"
        itemName={
          documentsToDelete.length > 0
            ? `${documentsToDelete.length} document(s)`
            : undefined
        }
        description="This action cannot be undone. The selected documents will be permanently removed."
      />
    </>
  )
}
