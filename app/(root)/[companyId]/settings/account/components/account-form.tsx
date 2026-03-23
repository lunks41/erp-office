"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { IApiSuccessResponse } from "@/interfaces/auth"
import { UserSettingSchemaType, userSettingSchema } from "@/schemas/setting"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useChartOfAccountLookup } from "@/hooks/use-lookup"
import { useUserSettingGet, useUserSettingSave } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartOfAccountAutocomplete,
  CurrencyAutocomplete,
  GSTAutocomplete,
  UomAutocomplete,
} from "@/components/autocomplete"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import CustomSelect from "@/components/custom/custom-select"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

type UserSettingResponse = IApiSuccessResponse<UserSettingSchemaType>

export function AccountForm() {
  const params = useParams()
  const companyId = params.companyId as string
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)

  const {
    data: userSettingResponse,
    isLoading,
    isError,
    refetch,
  } = useUserSettingGet()

  // Get chart of account data to ensure it's loaded before setting form values
  const { data: chartOfAccounts = [], isLoading: isLoadingChartOfAccounts } =
    useChartOfAccountLookup(Number(companyId))

  const { mutate: saveUserSettings, isPending } = useUserSettingSave()

  const form = useForm<UserSettingSchemaType>({
    resolver: zodResolver(userSettingSchema),
    defaultValues: {
      trn_Grd_TotRec: 50,
      m_Grd_TotRec: 50,
      ar_IN_GLId: 0,
      ar_CN_GLId: 0,
      ar_DN_GLId: 0,
      ap_IN_GLId: 0,
      ap_CN_GLId: 0,
      ap_DN_GLId: 0,
      ar_CurrencyId: 0,
      ap_CurrencyId: 0,
      cb_CurrencyId: 0,
      gl_CurrencyId: 0,
      gstId: 0,
      uomId: 0,
    },
  })

  // Update form values when both user settings data and chart of account data are loaded
  useEffect(() => {
    if (
      userSettingResponse &&
      !isLoadingChartOfAccounts &&
      chartOfAccounts.length > 0
    ) {
      const { result, message, data } =
        userSettingResponse as UserSettingResponse

      if (result === -2) {
        toast.error("This record is locked and cannot be modified")
        return
      }

      if (result === -1) {
        toast.error(message || "Failed to load account settings")
        return
      }

      if (result === 1 && data) {
        form.reset({
          trn_Grd_TotRec: data.trn_Grd_TotRec ?? 50,
          m_Grd_TotRec: data.m_Grd_TotRec ?? 50,
          ar_IN_GLId: data.ar_IN_GLId ?? 0,
          ar_CN_GLId: data.ar_CN_GLId ?? 0,
          ar_DN_GLId: data.ar_DN_GLId ?? 0,
          ap_IN_GLId: data.ap_IN_GLId ?? 0,
          ap_CN_GLId: data.ap_CN_GLId ?? 0,
          ap_DN_GLId: data.ap_DN_GLId ?? 0,
          ar_CurrencyId: data.ar_CurrencyId ?? 0,
          ap_CurrencyId: data.ap_CurrencyId ?? 0,
          cb_CurrencyId: data.cb_CurrencyId ?? 0,
          gl_CurrencyId: data.gl_CurrencyId ?? 0,
          gstId: data.gstId ?? 0,
          uomId: data.uomId ?? 0,
        })
      } else if (result === 1 && !data) {
        toast.warning("No account settings data available")
      }
    }
  }, [userSettingResponse, form, isLoadingChartOfAccounts, chartOfAccounts])

  function onSubmit() {
    setShowSaveConfirmation(true)
  }

  function handleConfirmSave() {
    const formData = form.getValues()
    // Ensure all values are non-optional before sending to API
    const data = {
      trn_Grd_TotRec: formData.trn_Grd_TotRec ?? 0,
      m_Grd_TotRec: formData.m_Grd_TotRec ?? 0,
      ar_IN_GLId: formData.ar_IN_GLId ?? 0,
      ar_CN_GLId: formData.ar_CN_GLId ?? 0,
      ar_DN_GLId: formData.ar_DN_GLId ?? 0,
      ap_IN_GLId: formData.ap_IN_GLId ?? 0,
      ap_CN_GLId: formData.ap_CN_GLId ?? 0,
      ap_DN_GLId: formData.ap_DN_GLId ?? 0,
      ar_CurrencyId: formData.ar_CurrencyId ?? 0,
      ap_CurrencyId: formData.ap_CurrencyId ?? 0,
      cb_CurrencyId: formData.cb_CurrencyId ?? 0,
      gl_CurrencyId: formData.gl_CurrencyId ?? 0,
      gstId: formData.gstId ?? 0,
      uomId: formData.uomId ?? 0,
    }

    saveUserSettings(data, {
      onSuccess: (response) => {
        const { result, message } = response as UserSettingResponse

        if (result === -2) {
          toast.error("This record is locked")
          return
        }

        if (result === -1) {
          toast.error(message || "Failed to save user settings")
          return
        }

        if (result === 1) {
          toast.success(message || "User settings saved successfully")
          // Reload data after successful save
          refetch()
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save user settings"
        )
      },
    })
  }

  if (isLoading || isLoadingChartOfAccounts) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-destructive">Failed to load user settings</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Grid Records Section */}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Account Settings</h3>
              <p className="text-muted-foreground text-sm">
                Configure how many records are displayed in transaction and
                master data grids
              </p>
            </div>
            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <CustomSelect
              name="trn_Grd_TotRec"
              label="Transaction Grid Records"
              isRequired
              placeholder="Select records"
              options={[
                { value: 50, label: "50" },
                { value: 100, label: "100" },
                { value: 500, label: "500" },
              ]}
            />
            <p className="text-muted-foreground text-xs">
              Number of records to display in transaction-related grids (e.g.,
              invoices, orders)
            </p>
          </div>
          <div className="space-y-2">
            <CustomSelect
              name="m_Grd_TotRec"
              label="Master Grid Records"
              isRequired
              placeholder="Select records"
              options={[
                { value: 50, label: "50" },
                { value: 100, label: "100" },
                { value: 500, label: "500" },
              ]}
            />
            <p className="text-muted-foreground text-xs">
              Number of records to display in master data grids (e.g.,
              customers, products)
            </p>
          </div>
        </div>

        {/* GL Accounts Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">GL Account Mappings</h3>
                <p className="text-muted-foreground text-sm">
                  Map document types to their corresponding general ledger
                  accounts for proper accounting
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-6">
            {/* AR Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Accounts Receivable</h4>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ar_IN_GLId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Invoice GL Account</FormLabel>
                        <FormControl>
                          <ChartOfAccountAutocomplete
                            form={form}
                            name="ar_IN_GLId"
                            label=""
                            isRequired
                            companyId={Number(companyId)}
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          GL account for customer invoices
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ar_CN_GLId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Credit Note GL Account</FormLabel>
                        <FormControl>
                          <ChartOfAccountAutocomplete
                            form={form}
                            name="ar_CN_GLId"
                            label=""
                            isRequired
                            companyId={Number(companyId)}
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          GL account for customer credit notes
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ar_DN_GLId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Debit Note GL Account</FormLabel>
                        <FormControl>
                          <ChartOfAccountAutocomplete
                            form={form}
                            name="ar_DN_GLId"
                            label=""
                            isRequired
                            companyId={Number(companyId)}
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          GL account for customer debit notes
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ar_CurrencyId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <FormControl>
                          <CurrencyAutocomplete
                            form={form}
                            name="ar_CurrencyId"
                            label=""
                            isRequired
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          Default currency for AR transactions
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* AP Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Accounts Payable</h4>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ap_IN_GLId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Invoice GL Account</FormLabel>
                        <FormControl>
                          <ChartOfAccountAutocomplete
                            form={form}
                            name="ap_IN_GLId"
                            label=""
                            isRequired
                            companyId={Number(companyId)}
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          GL account for supplier invoices
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ap_CN_GLId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Credit Note GL Account</FormLabel>
                        <FormControl>
                          <ChartOfAccountAutocomplete
                            form={form}
                            name="ap_CN_GLId"
                            label=""
                            isRequired
                            companyId={Number(companyId)}
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          GL account for supplier credit notes
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ap_DN_GLId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Debit Note GL Account</FormLabel>
                        <FormControl>
                          <ChartOfAccountAutocomplete
                            form={form}
                            name="ap_DN_GLId"
                            label=""
                            isRequired
                            companyId={Number(companyId)}
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          GL account for supplier debit notes
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="ap_CurrencyId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <FormControl>
                          <CurrencyAutocomplete
                            form={form}
                            name="ap_CurrencyId"
                            label=""
                            isRequired
                          />
                        </FormControl>
                        <p className="text-muted-foreground text-xs">
                          Default currency for AP transactions
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Default Settings Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Default Settings</h3>
                <p className="text-muted-foreground text-sm">
                  Configure default GST, Unit of Measurement, and
                  module-specific currencies
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="gstId"
                render={() => (
                  <FormItem>
                    <FormLabel>Default GST</FormLabel>
                    <FormControl>
                      <GSTAutocomplete
                        form={form}
                        name="gstId"
                        label=""
                        isRequired
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Default GST to be applied in transactions
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="uomId"
                render={() => (
                  <FormItem>
                    <FormLabel>Default Unit of Measurement</FormLabel>
                    <FormControl>
                      <UomAutocomplete
                        form={form}
                        name="uomId"
                        label=""
                        isRequired
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      Default unit of measurement for products
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-medium">Module Currencies</h4>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="cb_CurrencyId"
                  render={() => (
                    <FormItem>
                      <FormLabel>Cash & Bank Currency</FormLabel>
                      <FormControl>
                        <CurrencyAutocomplete
                          form={form}
                          name="cb_CurrencyId"
                          label=""
                          isRequired
                        />
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        Default currency for Cash & Bank transactions
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="gl_CurrencyId"
                  render={() => (
                    <FormItem>
                      <FormLabel>General Ledger Currency</FormLabel>
                      <FormControl>
                        <CurrencyAutocomplete
                          form={form}
                          name="gl_CurrencyId"
                          label=""
                          isRequired
                        />
                      </FormControl>
                      <p className="text-muted-foreground text-xs">
                        Default currency for General Ledger transactions
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </Form>
  )

  return (
    <div className="rounded-lg border p-4">
      {userSettingResponse?.result === -2 ? (
        <LockSkeleton locked={true}>{formContent}</LockSkeleton>
      ) : (
        formContent
      )}
      <SaveConfirmation
        title="Save Account Settings"
        itemName="account settings"
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={isPending}
        operationType="save"
      />
    </div>
  )
}
