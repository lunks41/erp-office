import { z } from "zod"

export const bankSchema = z.object({
  bankId: z.number(),

  bankCode: z
    .string()
    .min(1, "Bank code is required")
    .max(50, "Bank code cannot exceed 50 characters"),
  bankName: z
    .string()
    .min(1, "Bank name is required")
    .max(150, "Bank name cannot exceed 150 characters"),

  currencyId: z.number().min(1, "Currency is required"),

  accountNo: z
    .string()
    .max(50, "Account number cannot exceed 50 characters")
    .optional(),
  swiftCode: z
    .string()
    .max(100, "SWIFT code cannot exceed 50 characters")
    .optional(),
  iban: z.string().max(50, "IBAN cannot exceed 50 characters").optional(),
  remarks1: z
    .string()
    .max(2000, "Remarks1 cannot exceed 255 characters")
    .optional(),
  remarks2: z
    .string()
    .max(2000, "Remarks2 cannot exceed 255 characters")
    .optional(),
  remarks3: z
    .string()
    .max(2000, "Remarks3 cannot exceed 255 characters")
    .optional(),
  glId: z.number().optional(),

  isPettyCashBank: z.boolean().optional(),
  isOwnBank: z.boolean().optional(),
  isActive: z.boolean(),
})
export type BankSchemaType = z.infer<typeof bankSchema>

export const bankContactSchema = z.object({
  contactId: z.number(),
  bankId: z.number(),
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
export type BankContactSchemaType = z.infer<typeof bankContactSchema>

export const bankAddressSchema = z.object({
  bankId: z.number(),
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
export type BankAddressSchemaType = z.infer<typeof bankAddressSchema>
