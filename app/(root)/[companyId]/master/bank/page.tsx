"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ApiResponse } from "@/interfaces/auth"
import {
  IBank,
  IBankAddress,
  IBankContact,
  IBankFilter,
} from "@/interfaces/bank"
import {
  BankAddressSchemaType,
  BankContactSchemaType,
  BankSchemaType,
} from "@/schemas/bank"
import { usePermissionStore } from "@/stores/permission-store"
import { ListFilter, RotateCcw, Save, Trash2 } from "lucide-react"

import { Bank, BankAddress, BankContact } from "@/lib/api-routes"
import { MasterTransactionId, ModuleId } from "@/lib/utils"
import {
  useDelete,
  useGetById,
  useGetWithPagination,
  usePersist,
} from "@/hooks/use-common"
import { useGetBankById } from "@/hooks/use-master"
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

import { BankAddressForm } from "./components/address-form"
import { AddresssTable } from "./components/address-table"
import BankForm from "./components/bank-form"
import { BankTable } from "./components/bank-table"
import { BankContactForm } from "./components/contact-form"
import { ContactsTable } from "./components/contact-table"

export default function BankPage() {
  const moduleId = ModuleId.master
  const transactionId = MasterTransactionId.bank
  const companyId = useParams().companyId

  const { hasPermission } = usePermissionStore()

  const canCreate = hasPermission(moduleId, transactionId, "isCreate")
  const canView = hasPermission(moduleId, transactionId, "isRead")
  const canEdit = hasPermission(moduleId, transactionId, "isEdit")
  const canDelete = hasPermission(moduleId, transactionId, "isDelete")

  const [showListDialog, setShowListDialog] = useState(false)
  const [bank, setBank] = useState<IBank | null>(null)
  const [addresses, setAddresses] = useState<IBankAddress[]>([])
  const [contacts, setContacts] = useState<IBankContact[]>([])
  const [activeTab, setActiveTab] = useState<"address" | "contact">("address")
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<IBankAddress | null>(
    null
  )
  const [selectedContact, setSelectedContact] = useState<IBankContact | null>(
    null
  )
  const [addressMode, setAddressMode] = useState<"view" | "edit" | "add">(
    "view"
  )
  const [contactMode, setContactMode] = useState<"view" | "edit" | "add">(
    "view"
  )
  const [filters, setFilters] = useState<IBankFilter>({
    search: "",
    sortOrder: "asc",
  })
  const [key, setKey] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // State for code availability check
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [existingBank, setExistingBank] = useState<IBank | null>(null)

  // Save confirmation states
  const [showBankSaveConfirmation, setShowBankSaveConfirmation] =
    useState(false)
  const [showAddressSaveConfirmation, setShowAddressSaveConfirmation] =
    useState(false)
  const [showContactSaveConfirmation, setShowContactSaveConfirmation] =
    useState(false)
  const [pendingBankData, setPendingBankData] = useState<BankSchemaType | null>(
    null
  )
  const [pendingAddressData, setPendingAddressData] =
    useState<BankAddressSchemaType | null>(null)
  const [pendingContactData, setPendingContactData] =
    useState<BankContactSchemaType | null>(null)

  // Delete confirmation states
  const [showBankDeleteConfirmation, setShowBankDeleteConfirmation] =
    useState(false)
  const [showAddressDeleteConfirmation, setShowAddressDeleteConfirmation] =
    useState(false)
  const [showContactDeleteConfirmation, setShowContactDeleteConfirmation] =
    useState(false)
  const [pendingDeleteBank, setPendingDeleteBank] = useState<IBank | null>(null)
  const [pendingDeleteAddressId, setPendingDeleteAddressId] = useState<
    string | null
  >(null)
  const [pendingDeleteContactId, setPendingDeleteContactId] = useState<
    string | null
  >(null)
  const [pendingDeleteAddress, setPendingDeleteAddress] =
    useState<IBankAddress | null>(null)
  const [pendingDeleteContact, setPendingDeleteContact] =
    useState<IBankContact | null>(null)
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

  // API hooks for banks
  const {
    data: banksResponse,
    refetch: refetchBanks,
    isLoading: isLoadingBanks,
  } = useGetWithPagination<IBank>(
    `${Bank.get}`,
    "banks",
    filters.search,
    currentPage,
    pageSize,
    { enabled: showListDialog }
  )

  const { refetch: refetchBankDetails } = useGetBankById<IBank>(
    `${Bank.getById}`,
    "bank",
    bank?.bankId || 0,
    bank?.bankCode || "0",
    bank?.bankName || "0"
  )

  const { refetch: refetchAddresses, isLoading: isLoadingAddresses } =
    useGetById<IBankAddress>(
      `${BankAddress.get}`,
      "bankaddresses",
      bank?.bankId?.toString() || ""
    )

  const { refetch: refetchContacts, isLoading: isLoadingContacts } =
    useGetById<IBankContact>(
      `${BankContact.get}`,
      "bankcontacts",
      bank?.bankId?.toString() || ""
    )

  const { data: banksData, totalRecords } =
    (banksResponse as ApiResponse<IBank>) ?? {
      result: 0,
      message: "",
      data: [],
      totalRecords: 0,
    }

  // Mutations
  const saveMutation = usePersist<BankSchemaType>(`${Bank.add}`)
  const updateMutation = usePersist<BankSchemaType>(`${Bank.add}`)
  const deleteMutation = useDelete(`${Bank.delete}`)
  const saveAddressMutation = usePersist<BankAddressSchemaType>(
    `${BankAddress.add}`
  )
  const updateAddressMutation = usePersist<BankAddressSchemaType>(
    `${BankAddress.add}`
  )
  const deleteAddressMutation = useDelete(`${BankAddress.delete}`)
  const saveContactMutation = usePersist<BankContactSchemaType>(
    `${BankContact.add}`
  )
  const updateContactMutation = usePersist<BankContactSchemaType>(
    `${BankContact.add}`
  )
  const deleteContactMutation = useDelete(`${BankContact.delete}`)

  const fetchBankData = useCallback(async () => {
    try {
      const { data: response } = await refetchBankDetails()
      if (response?.result === 1) {
        const detailedBank = Array.isArray(response.data)
          ? response.data[0] || null
          : response.data || null
        if (detailedBank?.bankId) {
          const updatedBank = {
            ...detailedBank,
            currencyId: detailedBank.currencyId || 0,
            bankId: detailedBank.bankId || 0,
          }
          setBank(updatedBank as IBank)
        }
      } else {
        console.error("Failed to fetch bank details:", response?.message)
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
      console.error("Error fetching bank data:", error)
      setAddresses([])
      setContacts([])
    }
  }, [refetchBankDetails, refetchAddresses, refetchContacts])

  // Fetch bank details, addresses, and contacts when bank changes
  useEffect(() => {
    if (bank?.bankId) {
      fetchBankData()
    }
  }, [bank?.bankId, fetchBankData])

  const handleBankSave = (savedBank: BankSchemaType) => {
    setPendingBankData(savedBank)
    setShowBankSaveConfirmation(true)
  }

  const handleBankSaveConfirm = async () => {
    if (!pendingBankData) return

    setIsSaving(true)
    try {
      const response =
        pendingBankData.bankId === 0
          ? await saveMutation.mutateAsync(pendingBankData)
          : await updateMutation.mutateAsync(pendingBankData)

      if (response.result === 1) {
        const bankData = Array.isArray(response.data)
          ? response.data[0]
          : response.data
        setBank(bankData as IBank)
        refetchBanks()
      } else {
        console.error("Failed to save bank:", response?.message)
      }
    } catch (error) {
      console.error("Error saving bank:", error)
    } finally {
      setIsSaving(false)
      setPendingBankData(null)
      setShowBankSaveConfirmation(false)
    }
  }

  const handleBankSelect = (selectedBank: IBank | null) => {
    if (selectedBank) {
      // Reset all data before setting new bank
      resetAllData()

      // Set the new bank
      setBank(selectedBank)
      setShowListDialog(false)
    }
  }

  const handleBankDelete = () => {
    if (!bank) return
    setPendingDeleteBank(bank)
    setShowBankDeleteConfirmation(true)
  }

  const handleBankDeleteConfirm = async () => {
    if (!pendingDeleteBank) return

    try {
      const response = await deleteMutation.mutateAsync(
        pendingDeleteBank.bankId.toString()
      )
      if (response.result === 1) {
        setBank(null)
        setAddresses([])
        setContacts([])
        refetchBanks()
      } else {
        console.error("Failed to delete bank:", response?.message)
      }
    } catch (error) {
      console.error("Error deleting bank:", error)
    } finally {
      setPendingDeleteBank(null)
      setShowBankDeleteConfirmation(false)
    }
  }

  const handleBankReset = () => {
    setBank(null)
    resetAllData()
    setKey((prev) => prev + 1)
  }

  const handleAddressSave = (data: BankAddressSchemaType) => {
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
              bankId: bank?.bankId || 0,
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

  const handleContactSave = (data: BankContactSchemaType) => {
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
              bankId: bank?.bankId || 0,
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

  const handleAddressSelect = (address: IBankAddress | null) => {
    if (address) {
      setSelectedAddress(address)
      setAddressMode("view")
      setShowAddressForm(true)
    }
  }

  const handleContactSelect = (contact: IBankContact | null) => {
    if (contact) {
      setSelectedContact(contact)
      setContactMode("view")
      setShowContactForm(true)
    }
  }

  const handleAddressEdit = (address: IBankAddress | null) => {
    if (address) {
      setSelectedAddress(address)
      setAddressMode("edit")
      setShowAddressForm(true)
    }
  }

  const handleContactEdit = (contact: IBankContact | null) => {
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
    if (!pendingDeleteAddressId || !bank?.bankId) return

    try {
      const response = await deleteAddressMutation.mutateAsync(
        `${bank.bankId}/${pendingDeleteAddressId}`
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
    if (!pendingDeleteContactId || !bank?.bankId) return

    try {
      const response = await deleteContactMutation.mutateAsync(
        `${bank.bankId}/${pendingDeleteContactId}`
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
    (newFilters: IBankFilter) => {
      setFilters(newFilters)
      setCurrentPage(1)
    },
    []
  )

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const handleBankLookup = async (bankCode: string, bankName: string) => {
    if (!bankCode && !bankName) {
      return
    }

    // Validate input parameters
    if (
      bankCode &&
      bankCode.trim().length === 0 &&
      bankName &&
      bankName.trim().length === 0
    ) {
      return
    }

    // Skip if bank is already loaded (edit mode)
    if (bank?.bankId && bank.bankId > 0) {
      return
    }

    try {
      // Make direct API call with lookup parameters
      const { getById } = await import("@/lib/api-client")
      const response = await getById(
        `${Bank.getById}/0/${bankCode}/${bankName}`
      )

      if (response?.result === 1) {
        const detailedBank = Array.isArray(response.data)
          ? response.data[0] || null
          : response.data || null

        if (detailedBank?.bankId) {
          const updatedBank = {
            ...detailedBank,
            currencyId: detailedBank.currencyId || 0,
            bankId: detailedBank.bankId || 0,
          }

          // Show load confirmation dialog instead of directly setting bank
          setExistingBank(updatedBank as IBank)
          setShowLoadDialog(true)
        } else {
          // No bank found, clear any existing data
          setBank(null)
        }
      } else {
        // No bank found, clear any existing data
        setBank(null)
      }
    } catch (error) {
      console.error("Error in bank lookup:", error)
      setBank(null)
      setAddresses([])
      setContacts([])
    }
  }

  // Handler for loading existing bank
  const handleLoadExistingBank = () => {
    if (existingBank) {
      // Set the bank and close dialog
      setBank(existingBank)
      setShowLoadDialog(false)
      setExistingBank(null)
      // Reset the form key to trigger re-render with new data
      setKey((prev) => prev + 1)
    }
  }

  // Determine edit mode
  const isEdit = Boolean(bank?.bankId && bank.bankId > 0)

  return (
    <div className="@container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">Bank</h1>
          <p className="text-muted-foreground text-sm">
            Manage bank information, addresses, and contacts
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
            onClick={() => document.getElementById("bank-form-submit")?.click()}
            disabled={
              isSaving ||
              saveMutation.isPending ||
              updateMutation.isPending ||
              (isEdit ? !canEdit : !canCreate)
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
            onClick={handleBankReset}
            disabled={!bank}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBankDelete}
            disabled={!bank}
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
            <BankForm
              key={key}
              initialData={bank || undefined}
              submitAction={handleBankSave}
              onBankLookup={handleBankLookup}
              companyId={Number(companyId)}
            />
          </CardContent>
        </Card>

        {bank && (
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
                      key={`address-${bank?.bankId || "new"}`}
                      data={addresses}
                      isLoading={isLoadingAddresses}
                      totalRecords={totalRecords}
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
                      key={`contact-${bank?.bankId || "new"}`}
                      data={contacts}
                      isLoading={isLoadingContacts}
                      totalRecords={totalRecords}
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
              Bank List
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Manage and select existing banks from the list below. Use search
              to filter records or create new banks.
            </p>
          </DialogHeader>
          <BankTable
            data={banksData || []}
            isLoading={isLoadingBanks}
            totalRecords={totalRecords ?? 0}
            onSelect={handleBankSelect}
            onFilterChange={handleFilterChange}
            initialSearchValue={filters.search}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            currentPage={currentPage}
            pageSize={pageSize}
            serverSidePagination={true}
            onRefreshAction={() => refetchBanks()}
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
                ? "View bank address details."
                : "Manage bank address details."}
            </p>
          </DialogHeader>
          <Separator />
          <BankAddressForm
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
                ? "View bank contact details."
                : "Manage bank contact details."}
            </p>
          </DialogHeader>
          <Separator />
          <BankContactForm
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

      {/* Load Existing Bank Dialog */}
      <LoadConfirmation
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoad={handleLoadExistingBank}
        onCancelAction={() => {
          setExistingBank(null)
          setShowLoadDialog(false)
        }}
        code={existingBank?.bankCode}
        name={existingBank?.bankName}
        typeLabel="Bank"
        isLoading={saveMutation.isPending || updateMutation.isPending}
      />

      {/* Save Confirmation Dialogs */}
      <SaveConfirmation
        open={showBankSaveConfirmation}
        onOpenChange={setShowBankSaveConfirmation}
        onConfirm={handleBankSaveConfirm}
        onCancelAction={() => {
          setPendingBankData(null)
          setShowBankSaveConfirmation(false)
        }}
        title="Save Bank"
        itemName={pendingBankData?.bankName || "Bank"}
        operationType={pendingBankData?.bankId === 0 ? "create" : "update"}
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
        open={showBankDeleteConfirmation}
        onOpenChange={setShowBankDeleteConfirmation}
        onConfirm={handleBankDeleteConfirm}
        onCancelAction={() => {
          setPendingDeleteBank(null)
          setShowBankDeleteConfirmation(false)
        }}
        title="Delete Bank"
        itemName={pendingDeleteBank?.bankName || "Bank"}
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
