"use client"

import { useCallback, useEffect, useState } from "react"
import { ApiResponse } from "@/interfaces/auth"
import {
  ISupplier,
  ISupplierAddress,
  ISupplierContact,
  ISupplierFilter,
} from "@/interfaces/supplier"
import {
  SupplierAddressSchemaType,
  SupplierContactSchemaType,
  SupplierSchemaType,
} from "@/schemas/supplier"
import { usePermissionStore } from "@/stores/permission-store"
import { ListFilter, RotateCcw, Save, Trash2 } from "lucide-react"

import { Supplier, SupplierAddress, SupplierContact } from "@/lib/api-routes"
import { MasterTransactionId, ModuleId } from "@/lib/utils"
import {
  useDelete,
  useGetById,
  useGetWithPagination,
  usePersist,
} from "@/hooks/use-common"
import { useGetSupplierById } from "@/hooks/use-master"
import { useUserSettingDefaults } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteConfirmation } from "@/components/confirmation/delete-confirmation"
import { LoadConfirmation } from "@/components/confirmation/load-confirmation"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"

import { SupplierAddressForm } from "./components/address-form"
import { AddresssTable } from "./components/address-table"
import { SupplierContactForm } from "./components/contact-form"
import { ContactsTable } from "./components/contact-table"
import SupplierForm from "./components/supplier-form"
import { SupplierTable } from "./components/supplier-table"

export default function SupplierPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.supplier

  const { hasPermission } = usePermissionStore()

  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")

  const [showListDialog, setShowListDialog] = useState(false)
  const [supplier, setSupplier] = useState<ISupplier | null>(null)
  const [addresses, setAddresses] = useState<ISupplierAddress[]>([])
  const [contacts, setContacts] = useState<ISupplierContact[]>([])
  const [activeTab, setActiveTab] = useState<"address" | "contact">("address")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedAddress, setSelectedAddress] =
    useState<ISupplierAddress | null>(null)
  const [selectedContact, setSelectedContact] =
    useState<ISupplierContact | null>(null)
  const [addressMode, setAddressMode] = useState<"view" | "edit" | "add">(
    "view"
  )
  const [contactMode, setContactMode] = useState<"view" | "edit" | "add">(
    "view"
  )
  const [filters, setFilters] = useState<ISupplierFilter>({
    search: "",
    sortOrder: "asc",
  })
  const [key, setKey] = useState(0)
  const { defaults } = useUserSettingDefaults()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    defaults?.common?.masterGridTotalRecords || 50
  )

  // Update page size when user settings change
  useEffect(() => {
    if (defaults?.common?.masterGridTotalRecords) {
      setPageSize(defaults.common.masterGridTotalRecords)
    }
  }, [defaults?.common?.masterGridTotalRecords])

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingSupplier, setExistingSupplier] = useState<ISupplier | null>(
    null
  )

  // Save confirmation states
  const [showSupplierSaveConfirmation, setShowSupplierSaveConfirmation] =
    useState(false)
  const [showAddressSaveConfirmation, setShowAddressSaveConfirmation] =
    useState(false)
  const [showContactSaveConfirmation, setShowContactSaveConfirmation] =
    useState(false)
  const [pendingSupplierData, setPendingSupplierData] =
    useState<SupplierSchemaType | null>(null)
  const [pendingAddressData, setPendingAddressData] =
    useState<SupplierAddressSchemaType | null>(null)
  const [pendingContactData, setPendingContactData] =
    useState<SupplierContactSchemaType | null>(null)

  // Delete confirmation states
  const [showSupplierDeleteConfirmation, setShowSupplierDeleteConfirmation] =
    useState(false)
  const [showAddressDeleteConfirmation, setShowAddressDeleteConfirmation] =
    useState(false)
  const [showContactDeleteConfirmation, setShowContactDeleteConfirmation] =
    useState(false)
  const [pendingDeleteSupplier, setPendingDeleteSupplier] =
    useState<ISupplier | null>(null)
  const [pendingDeleteAddressId, setPendingDeleteAddressId] = useState<
    string | null
  >(null)
  const [pendingDeleteContactId, setPendingDeleteContactId] = useState<
    string | null
  >(null)
  const [pendingDeleteAddress, setPendingDeleteAddress] =
    useState<ISupplierAddress | null>(null)
  const [pendingDeleteContact, setPendingDeleteContact] =
    useState<ISupplierContact | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Helper function to reset all form and table data
  const resetAllData = () => {
    setAddresses([])
    setContacts([])
    setSelectedAddress(null)
    setSelectedContact(null)
    setShowAddressForm(false)
    setShowContactForm(false)
    setAddressMode("view")
    setContactMode("view")
    setActiveTab("address")
  }

  // API hooks for suppliers
  const {
    data: suppliersResponse,
    refetch: refetchSuppliers,
    isLoading: isLoadingSuppliers,
  } = useGetWithPagination<ISupplier>(
    `${Supplier.get}`,
    "suppliers",
    filters.search,
    currentPage,
    pageSize
  )

  const { refetch: refetchSupplierDetails } = useGetSupplierById<ISupplier>(
    `${Supplier.getById}`,
    "supplier",
    supplier?.supplierId || 0,
    supplier?.supplierCode || "0",
    supplier?.supplierName || "0"
  )

  const { refetch: refetchAddresses, isLoading: isLoadingAddresses } =
    useGetById<ISupplierAddress>(
      `${SupplierAddress.get}`,
      "supplieraddresses",
      supplier?.supplierId?.toString() || "",
      {
        enabled: !!supplier?.supplierId,
        queryKey: ["supplieraddresses", supplier?.supplierId],
      }
    )

  const { refetch: refetchContacts, isLoading: isLoadingContacts } =
    useGetById<ISupplierContact>(
      `${SupplierContact.get}`,
      "suppliercontacts",
      supplier?.supplierId?.toString() || "",
      {
        enabled: !!supplier?.supplierId,
        queryKey: ["suppliercontacts", supplier?.supplierId],
      }
    )

  const { data: suppliersData, totalRecords } =
    (suppliersResponse as ApiResponse<ISupplier>) ?? {
      result: 0,
      message: "",
      data: [],
      totalRecords: 0,
    }

  // Mutations
  const saveMutation = usePersist<SupplierSchemaType>(`${Supplier.add}`)
  const updateMutation = usePersist<SupplierSchemaType>(`${Supplier.add}`)
  const deleteMutation = useDelete(`${Supplier.delete}`)
  const saveAddressMutation = usePersist<SupplierAddressSchemaType>(
    `${SupplierAddress.add}`
  )
  const updateAddressMutation = usePersist<SupplierAddressSchemaType>(
    `${SupplierAddress.add}`
  )
  const deleteAddressMutation = useDelete(`${SupplierAddress.delete}`)
  const saveContactMutation = usePersist<SupplierContactSchemaType>(
    `${SupplierContact.add}`
  )
  const updateContactMutation = usePersist<SupplierContactSchemaType>(
    `${SupplierContact.add}`
  )
  const deleteContactMutation = useDelete(`${SupplierContact.delete}`)

  const fetchSupplierData = useCallback(async () => {
    try {
      const { data: response } = await refetchSupplierDetails()
      if (response?.result === 1) {
        const detailedSupplier = Array.isArray(response.data)
          ? response.data[0] || null
          : response.data || null
        if (detailedSupplier?.supplierId) {
          const updatedSupplier = {
            ...detailedSupplier,
            currencyId: detailedSupplier.currencyId || 0,
            bankId: detailedSupplier.bankId || 0,
            creditTermId: detailedSupplier.creditTermId || 0,
            parentSupplierId: detailedSupplier.parentSupplierId || 0,
            accSetupId: detailedSupplier.accSetupId || 0,
            supplierId: detailedSupplier.supplierId || 0,
          }
          setSupplier(updatedSupplier as ISupplier)
        }
      } else {
        console.error("Failed to fetch supplier details:", response?.message)
      }

      const [addressesResponse, contactsResponse] = await Promise.all([
        refetchAddresses(),
        refetchContacts(),
      ])

      if (addressesResponse?.data?.result === 1)
        setAddresses(addressesResponse.data.data)
      else setAddresses([])

      if (contactsResponse?.data?.result === 1)
        setContacts(contactsResponse.data.data)
      else setContacts([])
    } catch (error) {
      console.error("Error fetching supplier data:", error)
      setAddresses([])
      setContacts([])
    }
  }, [refetchSupplierDetails, refetchAddresses, refetchContacts])

  // Fetch supplier details, addresses, and contacts when supplier changes
  useEffect(() => {
    if (supplier?.supplierId) {
      fetchSupplierData()
    }
  }, [supplier?.supplierId, fetchSupplierData])

  const handleSupplierSave = (savedSupplier: SupplierSchemaType) => {
    setPendingSupplierData(savedSupplier)
    setShowSupplierSaveConfirmation(true)
  }

  const handleSupplierSaveConfirm = async () => {
    if (!pendingSupplierData) return

    setIsSaving(true)
    try {
      const response =
        pendingSupplierData.supplierId === 0
          ? await saveMutation.mutateAsync(pendingSupplierData)
          : await updateMutation.mutateAsync(pendingSupplierData)

      if (response.result === 1) {
        const supplierData = Array.isArray(response.data)
          ? response.data[0]
          : response.data
        setSupplier(supplierData as ISupplier)
        refetchSuppliers()
      } else {
        console.error("Failed to save supplier:", response?.message)
      }
    } catch (error) {
      console.error("Error saving supplier:", error)
    } finally {
      setIsSaving(false)
      setPendingSupplierData(null)
      setShowSupplierSaveConfirmation(false)
    }
  }

  const handleSupplierSelect = (selectedSupplier: ISupplier | null) => {
    if (selectedSupplier) {
      // Reset all data before setting new supplier
      resetAllData()

      // Set the new supplier
      setSupplier(selectedSupplier)
      setShowListDialog(false)
    }
  }

  const handleSupplierDelete = () => {
    if (!supplier) return
    setPendingDeleteSupplier(supplier)
    setShowSupplierDeleteConfirmation(true)
  }

  const handleSupplierDeleteConfirm = async () => {
    if (!pendingDeleteSupplier) return

    try {
      const response = await deleteMutation.mutateAsync(
        pendingDeleteSupplier.supplierId.toString()
      )
      if (response.result === 1) {
        setSupplier(null)
        setAddresses([])
        setContacts([])
        refetchSuppliers()
      } else {
        console.error("Failed to delete supplier:", response?.message)
      }
    } catch (error) {
      console.error("Error deleting supplier:", error)
    } finally {
      setPendingDeleteSupplier(null)
      setShowSupplierDeleteConfirmation(false)
    }
  }

  const handleSupplierReset = () => {
    setSupplier(null)
    resetAllData()
    setKey((prev) => prev + 1)
  }

  const handleAddressSave = (data: SupplierAddressSchemaType) => {
    setPendingAddressData(data)
    setShowAddressSaveConfirmation(true)
  }

  const handleAddressSaveConfirm = async () => {
    if (!pendingAddressData) return

    try {
      const response =
        pendingAddressData.addressId === 0
          ? await saveAddressMutation.mutateAsync({
              ...pendingAddressData,
              supplierId: supplier?.supplierId || 0,
            })
          : await updateAddressMutation.mutateAsync(pendingAddressData)

      if (response.result === 1) {
        const refreshedAddresses = await refetchAddresses()
        if (refreshedAddresses?.data?.result === 1)
          setAddresses(refreshedAddresses.data.data)
        setShowAddressForm(false)
        setSelectedAddress(null)
      } else {
        console.error("Failed to save address:", response?.message)
      }
    } catch (error) {
      console.error("Error saving address:", error)
    } finally {
      setPendingAddressData(null)
      setShowAddressSaveConfirmation(false)
    }
  }

  const handleContactSave = (data: SupplierContactSchemaType) => {
    setPendingContactData(data)
    setShowContactSaveConfirmation(true)
  }

  const handleContactSaveConfirm = async () => {
    if (!pendingContactData) return

    try {
      const response =
        pendingContactData.contactId === 0
          ? await saveContactMutation.mutateAsync({
              ...pendingContactData,
              supplierId: supplier?.supplierId || 0,
            })
          : await updateContactMutation.mutateAsync(pendingContactData)

      if (response.result === 1) {
        const refreshedContacts = await refetchContacts()
        if (refreshedContacts?.data?.result === 1)
          setContacts(refreshedContacts.data.data)
        setShowContactForm(false)
        setSelectedContact(null)
      } else {
        console.error("Failed to save contact:", response?.message)
      }
    } catch (error) {
      console.error("Error saving contact:", error)
    } finally {
      setPendingContactData(null)
      setShowContactSaveConfirmation(false)
    }
  }

  const handleAddressSelect = (address: ISupplierAddress | null) => {
    if (address) {
      setSelectedAddress(address)
      setAddressMode("view")
      setShowAddressForm(true)
    }
  }

  const handleContactSelect = (contact: ISupplierContact | null) => {
    if (contact) {
      setSelectedContact(contact)
      setContactMode("view")
      setShowContactForm(true)
    }
  }

  const handleAddressEdit = (address: ISupplierAddress | null) => {
    if (address) {
      setSelectedAddress(address)
      setAddressMode("edit")
      setShowAddressForm(true)
    }
  }

  const handleContactEdit = (contact: ISupplierContact | null) => {
    if (contact) {
      setSelectedContact(contact)
      setContactMode("edit")
      setShowContactForm(true)
    }
  }

  const handleAddressAdd = () => {
    setSelectedAddress(null)
    setAddressMode("add")
    setShowAddressForm(true)
  }

  const handleContactAdd = () => {
    setSelectedContact(null)
    setContactMode("add")
    setShowContactForm(true)
  }

  const handleAddressDelete = async (addressId: string) => {
    const addressToDelete = addresses.find(
      (addr) => addr.addressId.toString() === addressId
    )
    setPendingDeleteAddressId(addressId)
    setPendingDeleteAddress(addressToDelete || null)
    setShowAddressDeleteConfirmation(true)
  }

  const handleAddressDeleteConfirm = async () => {
    if (!pendingDeleteAddressId || !supplier?.supplierId) return

    try {
      const response = await deleteAddressMutation.mutateAsync(
        `${supplier.supplierId}/${pendingDeleteAddressId}`
      )
      if (response.result === 1) {
        const refreshedAddresses = await refetchAddresses()
        if (refreshedAddresses?.data?.result === 1)
          setAddresses(refreshedAddresses.data.data)
      } else {
        console.error("Failed to delete address:", response?.message)
      }
    } catch (error) {
      console.error("Error deleting address:", error)
    } finally {
      setPendingDeleteAddressId(null)
      setPendingDeleteAddress(null)
      setShowAddressDeleteConfirmation(false)
    }
  }

  const handleContactDelete = async (contactId: string) => {
    const contactToDelete = contacts.find(
      (contact) => contact.contactId.toString() === contactId
    )
    setPendingDeleteContactId(contactId)
    setPendingDeleteContact(contactToDelete || null)
    setShowContactDeleteConfirmation(true)
  }

  const handleContactDeleteConfirm = async () => {
    if (!pendingDeleteContactId || !supplier?.supplierId) return

    try {
      const response = await deleteContactMutation.mutateAsync(
        `${supplier.supplierId}/${pendingDeleteContactId}`
      )
      if (response.result === 1) {
        const refreshedContacts = await refetchContacts()
        if (refreshedContacts?.data?.result === 1)
          setContacts(refreshedContacts.data.data)
      } else {
        console.error("Failed to delete contact:", response?.message)
      }
    } catch (error) {
      console.error("Error deleting contact:", error)
    } finally {
      setPendingDeleteContactId(null)
      setPendingDeleteContact(null)
      setShowContactDeleteConfirmation(false)
    }
  }

  const handleFilterChange = useCallback(
    (newFilters: { search?: string; sortOrder?: string }) => {
      setFilters(newFilters as ISupplierFilter)
      setCurrentPage(1) // Reset to first page when filtering
    },
    []
  )

  // Page change handler
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // Page size change handler
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const handleSupplierLookup = async (
    supplierCode: string,
    supplierName: string
  ) => {
    if (!supplierCode && !supplierName) {
      return
    }

    // Validate input parameters
    if (
      supplierCode &&
      supplierCode.trim().length === 0 &&
      supplierName &&
      supplierName.trim().length === 0
    ) {
      return
    }

    // Skip if supplier is already loaded (edit mode)
    if (supplier?.supplierId && supplier.supplierId > 0) {
      return
    }

    try {
      // Make direct API call with lookup parameters
      const { getById } = await import("@/lib/api-client")
      const response = await getById(
        `${Supplier.getById}/0/${supplierCode}/${supplierName}`
      )

      if (response?.result === 1) {
        const detailedSupplier = Array.isArray(response.data)
          ? response.data[0] || null
          : response.data || null

        if (detailedSupplier?.supplierId) {
          const updatedSupplier = {
            ...detailedSupplier,
            currencyId: detailedSupplier.currencyId || 0,
            bankId: detailedSupplier.bankId || 0,
            creditTermId: detailedSupplier.creditTermId || 0,
            parentSupplierId: detailedSupplier.parentSupplierId || 0,
            accSetupId: detailedSupplier.accSetupId || 0,
            supplierId: detailedSupplier.supplierId || 0,
          }

          // Show load confirmation dialog instead of directly setting supplier
          setExistingSupplier(updatedSupplier as ISupplier)
          setShowLoadDialog(true)
        } else {
          // No supplier found, clear any existing data
          setSupplier(null)
        }
      } else {
        // No supplier found, clear any existing data
        setSupplier(null)
      }
    } catch (error) {
      console.error("Error in supplier lookup:", error)
      setSupplier(null)
      setAddresses([])
      setContacts([])
    }
  }

  // Handler for loading existing supplier
  const handleLoadExistingSupplier = () => {
    if (existingSupplier) {
      // Set the supplier and close dialog
      setSupplier(existingSupplier)
      setShowLoadDialog(false)
      setExistingSupplier(null)
      // Reset the form key to trigger re-render with new data
      setKey((prev) => prev + 1)
    }
  }

  // Determine edit mode
  const isEdit = Boolean(supplier?.supplierId && supplier.supplierId > 0)

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Supplier
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage supplier information, addresses, and contacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowListDialog(true)}
          >
            <ListFilter className="mr-1 h-4 w-4" />
            List
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              document.getElementById("supplier-form-submit")?.click()
            }
            disabled={
              isSaving ||
              saveMutation.isPending ||
              updateMutation.isPending ||
              canEdit ||
              canCreate
            }
            className={isEdit ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {isSaving || saveMutation.isPending || updateMutation.isPending ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            {isSaving || saveMutation.isPending || updateMutation.isPending
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update"
                : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSupplierReset}
            disabled={!supplier}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSupplierDelete}
            disabled={!supplier}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent>
            <SupplierForm
              key={key}
              initialData={supplier || undefined}
              onSaveAction={handleSupplierSave}
              onSupplierLookup={handleSupplierLookup}
            />
          </CardContent>
        </Card>

        {supplier && (
          <Card>
            <CardContent>
              <Tabs
                defaultValue="address"
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "address" | "contact")
                }
                className="w-full"
              >
                <div className="mb-4 flex items-center justify-between">
                  <TabsList className="grid w-[350px] grid-cols-2">
                    <TabsTrigger value="address">
                      Addresses
                      <Badge variant="secondary" className="ml-2">
                        {addresses.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="contact">
                      Contacts
                      <Badge variant="secondary" className="ml-2">
                        {contacts.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="address" className="space-y-4">
                  <div className="rounded-md">
                    <AddresssTable
                      key={`address-${supplier?.supplierId || "new"}`}
                      data={addresses}
                      isLoading={isLoadingAddresses}
                      onSelect={canView ? handleAddressSelect : undefined}
                      onDeleteAction={
                        canDelete ? handleAddressDelete : undefined
                      }
                      onEditAction={canEdit ? handleAddressEdit : undefined}
                      onCreateAction={canCreate ? handleAddressAdd : undefined}
                      onRefreshAction={() => refetchAddresses()}
                      moduleId={moduleId}
                      transactionId={transactionId}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="contact" className="space-y-4">
                  <div className="rounded-md">
                    <ContactsTable
                      key={`contact-${supplier?.supplierId || "new"}`}
                      data={contacts}
                      isLoading={isLoadingContacts}
                      onSelect={canView ? handleContactSelect : undefined}
                      onDeleteAction={
                        canDelete ? handleContactDelete : undefined
                      }
                      onEditAction={canEdit ? handleContactEdit : undefined}
                      onCreateAction={canCreate ? handleContactAdd : undefined}
                      onRefreshAction={() => refetchContacts()}
                      moduleId={moduleId}
                      transactionId={transactionId}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="container mx-auto h-[85vh] w-[90vw] !max-w-none space-y-2 overflow-y-auto rounded-lg p-4 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Supplier List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing suppliers from the list below. Use
              search to filter records or create new suppliers.
            </p>
          </DialogHeader>
          <SupplierTable
            data={suppliersData || []}
            isLoading={isLoadingSuppliers}
            totalRecords={totalRecords}
            onSelect={handleSupplierSelect}
            onFilterChange={handleFilterChange}
            initialSearchValue={filters.search}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            currentPage={currentPage}
            pageSize={pageSize}
            serverSidePagination={true}
            onRefreshAction={() => refetchSuppliers()}
            moduleId={moduleId}
            transactionId={transactionId}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent
          className="@container w-[70vw] !max-w-none overflow-y-auto rounded-lg p-4"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {addressMode === "view"
                ? "View Address"
                : addressMode === "edit"
                  ? "Edit Address"
                  : "Add Address"}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {addressMode === "view"
                ? "View supplier address details."
                : "Manage supplier address details."}
            </p>
          </DialogHeader>
          <Separator />
          <SupplierAddressForm
            key={`address-form-${selectedAddress?.addressId || "new"}-${addressMode}`}
            initialData={
              addressMode === "edit" || addressMode === "view"
                ? selectedAddress || undefined
                : undefined
            }
            submitAction={handleAddressSave}
            onCancelAction={() => {
              setShowAddressForm(false)
              setSelectedAddress(null)
              setAddressMode("view")
            }}
            isSubmitting={
              saveAddressMutation.isPending || updateAddressMutation.isPending
            }
            isReadOnly={addressMode === "view"}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent
          className="@container w-[70vw] !max-w-none overflow-y-auto rounded-lg p-4"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {contactMode === "view"
                ? "View Contact"
                : contactMode === "edit"
                  ? "Edit Contact"
                  : "Add Contact"}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {contactMode === "view"
                ? "View supplier contact details."
                : "Manage supplier contact details."}
            </p>
          </DialogHeader>
          <Separator />
          <SupplierContactForm
            key={`contact-form-${selectedContact?.contactId || "new"}-${contactMode}`}
            initialData={
              contactMode === "edit" || contactMode === "view"
                ? selectedContact || undefined
                : undefined
            }
            submitAction={handleContactSave}
            onCancelAction={() => {
              setShowContactForm(false)
              setSelectedContact(null)
              setContactMode("view")
            }}
            isSubmitting={
              saveContactMutation.isPending || updateContactMutation.isPending
            }
            isReadOnly={contactMode === "view"}
          />
        </DialogContent>
      </Dialog>

      {/* Load Existing Supplier Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingSupplier}
        onCancelAction={() => {
          setExistingSupplier(null)
          setShowLoadDialog(false)
        }}
        code={existingSupplier?.supplierCode}
        name={existingSupplier?.supplierName}
        typeLabel="Supplier"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Save Confirmation Dialogs */}
      <SaveConfirmation
        open={showSupplierSaveConfirmation}
        onOpenChange={setShowSupplierSaveConfirmation}
        onConfirm={handleSupplierSaveConfirm}
        onCancelAction={() => {
          setPendingSupplierData(null)
          setShowSupplierSaveConfirmation(false)
        }}
        title="Save Supplier"
        itemName={pendingSupplierData?.supplierName || "Supplier"}
        operationType={
          pendingSupplierData?.supplierId === 0 ? "create" : "update"
        }
        isSaving={saveMutation.isPending || updateMutation.isPending}
      />

      <SaveConfirmation
        open={showAddressSaveConfirmation}
        onOpenChange={setShowAddressSaveConfirmation}
        onConfirm={handleAddressSaveConfirm}
        onCancelAction={() => {
          setPendingAddressData(null)
          setShowAddressSaveConfirmation(false)
        }}
        title="Save Address"
        itemName={pendingAddressData?.address1 || "Address"}
        operationType={
          pendingAddressData?.addressId === 0 ? "create" : "update"
        }
        isSaving={
          saveAddressMutation.isPending || updateAddressMutation.isPending
        }
      />

      <SaveConfirmation
        open={showContactSaveConfirmation}
        onOpenChange={setShowContactSaveConfirmation}
        onConfirm={handleContactSaveConfirm}
        onCancelAction={() => {
          setPendingContactData(null)
          setShowContactSaveConfirmation(false)
        }}
        title="Save Contact"
        itemName={pendingContactData?.contactName || "Contact"}
        operationType={
          pendingContactData?.contactId === 0 ? "create" : "update"
        }
        isSaving={
          saveContactMutation.isPending || updateContactMutation.isPending
        }
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmation
        open={showSupplierDeleteConfirmation}
        onOpenChange={setShowSupplierDeleteConfirmation}
        onConfirm={handleSupplierDeleteConfirm}
        onCancelAction={() => {
          setPendingDeleteSupplier(null)
          setShowSupplierDeleteConfirmation(false)
        }}
        title="Delete Supplier"
        itemName={pendingDeleteSupplier?.supplierName || "Supplier"}
        isDeleting={deleteMutation.isPending}
      />

      <DeleteConfirmation
        open={showAddressDeleteConfirmation}
        onOpenChange={setShowAddressDeleteConfirmation}
        onConfirm={handleAddressDeleteConfirm}
        onCancelAction={() => {
          setPendingDeleteAddressId(null)
          setPendingDeleteAddress(null)
          setShowAddressDeleteConfirmation(false)
        }}
        title="Delete Address"
        itemName={pendingDeleteAddress?.address1 || "Address"}
        isDeleting={deleteAddressMutation.isPending}
      />

      <DeleteConfirmation
        open={showContactDeleteConfirmation}
        onOpenChange={setShowContactDeleteConfirmation}
        onConfirm={handleContactDeleteConfirm}
        onCancelAction={() => {
          setPendingDeleteContactId(null)
          setPendingDeleteContact(null)
          setShowContactDeleteConfirmation(false)
        }}
        title="Delete Contact"
        itemName={pendingDeleteContact?.contactName || "Contact"}
        isDeleting={deleteContactMutation.isPending}
      />
    </div>
  )
}
