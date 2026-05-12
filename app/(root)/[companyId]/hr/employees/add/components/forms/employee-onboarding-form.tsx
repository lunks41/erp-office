"use client"

import React, { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronLeft, ChevronRight, Info, Upload } from "lucide-react"
import { Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  CountryAutocomplete,
  DepartmentAutocomplete,
  DesignationAutocomplete,
  EmploymentTypeAutocomplete,
  GenderAutocomplete,
  WorkLocationAutocomplete,
} from "@/components/autocomplete"
import { CurrencyFormatter } from "@/components/currency-icons/currency-formatter"
import { CustomDateNew } from "@/components/custom/custom-date-new"
// Import custom components
import CustomInput from "@/components/custom/custom-input"

// Basic Details Schema
const basicDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  workEmail: z.string().email("Invalid email address"),
  mobileNumber: z.string().optional(),
  workLocation: z.string().min(1, "Work location is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  gender: z.string().min(1, "Gender is required"),
  enablePortalAccess: z.boolean().default(false),
  isGCCNational: z.string().min(1, "Please select GCC nationality"),
  originCountry: z.string().min(1, "Origin country is required"),
})

// Salary Details Schema
const salaryDetailsSchema = z.object({
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  housingAllowance: z.number().min(0, "Housing allowance must be positive"),
  costOfLivingAllowance: z
    .number()
    .min(0, "Cost of living allowance must be positive"),
  childrenSocialAllowance: z
    .number()
    .min(0, "Children social allowance must be positive"),
  otherAllowance: z.number().min(0, "Other allowance must be positive"),
})

// Personal Details Schema
const personalDetailsSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(0, "Age must be positive"),
  fathersName: z.string().optional(),
  molId: z.string().optional(),
  personalEmail: z.string().email("Invalid email address").optional(),
  presentAddressLine1: z.string().optional(),
  presentAddressLine2: z.string().optional(),
  presentCity: z.string().optional(),
  presentEmirate: z.string().optional(),
  permanentAddressLine1: z.string().optional(),
  permanentAddressLine2: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentCountry: z.string().optional(),
  permanentState: z.string().optional(),
  permanentPinCode: z.string().optional(),
})

// Payment Information Schema
const paymentInfoSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  ibanNumber: z.string().min(1, "IBAN number is required"),
  swiftCode: z.string().optional(),
})

// Combined schema
const employeeOnboardingSchema = basicDetailsSchema
  .merge(salaryDetailsSchema)
  .merge(personalDetailsSchema)
  .merge(paymentInfoSchema)

type EmployeeOnboardingData = z.infer<typeof employeeOnboardingSchema>

interface Props {
  employeeName?: string
  onSaveAction?: (data: EmployeeOnboardingData) => void
  onCancelAction?: () => void
  currentStep?: number
}

export function EmployeeOnboardingForm({
  employeeName = "New Employee",
  onSaveAction,
  onCancelAction,
  currentStep: initialStep = 1,
}: Props) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const form = useForm<EmployeeOnboardingData>({
    resolver: zodResolver(
      employeeOnboardingSchema
    ) as Resolver<EmployeeOnboardingData, unknown, EmployeeOnboardingData>,
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      employeeId: "",
      employmentType: "",
      dateOfJoining: "",
      workEmail: "",
      mobileNumber: "",
      workLocation: "",
      department: "",
      designation: "",
      gender: "",
      enablePortalAccess: false,
      isGCCNational: "",
      originCountry: "",
      basicSalary: 0,
      housingAllowance: 0,
      costOfLivingAllowance: 0,
      childrenSocialAllowance: 0,
      otherAllowance: 0,
      dateOfBirth: "",
      age: 0,
      fathersName: "",
      molId: "",
      personalEmail: "",
      presentAddressLine1: "",
      presentAddressLine2: "",
      presentCity: "",
      presentEmirate: "",
      permanentAddressLine1: "",
      permanentAddressLine2: "",
      permanentCity: "",
      permanentCountry: "",
      permanentState: "",
      permanentPinCode: "",
      paymentMethod: "",
      accountHolderName: "",
      bankName: "",
      ibanNumber: "",
      swiftCode: "",
    },
  })

  const steps = [
    {
      id: 1,
      title: "Basic Details",
      description: "Employee basic information",
    },
    {
      id: 2,
      title: "Salary Details",
      description: "Salary components and amounts",
    },
    {
      id: 3,
      title: "Personal Details",
      description: "Personal information and addresses",
    },
    {
      id: 4,
      title: "Payment Information",
      description: "Bank and payment details",
    },
    { id: 5, title: "Documents", description: "Upload required documents" },
  ]

  const handleNext = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1)
        setCompletedSteps([...completedSteps, currentStep])
      } else {
        const data = form.getValues()
        onSaveAction?.(data)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const calculateTotalGrossPay = () => {
    const basic = form.watch("basicSalary") || 0
    const housing = form.watch("housingAllowance") || 0
    const costOfLiving = form.watch("costOfLivingAllowance") || 0
    const childrenSocial = form.watch("childrenSocialAllowance") || 0
    const other = form.watch("otherAllowance") || 0
    return basic + housing + costOfLiving + childrenSocial + other
  }

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center">
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  completedSteps.includes(step.id)
                    ? "bg-green-500 text-white"
                    : currentStep === step.id
                      ? "bg-card0 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {completedSteps.includes(step.id) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              <span className="mt-1 text-xs text-gray-600">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 ${
                  completedSteps.includes(step.id)
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  const renderBasicDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Employee Name *</Label>
            <div className="grid grid-cols-3 gap-2">
              <CustomInput
                form={form}
                label=""
                name="firstName"
                placeholder="First Name"
                isRequired
              />
              <CustomInput
                form={form}
                label=""
                name="middleName"
                placeholder="Middle"
              />
              <CustomInput
                form={form}
                label=""
                name="lastName"
                placeholder="Last Name"
                isRequired
              />
            </div>
          </div>

          <EmploymentTypeAutocomplete
            form={form}
            label="Employment Type *"
            name="employmentType"
            isRequired
          />

          <CustomDateNew
            form={form}
            label="Date of Joining *"
            name="dateOfJoining"
            isRequired
          />

          <CustomInput
            form={form}
            label="Work Email *"
            name="workEmail"
            placeholder="Enter work email"
            type="email"
            isRequired
          />

          <GenderAutocomplete
            form={form}
            label="Gender *"
            name="gender"
            isRequired
          />

          <DesignationAutocomplete
            form={form}
            label="Designation *"
            name="designation"
            isRequired
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <CustomInput
            form={form}
            label="Employee ID *"
            name="employeeId"
            placeholder="Enter employee ID"
            isRequired
          />

          <CustomInput
            form={form}
            label="Mobile Number"
            name="mobileNumber"
            placeholder="Enter mobile number"
            type="tel"
          />

          <WorkLocationAutocomplete
            form={form}
            label="Work Location *"
            name="workLocation"
            isRequired
          />

          <DepartmentAutocomplete
            form={form}
            label="Department *"
            name="department"
            isRequired
          />
        </div>
      </div>

      {/* Enable Portal Access */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="enablePortalAccess"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium">
                    Enable Portal Access
                  </FormLabel>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      The employee will be able to view payslips and social
                      security benefit details through the employee portal.
                    </span>
                    <Button variant="link" className="h-auto p-0 text-muted-foreground">
                      Preview mail
                    </Button>
                  </div>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Social Security Benefit Details */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">
            Social Security Benefit Details *
          </h3>
          <p className="text-sm text-gray-600">
            Tell us about the origin country of the employee so we can enable
            the applicable social security benefits. You can review them later
            in Settings &gt; Social Security.
          </p>
        </div>

        <FormField
          control={form.control}
          name="isGCCNational"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-sm font-medium">
                Is this Employee a GCC National? *
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-y-0 space-x-3">
                    <FormControl>
                      <RadioGroupItem value="no" />
                    </FormControl>
                    <FormLabel className="font-normal">No</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-y-0 space-x-3">
                    <FormControl>
                      <RadioGroupItem value="yes" />
                    </FormControl>
                    <FormLabel className="font-normal">Yes</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <CountryAutocomplete
          form={form}
          label="Select Origin Country *"
          name="originCountry"
          isRequired
        />
      </div>
    </div>
  )

  const renderSalaryDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">Salary Components</h3>
        <p className="text-sm text-gray-600">Earnings</p>
      </div>

      <div className="space-y-4">
        {[
          { name: "basicSalary", label: "Basic", key: "basic" },
          {
            name: "housingAllowance",
            label: "Housing Allowance",
            key: "housing",
          },
          {
            name: "costOfLivingAllowance",
            label: "Cost of Living Allowance",
            key: "costOfLiving",
          },
          {
            name: "childrenSocialAllowance",
            label: "Children Social Allowance",
            key: "childrenSocial",
          },
          { name: "otherAllowance", label: "Other Allowance", key: "other" },
        ].map((component) => (
          <div
            key={component.key}
            className="grid grid-cols-4 items-center gap-4"
          >
            <div className="font-medium">{component.label}</div>
            <div className="text-sm text-gray-600">Fixed amount</div>
            <FormField
              control={form.control}
              name={component.name as keyof EmployeeOnboardingData}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={String(field.value || 0)}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="text-sm font-medium">
              <CurrencyFormatter
                amount={
                  (form.watch(
                    component.name as keyof EmployeeOnboardingData
                  ) as number) || 0
                }
              />
            </div>
          </div>
        ))}

        {/* Total Gross Pay */}
        <div className="grid grid-cols-4 items-center gap-4 rounded-lg bg-gray-50 p-4">
          <div className="font-medium">Total Gross Pay</div>
          <div></div>
          <div className="text-sm font-medium">
            <CurrencyFormatter amount={calculateTotalGrossPay()} />
          </div>
          <div className="text-sm font-medium">
            <CurrencyFormatter amount={calculateTotalGrossPay() * 12} />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <CustomDateNew
            form={form}
            label="Date of Birth *"
            name="dateOfBirth"
            isRequired
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Age"
                    {...field}
                    value={field.value || 0}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CustomInput
            form={form}
            label="Father's Name"
            name="fathersName"
            placeholder="Enter father's name"
          />

          <div className="flex items-center space-x-2">
            <CustomInput
              form={form}
              label="MOL ID"
              name="molId"
              placeholder="Enter MOL ID"
            />
            <Info className="h-4 w-4 text-gray-400" />
          </div>

          <CustomInput
            form={form}
            label="Personal Email Address"
            name="personalEmail"
            placeholder="Enter personal email"
            type="email"
          />
        </div>

        {/* Right Column - Present Residential Address */}
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-lg font-medium">
              Present Residential Address
            </h3>
          </div>

          <CustomInput
            form={form}
            label="Address Line 1"
            name="presentAddressLine1"
            placeholder="Address Line 1"
          />

          <CustomInput
            form={form}
            label="Address Line 2"
            name="presentAddressLine2"
            placeholder="Address Line 2"
          />

          <CustomInput
            form={form}
            label="City"
            name="presentCity"
            placeholder="City"
          />

          <CustomInput
            form={form}
            label="Select an Emirate"
            name="presentEmirate"
            placeholder="Select an Emirate"
          />

          <div className="text-sm text-gray-600">United Arab Emirates</div>
        </div>
      </div>

      {/* Permanent Address */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Permanent Address</h3>
          <Button type="button" variant="link" className="text-muted-foreground">
            Copy Present Residential Address
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <CustomInput
              form={form}
              label="Address Line 1"
              name="permanentAddressLine1"
              placeholder="Address Line 1"
            />

            <CustomInput
              form={form}
              label="Address Line 2"
              name="permanentAddressLine2"
              placeholder="Address Line 2"
            />

            <CustomInput
              form={form}
              label="City"
              name="permanentCity"
              placeholder="City"
            />
          </div>

          <div className="space-y-4">
            <CountryAutocomplete
              form={form}
              label="Country"
              name="permanentCountry"
            />

            <CustomInput
              form={form}
              label="State"
              name="permanentState"
              placeholder="State"
            />

            <CustomInput
              form={form}
              label="PIN Code"
              name="permanentPinCode"
              placeholder="PIN Code"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPaymentInformation = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">
          How would you like to pay this employee? *
        </h3>
      </div>

      <FormField
        control={form.control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4">
                  <FormControl>
                    <RadioGroupItem value="manual-bank-transfer" />
                  </FormControl>
                  <div className="flex-1">
                    <div className="font-medium">Manual Bank Transfer</div>
                    <div className="text-sm text-gray-600">
                      Download the bank advice to make payments via your
                      bank&apos;s website, or download the SIF file to pay
                      through the Wage Protection System (WPS).
                    </div>
                  </div>
                  {field.value === "manual-bank-transfer" && (
                    <Check className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4">
                  <FormControl>
                    <RadioGroupItem value="cheque" />
                  </FormControl>
                  <div className="flex-1">
                    <div className="font-medium">Cheque</div>
                  </div>
                  {field.value === "cheque" && (
                    <Check className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex items-center space-x-3 rounded-lg border p-4">
                  <FormControl>
                    <RadioGroupItem value="cash" />
                  </FormControl>
                  <div className="flex-1">
                    <div className="font-medium">Cash</div>
                  </div>
                  {field.value === "cash" && (
                    <Check className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("paymentMethod") === "manual-bank-transfer" && (
        <div className="space-y-4">
          <CustomInput
            form={form}
            label="Account Holder Name *"
            name="accountHolderName"
            placeholder="Enter account holder name"
            isRequired
          />

          <CustomInput
            form={form}
            label="Bank Name *"
            name="bankName"
            placeholder="Enter bank name"
            isRequired
          />

          <div className="flex items-center space-x-2">
            <CustomInput
              form={form}
              label="IBAN Number *"
              name="ibanNumber"
              placeholder="Enter IBAN number"
              isRequired
            />
            <Info className="h-4 w-4 text-gray-400" />
          </div>

          <CustomInput
            form={form}
            label="Routing Number / SWIFT Code *"
            name="swiftCode"
            placeholder="Enter SWIFT code"
            isRequired
          />
        </div>
      )}
    </div>
  )

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium">Personal Documents</h3>
        <p className="text-sm text-gray-600">
          Safely upload scanned personal documents of this employee for
          record-keeping purposes.
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <div className="mb-2 text-lg font-medium">Drag & Drop File Here</div>
        <div className="mb-4 text-sm text-gray-600">or</div>
        <Button variant="outline" className="mb-4">
          Choose File
        </Button>
        <div className="text-sm text-gray-500">
          You can upload a maximum of 2 files. Please ensure each file size
          should not exceed 7MB.
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-gray-600">
            Don&apos;t know where to start, you can upload documents like these
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            "Passport",
            "Visa",
            "Insurance Card",
            "Emirates ID",
            "Employee Contract Document",
          ].map((docType) => (
            <Button key={docType} variant="outline" size="sm">
              {docType}
            </Button>
          ))}
          <Button variant="outline" size="sm">
            More -
          </Button>
        </div>
      </div>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicDetails()
      case 2:
        return renderSalaryDetails()
      case 3:
        return renderPersonalDetails()
      case 4:
        return renderPaymentInformation()
      case 5:
        return renderDocuments()
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-center text-2xl font-bold">
          {employeeName}&apos;s Profile
        </h1>
        {renderStepIndicator()}
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleNext)}
              className="space-y-6"
            >
              {renderStepContent()}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex items-center space-x-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancelAction}
                  >
                    {currentStep === 5 ? "Will do later" : "Cancel"}
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex items-center space-x-2">
                    <span>
                      {currentStep === 5
                        ? "Save & Complete"
                        : "Save and Continue"}
                    </span>
                    {currentStep < 5 && <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-4 text-right">
        <span className="text-sm text-red-500">
          * indicates mandatory fields
        </span>
      </div>
    </div>
  )
}
