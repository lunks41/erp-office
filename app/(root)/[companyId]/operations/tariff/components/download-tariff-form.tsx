"use client"

import { useCallback, useEffect, useState } from "react"
import { ITariffRPTRequest } from "@/interfaces"
import { zodResolver } from "@hookform/resolvers/zod"
import { DownloadIcon, XIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  CompanyAutocomplete,
  CompanyCustomerAutocomplete,
  PortAutocomplete,
} from "@/components/autocomplete"
import { CustomCheckbox } from "@/components/custom"

const downloadSchema = z
  .object({
    companyId: z.number().min(1, "Company is required"),
    customerId: z.number().min(1, "Customer is required"),
    portId: z.number().min(0),
    isAllPorts: z.boolean(),
  })
  .refine(
    (data) => {
      // If isAllPorts is false, portId is required
      if (!data.isAllPorts && data.portId < 1) {
        return false
      }
      return true
    },
    {
      message: "Port is required",
      path: ["portId"],
    }
  )

type DownloadSchemaType = z.infer<typeof downloadSchema>

interface DownloadTariffFormProps {
  onCancelAction: () => void
  onDownloadAction: (data: ITariffRPTRequest) => void
  defaultCompanyId?: number
  defaultCustomerId?: number
  defaultPortId?: number
}

export function DownloadTariffForm({
  onCancelAction,
  onDownloadAction,
  defaultCompanyId = 0,
  defaultCustomerId = 0,
  defaultPortId = 0,
}: DownloadTariffFormProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(
    defaultCompanyId > 0 ? defaultCompanyId : 0
  )
  const downloadForm = useForm<DownloadSchemaType>({
    resolver: zodResolver(downloadSchema),
    defaultValues: {
      companyId: defaultCompanyId > 0 ? defaultCompanyId : 0,
      customerId: defaultCustomerId > 0 ? defaultCustomerId : 0,
      portId: defaultPortId > 0 ? defaultPortId : 0,
      isAllPorts: false,
    },
  })

  const isAllPorts = downloadForm.watch("isAllPorts")

  // Handle All Ports checkbox change - clear portId when checked
  useEffect(() => {
    if (isAllPorts) {
      downloadForm.setValue("portId", 0)
    }
  }, [isAllPorts, downloadForm])

  const handleCompanyChange = useCallback(
    (selectedCompany: { companyId?: number; id?: number } | null) => {
      if (selectedCompany) {
        const companyId = selectedCompany.companyId || selectedCompany.id || 0
        downloadForm.setValue("companyId", companyId)
        setSelectedCompanyId(companyId)
        downloadForm.setValue("customerId", 0)
      } else {
        downloadForm.setValue("companyId", 0)
        setSelectedCompanyId(0)
      }
    },
    [downloadForm]
  )

  const handleSubmit = (data: DownloadSchemaType) => {
    // Transform to match C# RPTTariff class structure
    const rptTariffData: ITariffRPTRequest = {
      companyId: data.companyId,
      customerId: data.customerId,
      portId: data.isAllPorts ? 0 : data.portId,
      isAllPorts: data.isAllPorts,
    }
    onDownloadAction(rptTariffData)
  }

  // Get form errors for display
  const formErrors = downloadForm.formState.errors

  return (
    <div className="w-full space-y-4">
      <Form {...downloadForm}>
        {/* Validation Error Display */}
        {Object.keys(formErrors).length > 0 && (
          <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
            <h4 className="text-destructive mb-2 text-sm font-medium">
              Please fix the following errors:
            </h4>
            <ul className="text-destructive space-y-1 text-sm">
              {Object.entries(formErrors).map(([field, error]) => (
                <li key={field}>
                  • {error?.message || `${field} is required`}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form
          onSubmit={downloadForm.handleSubmit(handleSubmit, (errors) => {
            console.error("Form validation failed:", errors)
            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0]
            if (firstErrorField) {
              const element = document.querySelector(
                `[name="${firstErrorField}"]`
              )
              element?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          })}
          className="space-y-4"
        >
          <CompanyAutocomplete
            form={downloadForm}
            name="companyId"
            label="Company"
            isRequired
            onChangeEvent={handleCompanyChange}
          />
          <CompanyCustomerAutocomplete
            form={downloadForm}
            name="customerId"
            label="Customer"
            companyId={selectedCompanyId}
            isRequired
          />
          <div className="grid grid-cols-2 gap-2">
            <PortAutocomplete
              form={downloadForm}
              name="portId"
              label="Port"
              isRequired={!isAllPorts}
              isDisabled={isAllPorts}
            />
            <div>
              <CustomCheckbox
                form={downloadForm}
                name="isAllPorts"
                label="All Ports"
                labelPosition="side"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancelAction}
              className="flex items-center gap-2"
            >
              <XIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
