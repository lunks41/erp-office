"use client"

import { useCallback, useEffect, useState } from "react"
import { IDocType, IDocument, IDocumentTypeLookup } from "@/interfaces/lookup"
import { useAuthStore } from "@/stores/auth-store"
import { useQueryClient } from "@tanstack/react-query"
import {
  Download,
  FileIcon,
  FileText,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Admin } from "@/lib/api-routes"
import { useDelete, useGet, usePersist } from "@/hooks/use-common"
import { useDocumentTypeLookup } from "@/hooks/use-lookup"
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

import DocumentManagerTable from "./document-manager-table"

interface DocumentManagerProps {
  moduleId: number
  transactionId: number
  recordId?: string // Invoice ID, etc.
  recordNo?: string // Invoice No, etc.
  companyId?: number
  onUploadSuccess?: () => void
  maxFileSize?: number // in MB
  allowedFileTypes?: string[]
  maxFiles?: number
  defaultDocTypeKeyword?: string
  defaultRemarks?: string
}

interface UploadFile {
  file: File
  id: string
  preview?: string
  progress?: number
  status?: "pending" | "uploading" | "success" | "failed"
  error?: string
}

export default function DocumentManager({
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
  maxFiles = 10,
  defaultDocTypeKeyword,
  defaultRemarks,
}: DocumentManagerProps) {
  const { decimals: _decimals } = useAuthStore()
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
  const [_selectedDocuments, _setSelectedDocuments] = useState<string[]>([])
  const [_selectAll, _setSelectAll] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<IDocType | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [documentToEdit, setDocumentToEdit] = useState<IDocType | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editDocType, setEditDocType] = useState<IDocumentTypeLookup | null>(
    null
  )
  const { data: documentTypes = [] } = useDocumentTypeLookup()

  const { data: documents, isLoading } = useGet<IDocType>(
    `${Admin.getDocumentById}/${moduleId}/${transactionId}/${recordId}`,
    `documents-${moduleId}-${transactionId}-${recordId}`
  )

  const saveDocumentMutation = usePersist<IDocument | IDocument[]>(
    Admin.saveDocument
  )
  const deleteDocumentMutation = useDelete(Admin.deleteDocument)

  useEffect(() => {
    form.setValue("remarks", defaultRemarks || "")
  }, [defaultRemarks, form])

  useEffect(() => {
    if (!defaultDocTypeKeyword || selectedDocType || documentTypes.length === 0) {
      return
    }

    const key = defaultDocTypeKeyword.trim().toLowerCase()
    if (!key) return

    const matched =
      documentTypes.find(
        (d) =>
          d.docTypeCode?.trim().toLowerCase() === key ||
          d.docTypeName?.trim().toLowerCase() === key
      ) ||
      documentTypes.find(
        (d) =>
          d.docTypeCode?.toLowerCase().includes(key) ||
          d.docTypeName?.toLowerCase().includes(key)
      )

    if (!matched) return

    setSelectedDocType(matched)
    form.setValue("docTypeId", matched.docTypeId)
  }, [defaultDocTypeKeyword, selectedDocType, documentTypes, form])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
  }

  // Add files with validation
  const addFiles = (files: File[]) => {
    const newFiles: UploadFile[] = []

    for (const file of files) {
      // Check file count
      if (uploadFiles.length + newFiles.length >= maxFiles) {
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
      setUploadFiles((prev) => [...prev, ...newFiles])
      toast.success(`${newFiles.length} file(s) added`)
    }
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadFiles.length, maxFiles, maxFileSize, allowedFileTypes]
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

  // Edit document - opens edit dialog
  const handleEdit = (doc: IDocType) => {
    setDocumentToEdit(doc)
    // Set the current document type from the document
    if (doc.docTypeId) {
      setEditDocType({
        docTypeId: doc.docTypeId,
        docTypeCode: doc.docTypeCode || "",
        docTypeName: doc.docTypeName || "",
      })
    }
    // Set the current remarks in the form
    form.setValue("editRemarks", doc.remarks || "")
    form.setValue("editDocTypeId", doc.docTypeId?.toString() || "")
  }

  // Confirm update and perform actual update
  const handleConfirmUpdate = async () => {
    if (!documentToEdit || !editDocType) {
      toast.error("Please select document type")
      return
    }

    setIsUpdating(true)
    try {
      // Prepare the document data for update (backend expects List<SaveDocumentViewModel>)
      const documentData: IDocument = {
        transactionId: documentToEdit.transactionId,
        moduleId: documentToEdit.moduleId,
        documentId: documentToEdit.documentId,
        documentNo: documentToEdit.documentNo,
        itemNo: documentToEdit.itemNo,
        docTypeId: editDocType.docTypeId,
        docPath: documentToEdit.docPath, // Keep existing path
        remarks: form.getValues("editRemarks") || "",
      }

      // Pass as array to match backend List<SaveDocumentViewModel>
      const response = await saveDocumentMutation.mutateAsync([documentData])

      if (response.result === 1) {
        toast.success("Document updated successfully")
        queryClient.invalidateQueries({
          queryKey: [`documents-${moduleId}-${transactionId}-${recordId}`],
        })
        setDocumentToEdit(null)
        setEditDocType(null)
        form.setValue("editRemarks", "")
        form.setValue("editDocTypeId", "")
        onUploadSuccess?.()
      } else {
        throw new Error(response.message || "Update failed")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update document"
      )
    } finally {
      setIsUpdating(false)
    }
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

  // Handle checkbox selection
  const _handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      _setSelectedDocuments((prev) => [...prev, documentId])
    } else {
      _setSelectedDocuments((prev) => prev.filter((id) => id !== documentId))
    }
  }

  // Handle select all checkbox
  const _handleSelectAll = (checked: boolean) => {
    _setSelectAll(checked)
    if (checked && Array.isArray(documents?.data)) {
      const allIds = (documents.data as IDocType[]).map((doc) => doc.documentId)
      _setSelectedDocuments(allIds)
    } else {
      _setSelectedDocuments([])
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
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-10 sm:gap-2">
        {/* Upload Section - 30% */}
        <div className="min-w-0 sm:col-span-3">
          <Card className="border-border/60 bg-muted/40 h-full rounded-md border shadow-sm">
            <CardHeader className="min-w-0 space-y-2">
              <CardTitle>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0 shrink-0">Upload Documents</span>
                  {recordId !== "0" && (
                    <Badge
                      variant="outline"
                      className="max-w-full shrink truncate"
                      title={recordNo || recordId}
                    >
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
                            <div className="flex-shrink-0">
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
        <div className="min-w-0 overflow-x-auto sm:col-span-7">
          <Card className="border-border/60 bg-muted/40 h-full min-w-0 rounded-md border shadow-sm">
            <CardHeader>
              <CardTitle className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span>Documents List </span>
                <div className="flex shrink-0 items-center gap-2">
                  {/* {selectedDocuments.length > 0 && (
                    <Badge variant="default">
                      {selectedDocuments.length} selected
                    </Badge>
                  )} */}
                  {documents?.data && Array.isArray(documents.data) && (
                    <Badge variant="secondary">
                      {documents.data.length} document(s)
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentManagerTable
                data={
                  Array.isArray(documents?.data)
                    ? (documents.data as IDocType[])
                    : []
                }
                isLoading={isLoading}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDeleteAction={handleDelete}
                onEditAction={handleEdit}
                onRefreshAction={() => {
                  queryClient.invalidateQueries({
                    queryKey: [
                      `documents-${moduleId}-${transactionId}-${recordId}`,
                    ],
                  })
                }}
                // onSelect={handleSelectDocument}
                // onSelectAll={handleSelectAll}
                // selectedDocuments={selectedDocuments}
                // selectAll={selectAll}
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
        <DialogContent className="h-[90vh] w-[90vw] !max-w-none">
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

      {/* Edit Dialog */}
      <Dialog
        open={!!documentToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setDocumentToEdit(null)
            setEditDocType(null)
            form.setValue("editRemarks", "")
            form.setValue("editDocTypeId", "")
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Document Type Selection */}
            <div className="grid gap-2">
              <Label>Document Type *</Label>
              <DocumentTypeAutocomplete
                form={form}
                name="editDocTypeId"
                label=""
                onChangeEvent={(option) => {
                  setEditDocType(option)
                }}
              />
            </div>

            {/* Remarks */}
            <div className="grid gap-2">
              <Label>Remarks</Label>
              <CustomTextarea
                form={form}
                name="editRemarks"
                label=""
                placeholder="Enter remarks"
              />
            </div>

            {/* File Info (Read-only) */}
            {documentToEdit && (
              <div className="bg-muted/50 rounded-lg border p-3">
                <p className="mb-1 text-sm font-medium">File Name:</p>
                <p className="text-muted-foreground text-sm">
                  {documentToEdit.docPath?.split("/").pop() || "-"}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDocumentToEdit(null)
                setEditDocType(null)
                form.setValue("editRemarks", "")
                form.setValue("editDocTypeId", "")
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUpdate}
              disabled={isUpdating || !editDocType}
            >
              {isUpdating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
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
    </>
  )
}
