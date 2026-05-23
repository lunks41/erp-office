"use client"

import { useForm } from "react-hook-form"

import { CustomDateNew } from "@/components/custom/custom-date-new"
import CustomTextarea from "@/components/custom/custom-textarea"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

type RenewFormValues = {
  newExpiryDate: string
  remarks: string
}

export function RenewDocumentForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: { newExpiryDate: string; remarks?: string }) => void | Promise<void>
  isSubmitting?: boolean
}) {
  const form = useForm<RenewFormValues>({
    defaultValues: { newExpiryDate: "", remarks: "" },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) =>
          onSubmit({
            newExpiryDate: values.newExpiryDate,
            remarks: values.remarks.trim() || undefined,
          })
        )}
        className="space-y-4"
      >
        <CustomDateNew
          form={form}
          name="newExpiryDate"
          label="New expiry date"
          isRequired
          isFutureShow
        />
        <CustomTextarea form={form} name="remarks" label="Remarks" minRows={3} />
        <Button
          type="submit"
          className="w-full"
          disabled={!form.watch("newExpiryDate") || isSubmitting}
        >
          Confirm renewal
        </Button>
      </form>
    </Form>
  )
}
