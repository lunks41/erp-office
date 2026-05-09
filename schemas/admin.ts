import * as z from "zod"

export const userSchema = z.object({
  userId: z.number().min(0),
  userCode: z
    .string()
    .min(3, { message: "User code must be at least 3 characters" })
    .max(50, { message: "User code must be less than 50 characters" }),
  userName: z
    .string()
    .min(3, { message: "User name must be at least 3 characters" })
    .max(150, { message: "User name must be less than 150 characters" }),
  userEmail: z
    .string()
    .email({ message: "Invalid email format" })
    .max(50, { message: "User email must be less than 150 characters" }),
  userRoleId: z.number().min(1, { message: "User role is required" }),
  userPassword: z.string().optional(),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean(),
  isLocked: z.boolean(),
}).superRefine((data, ctx) => {
  const isCreateMode = data.userId === 0
  if (isCreateMode && (!data.userPassword || data.userPassword.trim().length < 8)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["userPassword"],
      message: "Password must be at least 8 characters long",
    })
  }
})

export type UserSchemaType = z.infer<typeof userSchema>

export const userGroupSchema = z.object({
  userGroupId: z
    .number()
    .min(0, { message: "User group ID must be 0 or greater" }),
  userGroupCode: z
    .string()
    .min(5, { message: "User group code must be at least 5 characters" })
    .max(50, { message: "User group code must be less than 50 characters" }),
  userGroupName: z
    .string()
    .min(5, { message: "User group name must be at least 5 characters" })
    .max(100, { message: "User group name must be less than 10 characters" }),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean(),
})

export type UserGroupSchemaType = z.infer<typeof userGroupSchema>

export const userRoleSchema = z.object({
  userRoleId: z
    .number()
    .min(0, { message: "User role ID must be 0 or greater" }),
  userRoleCode: z
    .string()
    .min(5, { message: "User role code must be at least 5 characters" })
    .max(50, { message: "User role code must be less than 50 characters" }),
  userRoleName: z
    .string()
    .min(5, { message: "User role name must be at least 5 characters" })
    .max(100, { message: "User role name must be less than 100 characters" }),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean(),
})

export type UserRoleSchemaType = z.infer<typeof userRoleSchema>

export const companySchema = z.object({
  companyId: z
    .number()
    .int({ message: "Company ID must be a whole number" })
    .min(1, { message: "Company ID must be greater than 0" })
    .max(255, { message: "Company ID cannot exceed 255" }),
  companyCode: z
    .string()
    .min(1, { message: "Company code is required" })
    .max(50, { message: "Company code must be less than 50 characters" }),
  companyName: z
    .string()
    .min(1, { message: "Company name is required" })
    .max(200, { message: "Company name must be less than 200 characters" }),
  registrationNo: z
    .string()
    .max(100, { message: "Registration number must be less than 100 characters" })
    .optional(),
  taxRegistrationNo: z
    .string()
    .max(100, { message: "Tax registration number must be less than 100 characters" })
    .optional(),
  molId: z
    .string()
    .max(50, { message: "MOL ID must be less than 50 characters" })
    .optional(),
  address: z.string().optional(),
  email: z
    .string()
    .max(200, { message: "Email must be less than 200 characters" })
    .email({ message: "Invalid email format" })
    .or(z.literal(""))
    .optional(),
  phoneNo: z
    .string()
    .max(50, { message: "Phone number must be less than 50 characters" })
    .optional(),
  remarks: z
    .string()
    .max(255, { message: "Remarks cannot exceed 255 characters" })
    .optional(),
  isActive: z.boolean(),
  currencyId: z.number().min(0, { message: "Currency is required" }),
  peppolId: z
    .string()
    .max(100, { message: "Peppol ID must be less than 100 characters" })
    .optional(),
})

export type CompanySchemaType = z.infer<typeof companySchema>

export const userFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type UserFilterValues = z.infer<typeof userFilterSchema>

export const userGroupFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type UserGroupFilterValues = z.infer<typeof userGroupFilterSchema>

export const userRoleFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type UserRoleFilterValues = z.infer<typeof userRoleFilterSchema>

export const companyFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
})

export type CompanyFilterValues = z.infer<typeof companyFilterSchema>

export const resetPasswordSchema = z.object({
  userId: z.number().min(1, { message: "User ID must be greater than 0" }),
  userCode: z.string().min(1, { message: "User code is required" }),
  userPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Confirm password must be at least 8 characters long" }),
})

export type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>

export const userGroupRightsSchema = z.object({
  userGroupId: z
    .number()
    .min(1, { message: "User group ID must be greater than 0" }),
  moduleId: z.number().min(1, { message: "Module ID must be greater than 0" }),
  moduleName: z.string().min(1, { message: "Module name is required" }),
  transactionId: z
    .number()
    .min(1, { message: "Transaction ID must be greater than 0" }),
  transactionName: z
    .string()
    .min(1, { message: "Transaction name is required" }),
  isRead: z.boolean(),
  isCreate: z.boolean(),
  isEdit: z.boolean(),
  isDelete: z.boolean(),
  isExport: z.boolean(),
  isPrint: z.boolean(),
  isPost: z.boolean(),
  isDebitNote: z.boolean(),
})

export type UserGroupRightsSchemaType = z.infer<typeof userGroupRightsSchema>

export const userRightsSchema = z.object({
  companyId: z
    .number()
    .min(1, { message: "Company ID must be greater than 0" }),
  companyCode: z.string().min(1, { message: "Company code is required" }),
  companyName: z.string().min(1, { message: "Company name is required" }),
  isAccess: z.boolean(),
  userId: z.number(),
  userGroupId: z.number(),
})

export type UserRightsSchemaType = z.infer<typeof userRightsSchema>

export const cloneUserGroupRightsSchema = z.object({
  fromUserGroupId: z
    .number()
    .min(1, { message: "Source user group ID must be greater than 0" }),
  toUserGroupId: z
    .number()
    .min(1, { message: "Target user group ID must be greater than 0" }),
})

export type CloneUserGroupRightsSchemaType = z.infer<
  typeof cloneUserGroupRightsSchema
>

export const userProfileSchema = z.object({
  userId: z.number(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  birthDate: z.string().optional(),
  gender: z.enum(["M", "F", "O"]).optional(),
  profilePicture: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),

  // Contact Information
  primaryContactType: z
    .enum(["Phone", "Email", "WhatsApp", "Skype", "Other"])
    .optional(),
  primaryContactValue: z.string().optional(),
  secondaryContactType: z
    .enum(["Phone", "Email", "WhatsApp", "Skype", "Other"])
    .optional(),
  secondaryContactValue: z.string().optional(),

  // Address Information
  addressType: z
    .enum(["Home", "Office", "Billing", "Shipping", "Other"])
    .optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Preferences
  languagePreference: z.string().optional(),
  themePreference: z.enum(["light", "dark", "system"]).optional(),
  timezonePreference: z.string().optional(),
})

export type UserProfileSchemaType = z.infer<typeof userProfileSchema>

// Password Schema
export const userPasswordSchema = z
  .object({
    userPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.userPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

export type UserPasswordSchemaType = z.infer<typeof userPasswordSchema>

export const report_category_string_limits = {
  repCategoryCode: 50,
  repCategoryName: 100,
  remarks: 255,
} as const

export const report_category_numeric_limits = {
  repCategoryId: { min: 0, max: 255 },
} as const

export const report_catalog_string_limits = {
  reportFolder: 100,
  reportName: 100,
  reportFileName: 100,
} as const

export const report_catalog_numeric_limits = {
  moduleId: { min: 0, max: 255 },
  reportId: { min: 0, max: 32767 },
  itemNo: { min: 0, max: 255 },
  transactionId: { min: 0, max: 32767 },
  repCategoryId: { min: 0, max: 255 },
  repParamGroup: { min: 0, max: 255 },
  seqNo: { min: 0, max: 32767 },
} as const

export const reportCategorySchema = z.object({
  repCategoryId: z
    .number()
    .int()
    .min(report_category_numeric_limits.repCategoryId.min)
    .max(report_category_numeric_limits.repCategoryId.max),
  repCategoryCode: z
    .string()
    .min(1, { message: "Category code is required" })
    .max(report_category_string_limits.repCategoryCode),
  repCategoryName: z
    .string()
    .min(1, { message: "Category name is required" })
    .max(report_category_string_limits.repCategoryName),
  remarks: z
    .string()
    .max(report_category_string_limits.remarks)
    .optional(),
})

export type ReportCategorySchemaType = z.infer<typeof reportCategorySchema>

/** Payload for SaveAdmReport (company comes from API header) */
export const reportCatalogSaveSchema = z.object({
  moduleId: z
    .number()
    .int()
    .min(1, { message: "Module is required" })
    .max(report_catalog_numeric_limits.moduleId.max),
  reportId: z
    .number()
    .int()
    .min(0)
    .max(report_catalog_numeric_limits.reportId.max),
  itemNo: z
    .number()
    .int()
    .min(0)
    .max(report_catalog_numeric_limits.itemNo.max),
  transactionId: z
    .number()
    .int()
    .min(1, { message: "Transaction is required" })
    .max(report_catalog_numeric_limits.transactionId.max),
  repCategoryId: z
    .number()
    .int()
    .min(1, { message: "Report category is required" })
    .max(report_catalog_numeric_limits.repCategoryId.max),
  reportFolder: z.string().max(report_catalog_string_limits.reportFolder),
  reportName: z
    .string()
    .min(1, { message: "Report name is required" })
    .max(report_catalog_string_limits.reportName),
  reportFileName: z.string().max(report_catalog_string_limits.reportFileName),
  isScreen: z.boolean(),
  isList: z.boolean(),
  isCompSpecific: z.boolean(),
  repParamGroup: z
    .number()
    .int()
    .min(0)
    .max(report_catalog_numeric_limits.repParamGroup.max),
  seqNo: z
    .number()
    .int()
    .min(0)
    .max(report_catalog_numeric_limits.seqNo.max),
  isActive: z.boolean(),
})

export type ReportCatalogSaveSchemaType = z.infer<typeof reportCatalogSaveSchema>
