"use client"

import { useEffect, useState } from "react"
import { IApiSuccessResponse } from "@/interfaces/auth"
import {
  DynamicLookupSchemaType,
  dynamicLookupFormSchema,
} from "@/schemas/setting"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { useDynamicLookupGet, useDynamicLookupSave } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { SaveConfirmation } from "@/components/confirmation/save-confirmation"
import { CustomNumberInput } from "@/components/custom"
import { LockSkeleton } from "@/components/skeleton/lock-skeleton"

type DynamicLookupResponse = IApiSuccessResponse<DynamicLookupSchemaType>

export function DynamicLookupForm() {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  const {
    data: dynamicLookupResponse,
    isLoading,
    isError,
    refetch,
  } = useDynamicLookupGet()

  const { mutate: saveDynamicLookupSettings, isPending } =
    useDynamicLookupSave()

  const form = useForm<DynamicLookupSchemaType>({
    resolver: zodResolver(dynamicLookupFormSchema),
    defaultValues: {
      isBarge: false,
      isVessel: false,
      isVoyage: false,
      isCustomer: false,
      isSupplier: false,
      isProduct: false,
      isJobOrder: false,
      bargeCount: 0,
      vesselCount: 0,
      voyageCount: 0,
      customerCount: 0,
      supplierCount: 0,
      productCount: 0,
      jobOrderCount: 0,
    },
  })

  // Update form values when data is loaded
  useEffect(() => {
    if (dynamicLookupResponse) {
      const { result, message, data } =
        dynamicLookupResponse as DynamicLookupResponse

      if (result === -2) {
        return
      }

      if (result === -1) {
        toast.error(message || "No data available")
        return
      }

      if (result === 1 && data) {
        form.reset({
          isBarge: data.isBarge ?? false,
          isVessel: data.isVessel ?? false,
          isVoyage: data.isVoyage ?? false,
          isCustomer: data.isCustomer ?? false,
          isSupplier: data.isSupplier ?? false,
          isProduct: data.isProduct ?? false,
          isJobOrder: data.isJobOrder ?? false,
          bargeCount: data.bargeCount ?? 0,
          vesselCount: data.vesselCount ?? 0,
          voyageCount: data.voyageCount ?? 0,
          customerCount: data.customerCount ?? 0,
          supplierCount: data.supplierCount ?? 0,
          productCount: data.productCount ?? 0,
          jobOrderCount: data.jobOrderCount ?? 0,
        })
      }
    }
  }, [dynamicLookupResponse, form])

  function onSubmit() {
    setShowSaveConfirmation(true)
  }

  function handleConfirmSave() {
    const formData = form.getValues()
    saveDynamicLookupSettings(
      { data: formData },
      {
        onSuccess: (response) => {
          const { result, message } = response as DynamicLookupResponse

          if (result === -2) {
            toast.error("This record is locked")
            return
          }

          if (result === -1) {
            toast.error(message || "Failed to save dynamic lookup settings")
            return
          }

          if (result === 1) {
            toast.success(
              message || "Dynamic lookup settings saved successfully"
            )
            // Reload data after successful save
            refetch()
          }
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to save dynamic lookup settings"
          )
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <p className="text-destructive">
          Failed to load dynamic lookup settings
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Dynamic Lookup Settings</h3>
              <p className="text-muted-foreground text-sm">
                Configure dynamic lookup settings
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

        <div className="space-y-4">
          {/* Barge Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isBarge"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Barge Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for barges
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bargeCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Barge Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of barges to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="bargeCount"
                      label="Barge Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Vessel Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isVessel"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Vessel Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for vessels
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vesselCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Vessel Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of vessels to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="vesselCount"
                      label="Vessel Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Voyage Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isVoyage"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Voyage Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for voyages
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voyageCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Voyage Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of voyages to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="voyageCount"
                      label="Voyage Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Customer Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isCustomer"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Customer Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for customers
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Customer Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of customers to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="customerCount"
                      label="Customer Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Supplier Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isSupplier"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Supplier Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for suppliers
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplierCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Supplier Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of suppliers to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="supplierCount"
                      label="Supplier Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Product Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isProduct"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Product Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for products
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Product Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of products to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="productCount"
                      label="Product Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Job Order Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="isJobOrder"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Job Order Lookup</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Enable dynamic lookup for job orders
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="jobOrderCount"
              render={({ field: _field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Job Order Count</FormLabel>
                    <div className="text-muted-foreground text-sm">
                      Number of job orders to show in the lookup
                    </div>
                  </div>
                  <FormControl>
                    <CustomNumberInput
                      form={form}
                      name="jobOrderCount"
                      label="Job Order Count"
                      isRequired
                      round={0}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )

  return (
    <div className="rounded-lg border p-4">
      {dynamicLookupResponse?.result === -2 ? (
        <LockSkeleton locked={true}>{formContent}</LockSkeleton>
      ) : (
        formContent
      )}
      <SaveConfirmation
        title="Save Dynamic Lookup Settings"
        itemName="dynamic lookup settings"
        open={showSaveConfirmation}
        onOpenChange={setShowSaveConfirmation}
        onConfirm={handleConfirmSave}
        isSaving={isPending}
        operationType="save"
      />
    </div>
  )
}
