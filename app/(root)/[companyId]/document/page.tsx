"use client"

import { useState } from "react"
import { IUniversalDocumentHd } from "@/interfaces/universal-documents"
import { ArrowLeft, BarChart3, FileText, Plus } from "lucide-react"

import { useGetUniversalDocumentById } from "@/hooks/use-universal-documents"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { DocumentExpiryDashboard } from "./components/document-expiry-dashboard"
import { DocumentForm } from "./components/document-form"
import { DocumentTable } from "./components/document-table"

type ViewMode = "dashboard" | "list" | "create" | "edit"

export default function DocumentExpiryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard")
  const [documentIdToFetch, setDocumentIdToFetch] = useState<
    string | undefined
  >(undefined)

  // Hook to fetch complete document data by ID
  const { data: fetchedDocument, isLoading: isFetchingDocument } =
    useGetUniversalDocumentById(documentIdToFetch)

  const handleCreate = () => {
    setDocumentIdToFetch(undefined)
    setViewMode("create")
  }

  const handleEdit = (document: IUniversalDocumentHd) => {
    // Set the document ID to fetch complete data
    setDocumentIdToFetch(document.documentId.toString())
    setViewMode("edit")
  }

  const handleSuccess = () => {
    setViewMode("list")
    setDocumentIdToFetch(undefined)
  }

  const handleCancel = () => {
    setViewMode("list")
    setDocumentIdToFetch(undefined)
  }

  // Extract the actual document data from the API response
  const completeDocument =
    (fetchedDocument as { data: IUniversalDocumentHd } | undefined)?.data ||
    null

  const renderContent = () => {
    switch (viewMode) {
      case "dashboard":
        return <DocumentExpiryDashboard />

      case "list":
        return (
          <div className="space-y-2">
            <DocumentTable onEditAction={handleEdit} />
          </div>
        )

      case "create":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to List</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            <DocumentForm
              onSuccess={handleSuccess}
              onCancelAction={handleCancel}
            />
          </div>
        )

      case "edit":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to List</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            {isFetchingDocument ? (
              <Card>
                <CardHeader>
                  <CardTitle>Loading document...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">Loading...</div>
                  </div>
                </CardContent>
              </Card>
            ) : completeDocument ? (
              <DocumentForm
                document={completeDocument}
                onSuccess={handleSuccess}
                onCancelAction={handleCancel}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Document not found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">
                      The requested document could not be found.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      default:
        return <DocumentExpiryDashboard />
    }
  }

  return (
    <div className="@container mx-auto space-y-2 px-4 py-2 sm:space-y-3 sm:px-6 sm:py-3">
      {/* Header with Name and Tabs */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Document Management
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage and track document expiry dates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Document</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-1 sm:gap-2"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="flex items-center gap-1 sm:gap-2"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
            <TabsTrigger
              value="create"
              className="flex items-center gap-1 sm:gap-2"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Create</span>
              <span className="sm:hidden">New</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="min-h-[400px] sm:min-h-[500px]">{renderContent()}</div>
    </div>
  )
}
