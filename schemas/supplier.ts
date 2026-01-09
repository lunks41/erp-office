import { z } from "zod"

export const supplierSchema = z.object({
  supplierId: z.number(),

  supplierCode: z
    .string()
    .min(1, "Supplier code is required")
    .max(50, "Supplier code cannot exceed 50 characters"),
  supplierName: z
    .string()
    .min(1, "Supplier name is required")
    .max(150, "Supplier name cannot exceed 150 characters"),

  supplierOtherName: z
    .string()
    .max(150, "Supplier other name cannot exceed 150 characters")
    .optional(),
  supplierShortName: z
    .string()
    .max(150, "Supplier short name cannot exceed 150 characters")
    .optional(),
  supplierRegNo: z
    .string()
    .max(150, "Supplier registration number cannot exceed 50 characters")
    .optional(),
  parentSupplierId: z.number().optional(),

  currencyId: z.number().min(1, "Currency is required"),
  bankId: z.number().min(1, "Bank is required"),
  creditTermId: z.number().min(1, "Credit term is required"),
  accSetupId: z.number().min(1, "Account setup is required"),
  customerId: z.number().optional(),

  isSupplier: z.boolean().optional(),
  isVendor: z.boolean().optional(),
  isTrader: z.boolean().optional(),
  isCustomer: z.boolean().optional(),
  isDiffGstGl: z.boolean().optional(),

  remarks: z
    .string()
    .max(255, "Remarks cannot exceed 255 characters")
    .optional(),
  isActive: z.boolean(),
})
export type SupplierSchemaType = z.infer<typeof supplierSchema>

export const supplierContactSchema = z.object({
  contactId: z.number(),
  supplierId: z.number(),
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
    .max(20, "Mobile number cannot exceed 20 characters")
    .optional(),
  offNo: z
    .string()
    .max(20, "Office number cannot exceed 20 characters")
    .optional(),
  faxNo: z
    .string()
    .max(20, "Fax number cannot exceed 20 characters")
    .optional(),
  emailAdd: z.string().email("Please enter a valid email address").optional(),
  messId: z.string().max(50, "Mess ID cannot exceed 50 characters").optional(),
  contactMessType: z
    .string()
    .max(50, "Contact mess type cannot exceed 50 characters")
    .optional(),
  isDefault: z.boolean().optional(),
  isFinance: z.boolean().optional(),
  isSales: z.boolean().optional(),
  isActive: z.boolean(),
})
export type SupplierContactSchemaType = z.infer<typeof supplierContactSchema>

export const supplierAddressSchema = z.object({
  supplierId: z.number(),
  addressId: z.number(),
  address1: z
    .string()
    .min(1, "Address 1 is required")
    .max(255, "Address 1 cannot exceed 255 characters"),
  address2: z
    .string()
    .max(255, "Address 2 cannot exceed 255 characters")
    .optional(),
  address3: z
    .string()
    .max(255, "Address 3 cannot exceed 255 characters")
    .optional(),
  address4: z
    .string()
    .max(255, "Address 4 cannot exceed 255 characters")
    .optional(),
  pinCode: z
    .string()
    .max(20, "Pin code cannot exceed 20 characters")
    .optional(),
  countryId: z.number().min(1, "Country is required"),
  phoneNo: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),
  faxNo: z
    .string()
    .max(20, "Fax number cannot exceed 20 characters")
    .optional(),
  emailAdd: z.string().email("Please enter a valid email address").optional(),
  webUrl: z.string().url("Please enter a valid URL").optional(),
  isDefaultAdd: z.boolean().optional(),
  isDeliveryAdd: z.boolean().optional(),
  isFinAdd: z.boolean().optional(),
  isSalesAdd: z.boolean().optional(),
  isActive: z.boolean(),
})
export type SupplierAddressSchemaType = z.infer<typeof supplierAddressSchema>
