import { z } from "zod"

export const customerSchema = z.object({
  customerId: z.number(),

  customerCode: z
    .string()
    .min(1, "Customer code is required")
    .max(50, "Customer code cannot exceed 50 characters"),
  customerName: z
    .string()
    .min(1, "Customer name is required")
    .max(150, "Customer name cannot exceed 150 characters"),

  customerOtherName: z
    .string()
    .max(150, "Customer other name cannot exceed 150 characters")
    .optional(),
  customerShortName: z
    .string()
    .max(150, "Customer short name cannot exceed 150 characters")
    .optional(),
  customerRegNo: z
    .string()
    .max(150, "Customer registration number cannot exceed 50 characters")
    .optional(),
  currencyId: z.number().min(1, "Currency is required"),
  bankId: z.number().min(1, "Bank is required"),
  creditTermId: z.number().min(1, "Credit term is required"),
  accSetupId: z.number().min(1, "Account setup is required"),
  supplierId: z.number().optional(),

  parentCustomerId: z.number().optional(),

  isCustomer: z.boolean().optional(),
  isVendor: z.boolean().optional(),
  isTrader: z.boolean().optional(),
  isSupplier: z.boolean().optional(),
  isCredit: z.boolean().optional(),

  remarks: z
    .string()
    .max(255, "Remarks cannot exceed 255 characters")
    .optional(),
  isActive: z.boolean(),
})
export type CustomerSchemaType = z.infer<typeof customerSchema>

export const customerContactSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  contactId: z.number(),
  contactName: z
    .string()
    .min(1, "Contact name is required")
    .max(150, "Contact name cannot exceed 150 characters"),
  otherName: z
    .string()
    .max(150, "Other name cannot exceed 150 characters")
    .optional(),
  mobileNo: z
    .string()
    .max(150, "Mobile number cannot exceed 150 characters")
    .optional(),
  offNo: z
    .string()
    .max(150, "Office number cannot exceed 150 characters")
    .optional(),
  faxNo: z
    .string()
    .max(150, "Fax number cannot exceed 150 characters")
    .optional(),
  emailAdd: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email format",
    }),
  messId: z
    .string()
    .max(150, "Mess ID cannot exceed 150 characters")
    .optional(),
  contactMessType: z
    .string()
    .max(150, "Contact mess type cannot exceed 150 characters")
    .optional(),
  isDefault: z.boolean(),
  isFinance: z.boolean(),
  isSales: z.boolean(),
  isActive: z.boolean(),
})
export type CustomerContactSchemaType = z.infer<typeof customerContactSchema>

export const customerAddressSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  addressId: z.number(),
  billName: z
    .string()
    .min(1, "Bill name is required")
    .max(150, "Bill name cannot exceed 150 characters"),
  address1: z
    .string()
    .min(1, "Address 1 is required")
    .max(150, "Address 1 cannot exceed 150 characters"),
  address2: z
    .string()
    .min(1, "Address 2 is required")
    .max(150, "Address 2 cannot exceed 150 characters"),
  address3: z
    .string()
    .max(150, "Address 3 cannot exceed 150 characters")
    .optional(),
  address4: z
    .string()
    .max(150, "Address 4 cannot exceed 150 characters")
    .optional(),
  pinCode: z
    .string()
    .max(150, "PIN code cannot exceed 150 characters")
    .optional(),
  countryId: z.number().min(1, "Country is required"),
  phoneNo: z
    .string()
    .min(1, "Phone number is required")
    .max(150, "Phone number cannot exceed 150 characters"),
  faxNo: z
    .string()
    .max(150, "Fax number cannot exceed 150 characters")
    .optional(),
  emailAdd: z
    .string()
    .max(150, "Email address cannot exceed 150 characters")
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email format",
    }),
  webUrl: z
    .string()
    .max(150, "Web URL cannot exceed 150 characters")
    .optional(),
  isDefaultAdd: z.boolean(),
  isDeliveryAdd: z.boolean(),
  isFinAdd: z.boolean(),
  isSalesAdd: z.boolean(),
  isActive: z.boolean(),
})
export type CustomerAddressSchemaType = z.infer<typeof customerAddressSchema>
