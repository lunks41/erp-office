import { IBankAddress, IBankContact } from "@/interfaces/bank"
import { ICustomerAddress, ICustomerContact } from "@/interfaces/customer"
import {
  IAccountGroupLookup,
  IAccountSetupCategoryLookup,
  IAccountSetupLookup,
  IAccountTypeLookup,
  IBankLookup,
  IBargeLookup,
  ICOACategory1Lookup,
  ICOACategory2Lookup,
  ICOACategory3Lookup,
  ICargoTypeLookup,
  ICarrierLookup,
  ICategoryLookup,
  IChargeLookup,
  IChartOfAccountLookup,
  ICompanyLookup,
  IConsignmentTypeLookup,
  ICountryLookup,
  ICreditTermLookup,
  ICurrencyLookup,
  ICustomerLookup,
  IDepartmentLookup,
  IDesignationLookup,
  IDocumentTypeLookup,
  IDynamicLookup,
  IEmployeeLookup,
  IEmployerLookup,
  IEntityTypeLookup,
  IGenderLookup,
  IGeoLocationLookup,
  IGstCategoryLookup,
  IGstLookup,
  IJobOrderLookup,
  IJobStatusLookup,
  ILandingPurposeLookup,
  ILandingTypeLookup,
  ILeaveTypeLookup,
  ILoanTypeLookup,
  IModuleLookup,
  IOrderTypeCategoryLookup,
  IOrderTypeLookup,
  IPassTypeLookup,
  IPayrollComponentGroupLookup,
  IPayrollComponentLookup,
  IPortLookup,
  IPortRegionLookup,
  IProductLookup,
  IRankLookup,
  IServiceCategoryLookup,
  IServiceItemNoLookup,
  IServiceLookup,
  IServiceModeLookup,
  IServiceTypeCategoryLookup,
  IStatusTypeLookup,
  ISubCategoryLookup,
  ISupplierLookup,
  ISupplyTypeLookup,
  ITaskLookup,
  ITaskStatusLookup,
  ITaxCategoryLookup,
  ITaxLookup,
  ITransactionLookup,
  ITransportLocationLookup,
  ITransportModeLookup,
  IUomLookup,
  IUserGroupLookup,
  IUserLookup,
  IUserRoleLookup,
  IVesselLookup,
  IVesselTypeLookup,
  IVisaLookup,
  IVoyageLookup,
  IWorkLocationLookup,
  IYearLookup,
} from "@/interfaces/lookup"
import { IPaymentType } from "@/interfaces/paymenttype"
import { ISupplierAddress, ISupplierContact } from "@/interfaces/supplier"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"

import { apiClient, getData } from "@/lib/api-client"
import {
  Admin,
  DynamicLookupSetting,
  Lookup,
  MandatoryFieldSetting,
  VisibleFieldSetting,
} from "@/lib/api-routes"

/**
 * 1. Query Configuration
 */
const defaultQueryConfig = {
  staleTime: 60 * 60 * 1000, // 1 hour
  refetchOnWindowFocus: false,
}
/**
 * 2. Error Handler
 */
const handleApiError = (error: unknown) => {
  if (error instanceof AxiosError) {
    const axiosError = error as AxiosError<{ message: string }>
    throw new Error(axiosError.response?.data?.message || "An error occurred")
  }
  throw error
}
/**
 * 3. Transaction Management
 * ------------------------
 * 3.1 Get Transactions
 * @param {object} params - Parameters object
 * @param {number} params.moduleId - Module ID
 * @returns {object} Query object containing transactions
 */
export const useGetTransactions = ({
  moduleId,
}: {
  moduleId: number | null | undefined
}) => {
  return useQuery({
    queryKey: ["transactions", moduleId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const response = await apiClient.get(Admin.getUserTransactions, {
          headers: { moduleId },
        })
        return response.data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!moduleId,
  })
}
/**
 * 4. Field Management
 * -----------------
 * 4.1 Get Required Fields
 * @param {number} moduleId - Module ID
 * @param {number} transactionId - Transaction ID
 * @returns {object} Query object containing required fields
 */
export const useGetRequiredFields = (
  moduleId: number | undefined,
  transactionId: number | undefined
) => {
  return useQuery({
    queryKey: ["required-fields", moduleId, transactionId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${MandatoryFieldSetting.get}/${moduleId}/${transactionId}`
        )
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!moduleId && !!transactionId,
  })
}
/**
 * 4.2 Get Visible Fields
 * @param {number} moduleId - Module ID
 * @param {number} transactionId - Transaction ID
 * @returns {object} Query object containing visible fields
 */
export const useGetVisibleFields = (
  moduleId: number | undefined,
  transactionId: number | undefined
) => {
  return useQuery({
    queryKey: ["visible-fields", moduleId, transactionId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${VisibleFieldSetting.get}/${moduleId}/${transactionId}`
        )
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: !!moduleId && !!transactionId,
  })
}
/**
 * 5. Dynamic Lookup Management
 * --------------------------
 * 5.1 Get Dynamic Lookup
 * @returns {object} Query object containing dynamic lookup data
 */
export const useGetDynamicLookup = () => {
  return useQuery<IDynamicLookup>({
    queryKey: ["dynamic-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(DynamicLookupSetting.get)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
/**
 * 6. Contact Management
 * -------------------
 * 6.1 Get Customer Contact Lookup
 * @param {number|string} customerId - Customer ID
 * @returns {object} Query object containing customer contacts
 */
export const useCustomerContactLookup = (customerId: number | string) => {
  return useQuery<ICustomerContact[]>({
    queryKey: ["customer-contact-lookup", customerId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getCustomerContact}/${customerId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: customerId !== 0,
  })
}
/**
 * 6.2 Get Customer Address Lookup
 * @param {number|string} customerId - Customer ID
 * @returns {object} Query object containing customer addresses
 */
export const useCustomerAddressLookup = (customerId: number | string) => {
  return useQuery<ICustomerAddress[]>({
    queryKey: ["customer-address-lookup", customerId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getCustomerAddress}/${customerId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: customerId !== 0,
  })
}
/**
 * 6.3 Get Supplier Contact Lookup
 * @param {number|string} supplierId - Supplier ID
 * @returns {object} Query object containing supplier contacts
 */
export const useSupplierContactLookup = (supplierId: number | string) => {
  return useQuery<ISupplierContact[]>({
    queryKey: ["Supplier-contact-lookup", supplierId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${Lookup.getSupplierContactList}/${supplierId}`
        )
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: supplierId !== 0,
  })
}
/**
 * 6.6 Get Bank Contact Lookup
 * @param {number|string} bankId - Bank ID
 * @returns {object} Query object containing bank contacts
 */
export const useBankContactLookup = (bankId: number | string) => {
  return useQuery<IBankContact[]>({
    queryKey: ["bank-contact-lookup", bankId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getBankContact}/${bankId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: bankId !== 0,
  })
}
/**
 * 6.4 Get Supplier Address Lookup
 * @param {number|string} supplierId - Supplier ID
 * @returns {object} Query object containing supplier addresses
 */
export const useSupplierAddressLookup = (supplierId: number | string) => {
  return useQuery<ISupplierAddress[]>({
    queryKey: ["Supplier-address-lookup", supplierId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${Lookup.getSupplierAddressList}/${supplierId}`
        )
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: supplierId !== 0,
  })
}
/**
 * 6.5 Get Bank Address Lookup
 * @param {number|string} bankId - Bank ID
 * @returns {object} Query object containing bank addresses
 */
export const useBankAddressLookup = (bankId: number | string) => {
  return useQuery<IBankAddress[]>({
    queryKey: ["bank-address-lookup", bankId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getBankAddress}/${bankId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: bankId !== 0,
  })
}
export const useModuleLookup = (IsVisible: boolean, IsMandatory: boolean) => {
  return useQuery<IModuleLookup[]>({
    queryKey: ["moduleLookup", IsVisible, IsMandatory],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${Lookup.getModule}/${IsVisible}/${IsMandatory}`
        )
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCountryLookup = () => {
  return useQuery<ICountryLookup[]>({
    queryKey: ["country-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCountry)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useTaxLookup = () => {
  return useQuery<ITaxLookup[]>({
    queryKey: ["tax-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getTax)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useTaxCategoryLookup = () => {
  return useQuery<ITaxCategoryLookup[]>({
    queryKey: ["taxCategory-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getTaxCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useGstCategoryLookup = () => {
  return useQuery<IGstCategoryLookup[]>({
    queryKey: ["gstCategory-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getGstCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useBankLookup = () => {
  return useQuery<IBankLookup[]>({
    queryKey: ["bank-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getBank)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useDepartmentLookup = () => {
  return useQuery<IDepartmentLookup[]>({
    queryKey: ["department-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getDepartment)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useWorkLocationLookup = () => {
  return useQuery<IWorkLocationLookup[]>({
    queryKey: ["work-location-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getWorkLocation)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useProductLookup = () => {
  return useQuery<IProductLookup[]>({
    queryKey: ["product-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getProduct)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useBargeLookup = () => {
  return useQuery<IBargeLookup[]>({
    queryKey: ["barge-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getBarge)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useGstLookup = () => {
  return useQuery<IGstLookup[]>({
    queryKey: ["gst-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getGst)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useEmployeeLookup = () => {
  return useQuery<IEmployeeLookup[]>({
    queryKey: ["employee-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getEmployee)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useEmployerLookup = () => {
  return useQuery<IEmployerLookup[]>({
    queryKey: ["employer-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        //const data = await getData(`${Lookup.getEmployer}/${CompanyId}`)
        const data = await getData(`${Lookup.getEmployer}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useLoanTypeLookup = () => {
  return useQuery<ILoanTypeLookup[]>({
    queryKey: ["loan-type-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getLoanType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useLeaveTypeLookup = () => {
  return useQuery<ILeaveTypeLookup[]>({
    queryKey: ["leave-type-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getLeaveType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useAccountGroupLookup = () => {
  return useQuery<IAccountGroupLookup[]>({
    queryKey: ["account-group-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getAccountGroup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useAccountTypeLookup = () => {
  return useQuery<IAccountTypeLookup[]>({
    queryKey: ["account-type-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getAccountType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useAccountSetupLookup = () => {
  return useQuery<IAccountSetupLookup[]>({
    queryKey: ["account-setup-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getAccountSetup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCategoryLookup = () => {
  return useQuery<ICategoryLookup[]>({
    queryKey: ["category-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const usePortregionLookup = () => {
  return useQuery<IPortRegionLookup[]>({
    queryKey: ["portregion-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getPortRegion)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useVoyageLookup = () => {
  return useQuery<IVoyageLookup[]>({
    queryKey: ["voyage-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getVoyage)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useDesignationLookup = () => {
  return useQuery<IDesignationLookup[]>({
    queryKey: ["designation-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getDesignation)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCOACategory1Lookup = () => {
  return useQuery<ICOACategory1Lookup[]>({
    queryKey: ["coacategory1-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCoaCategory1)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCOACategory2Lookup = () => {
  return useQuery<ICOACategory2Lookup[]>({
    queryKey: ["coacategory2-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCoaCategory2)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCOACategory3Lookup = () => {
  return useQuery<ICOACategory3Lookup[]>({
    queryKey: ["coacategory3-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCoaCategory3)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useAccountSetupCategoryLookup = () => {
  return useQuery<IAccountSetupCategoryLookup[]>({
    queryKey: ["account-setup-category-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getAccountSetupCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useSupplierLookup = () => {
  return useQuery<ISupplierLookup[]>({
    queryKey: ["supplier-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getSupplier)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const usePortLookup = () => {
  return useQuery<IPortLookup[]>({
    queryKey: ["port-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getPort)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const usePortRegionLookup = () => {
  return useQuery<IPortRegionLookup[]>({
    queryKey: ["port-region-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getPortRegion)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useUserLookup = () => {
  return useQuery<IUserLookup[]>({
    queryKey: ["user-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getUser)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCurrencyLookup = () => {
  return useQuery<ICurrencyLookup[]>({
    queryKey: ["currency-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCurrency)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useCreditTermLookup = () => {
  return useQuery<ICreditTermLookup[]>({
    queryKey: ["creditterm-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCreditTerm)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}

export const useChartOfAccountLookup = (companyId: number) => {
  return useQuery<IChartOfAccountLookup[]>({
    queryKey: ["chartofaccount-lookup", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        if (companyId > 0) {
          const data = await getData(`${Lookup.getChartOfAccount}/${companyId}`)
          return data?.data || []
        } else {
          const data = await getData(Lookup.getChartOfAccount)
          return data?.data || []
        }
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0,
  })
}

export const useBankChartOfAccountLookup = (companyId: number) => {
  return useQuery<IChartOfAccountLookup[]>({
    queryKey: ["bankchartofaccount-lookup", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        if (companyId > 0) {
          const data = await getData(
            `${Lookup.getBankChartOfAccount}/${companyId}`
          )
          return data?.data || []
        } else {
          const data = await getData(Lookup.getBankChartOfAccount)
          return data?.data || []
        }
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0,
  })
}

export const useReceivableChartOfAccountLookup = (companyId: number) => {
  return useQuery<IChartOfAccountLookup[]>({
    queryKey: ["receivablechartofaccount-lookup", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        if (companyId > 0) {
          const data = await getData(
            `${Lookup.getReceivableChartOfAccount}/${companyId}`
          )
          return data?.data || []
        } else {
          const data = await getData(Lookup.getReceivableChartOfAccount)
          return data?.data || []
        }
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0,
  })
}

export const usePayableChartOfAccountLookup = (companyId: number) => {
  return useQuery<IChartOfAccountLookup[]>({
    queryKey: ["payablechartofaccount-lookup", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        if (companyId > 0) {
          const data = await getData(
            `${Lookup.getPayableChartOfAccount}/${companyId}`
          )
          return data?.data || []
        } else {
          const data = await getData(Lookup.getPayableChartOfAccount)
          return data?.data || []
        }
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId > 0,
  })
}

export const useUomLookup = () => {
  return useQuery<IUomLookup[]>({
    queryKey: ["uom-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getUom)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useUserGroupLookup = () => {
  return useQuery<IUserGroupLookup[]>({
    queryKey: ["usergroup-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getUserGroup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useUserRoleLookup = () => {
  return useQuery<IUserRoleLookup[]>({
    queryKey: ["userrole-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getUserRole)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useOrderTypeLookup = () => {
  return useQuery<IOrderTypeLookup[]>({
    queryKey: ["ordertype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getOrderType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useOrderTypeCategoryLookup = () => {
  return useQuery<IOrderTypeCategoryLookup[]>({
    queryKey: ["ordertypecategory-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getOrderTypeCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useServiceCategoryLookup = () => {
  return useQuery<IServiceCategoryLookup[]>({
    queryKey: ["servicecategory-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getServiceCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useServiceTypeCategoryLookup = () => {
  return useQuery<IServiceTypeCategoryLookup[]>({
    queryKey: ["servicetypecategory-lookup"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getServiceTypeCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
  })
}
export const useSubCategoryLookup = () => {
  return useQuery<ISubCategoryLookup[]>({
    queryKey: ["subcategory-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getSubCategory)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useTransactionLookup = (id: number) => {
  return useQuery<ITransactionLookup[]>({
    queryKey: ["transaction-lookUp", id],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getTransaction}/${id}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: id !== 0,
  })
}
export const usePaymentTypeLookup = () => {
  return useQuery<IPaymentType[]>({
    queryKey: ["paymenttype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getPaymentType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useVesselLookup = () => {
  return useQuery<IVesselLookup[]>({
    queryKey: ["vessel-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getVessel)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useCustomerDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<ICustomerLookup[]>({
    queryKey: ["customer-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getCustomerDynamic}?${searchParams.toString()}`
          : Lookup.getCustomerDynamic

        const data = await getData(url)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useSupplierDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<ISupplierLookup[]>({
    queryKey: ["supplier-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getSupplierDynamic}?${searchParams.toString()}`
          : Lookup.getSupplierDynamic

        const data = await getData(url)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useProductDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<IProductLookup[]>({
    queryKey: ["product-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getProductDynamic}?${searchParams.toString()}`
          : Lookup.getProductDynamic

        const data = await getData(url)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useVoyageDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<IVoyageLookup[]>({
    queryKey: ["voyage-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getVoyageDynamic}?${searchParams.toString()}`
          : Lookup.getVoyageDynamic

        const data = await getData(url)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useVesselDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<IVesselLookup[]>({
    queryKey: ["vessel-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getVesselDynamic}?${searchParams.toString()}`
          : Lookup.getVesselDynamic

        const data = await getData(url)

        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useVesselById = (vesselId: number) => {
  return useQuery<IVesselLookup | null>({
    queryKey: ["vessel-by-id", vesselId],
    queryFn: async () => {
      try {
        if (!vesselId || vesselId === 0) return null

        // Try to get vessel by ID using the regular vessel lookup with a filter
        const data = await getData(`${Lookup.getVessel}?vesselId=${vesselId}`)

        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          const vessel = data.data[0]
          return {
            vesselId: vessel.vesselId,
            vesselName: vessel.vesselName,
            vesselCode: vessel.vesselCode || "",
            imoCode: vessel.imoCode || "",
          }
        }

        return null
      } catch (error) {
        handleApiError(error)
        return null
      }
    },
    enabled: !!vesselId && vesselId !== 0,
    refetchOnWindowFocus: false,
  })
}

export const useBargeDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<IBargeLookup[]>({
    queryKey: ["barge-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getBargeDynamic}?${searchParams.toString()}`
          : Lookup.getBargeDynamic

        const data = await getData(url)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useJobOrderLookup = () => {
  return useQuery<IJobOrderLookup[]>({
    queryKey: ["joborder-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getJobOrder)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useJobOrderDynamicLookup = (queryParams?: {
  searchString?: string
}) => {
  return useQuery<IJobOrderLookup[]>({
    queryKey: ["joborder-dynamic-lookUp", queryParams?.searchString],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams()
        if (queryParams?.searchString) {
          searchParams.append("searchString", queryParams.searchString)
        }

        const url = queryParams?.searchString
          ? `${Lookup.getJobOrderDynamic}?${searchParams.toString()}`
          : Lookup.getJobOrderDynamic

        const data = await getData(url)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useTaskLookup = () => {
  return useQuery<ITaskLookup[]>({
    queryKey: ["task-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getTask)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useChargeLookup = () => {
  return useQuery<IChargeLookup[]>({
    queryKey: ["charge-lookUp"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getCharge}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
        return []
      }
    },
    enabled: true,
  })
}

export const useTransportChargeLookup = () => {
  return useQuery<IChargeLookup[]>({
    queryKey: ["transportcharge-lookUp"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getTransportCharge}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
        return []
      }
    },
    enabled: true,
  })
}

export const useCustomerLookup = () => {
  return useQuery<ICustomerLookup[]>({
    queryKey: ["customer-lookUp"],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        // Using the new api-client approach
        const data = await getData(Lookup.getCustomer)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: true,
  })
}
export const useCompanyCustomerLookup = (companyId: number) => {
  return useQuery<ICustomerLookup[]>({
    queryKey: ["customer-lookUp", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        // Using the new api-client approach
        const data = await getData(`${Lookup.getCompanyCustomer}/${companyId}`)
        //const data = await getData(`${Lookup.getCustomer}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId !== 0,
  })
}

export const useCompanySupplierLookup = (companyId: number) => {
  return useQuery<ISupplierLookup[]>({
    queryKey: ["supplier-lookUp", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        // Using the new api-client approach
        const data = await getData(`${Lookup.getCompanySupplier}/${companyId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId !== 0,
  })
}

export const useJobOrderTaskLookup = (jobOrderId: number) => {
  return useQuery<ITaskLookup[]>({
    queryKey: ["joborder-task-lookUp", jobOrderId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getJobOrderTask}/${jobOrderId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: jobOrderId !== 0,
  })
}
export const useJobOrderChargeLookup = (jobOrderId: number, taskId: number) => {
  return useQuery<IServiceItemNoLookup[]>({
    queryKey: ["joborder-charge-lookUp", jobOrderId, taskId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(
          `${Lookup.getJobOrderCharge}/${jobOrderId}/${taskId}`
        )
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: jobOrderId !== 0 && taskId !== 0,
  })
}
export const useDocumentTypeLookup = () => {
  return useQuery<IDocumentTypeLookup[]>({
    queryKey: ["documenttype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getDocumentType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useEntityTypeLookup = () => {
  return useQuery<IEntityTypeLookup[]>({
    queryKey: ["entitytype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getEntityType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useJobStatusLookup = () => {
  return useQuery<IJobStatusLookup[]>({
    queryKey: ["jobstatus-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getJobStatus)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useTaskStatusLookup = () => {
  return useQuery<ITaskStatusLookup[]>({
    queryKey: ["taskstatus-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getTaskStatus)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useRankLookup = () => {
  return useQuery<IRankLookup[]>({
    queryKey: ["rank-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getRank)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useGenderLookup = () => {
  return useQuery<IGenderLookup[]>({
    queryKey: ["gender-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getGender)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useVisaLookup = () => {
  return useQuery<IVisaLookup[]>({
    queryKey: ["visa-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getVisa)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useGeoLocationLookup = () => {
  return useQuery<IGeoLocationLookup[]>({
    queryKey: ["geolocation-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getGeoLocation)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useSupplyTypeLookup = () => {
  return useQuery<ISupplyTypeLookup[]>({
    queryKey: ["supplyType-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getSupplyType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useVesselTypeLookup = () => {
  return useQuery<IVesselTypeLookup[]>({
    queryKey: ["vesselType-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getVesselType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useCargoTypeLookup = () => {
  return useQuery<ICargoTypeLookup[]>({
    queryKey: ["cargoType-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCargoType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const usePassTypeLookup = () => {
  return useQuery<IPassTypeLookup[]>({
    queryKey: ["passtype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getPassType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useLandingTypeLookup = () => {
  return useQuery<ILandingTypeLookup[]>({
    queryKey: ["landingtype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getLandingType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useLandingPurposeLookup = () => {
  return useQuery<ILandingPurposeLookup[]>({
    queryKey: ["landingpurpose-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getLandingPurpose)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useServiceModeLookup = () => {
  return useQuery<IServiceModeLookup[]>({
    queryKey: ["servicemode-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getServiceMode)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useTransportModeLookup = () => {
  return useQuery<ITransportModeLookup[]>({
    queryKey: ["transportmode-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getTransportMode)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useTransportLocationLookup = () => {
  return useQuery<ITransportLocationLookup[]>({
    queryKey: ["transportlocation-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getTransportLocation)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useConsignmentTypeLookup = () => {
  return useQuery<IConsignmentTypeLookup[]>({
    queryKey: ["consignmenttype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getConsignmentType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useCarrierLookup = () => {
  return useQuery<ICarrierLookup[]>({
    queryKey: ["carrier-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCarrier)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useCompanyLookup = () => {
  return useQuery<ICompanyLookup[]>({
    queryKey: ["company-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getCompany)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useJobOrderCustomerLookup = (
  customerId: number,
  jobOrderId: number
) => {
  return useQuery<IJobOrderLookup[]>({
    queryKey: ["joborder-customer-lookUp", customerId, jobOrderId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        // If jobOrderId is 0, we want all job orders for the customer
        // For now, we'll use the regular job order lookup and filter by customer
        // This is a temporary solution until we have a proper endpoint
        if (jobOrderId === 0) {
          const data = await getData(Lookup.getJobOrder)
          // Filter by customerId if available
          const allJobOrders = data
          return allJobOrders.filter(
            (jobOrder: IJobOrderLookup & { customerId?: number }) =>
              jobOrder.customerId === customerId
          )
        } else {
          const data = await getData(
            `${Lookup.getJobOrderCustomer}/${customerId}/${jobOrderId}`
          )
          return data?.data || []
        }
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: customerId !== 0,
  })
}

export const useJobOrderCompanyLookup = (companyId: number) => {
  return useQuery<IJobOrderLookup[]>({
    queryKey: ["joborder-company-lookUp", companyId],
    ...defaultQueryConfig,
    queryFn: async () => {
      try {
        const data = await getData(`${Lookup.getJobOrderCompany}/${companyId}`)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    enabled: companyId !== 0,
  })
}

export const usePayrollComponentLookup = () => {
  return useQuery<IPayrollComponentLookup[]>({
    queryKey: ["payrollcomponent-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getComponentLookup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const usePayrollComponentGroupLookup = () => {
  return useQuery<IPayrollComponentGroupLookup[]>({
    queryKey: ["payrollcomponentgroup-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getPayrollComponentGroupLookup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useLoanRequestStatusLookup = () => {
  return useQuery<IStatusTypeLookup[]>({
    queryKey: ["loanrequeststatus-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getLoanRequestStatusLookup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useApprovalStatusTypeLookup = () => {
  return useQuery<IStatusTypeLookup[]>({
    queryKey: ["landingtype-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getApprovalStatusType)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
export const useDisbursementLookup = () => {
  return useQuery<IStatusTypeLookup[]>({
    queryKey: ["disbursement-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getDisbursementLookup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useRepaymentStatusLookup = () => {
  return useQuery<IStatusTypeLookup[]>({
    queryKey: ["repaymentstatus-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getRepaymentStatusLookup)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useCurrentYearLookup = () => {
  return useQuery<IYearLookup[]>({
    queryKey: ["currentyear-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getYear)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}

export const useFutureYearLookup = () => {
  return useQuery<IYearLookup[]>({
    queryKey: ["futureyear-lookUp"],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      try {
        const data = await getData(Lookup.getFutureYear)
        return data?.data || []
      } catch (error) {
        handleApiError(error)
      }
    },
    refetchOnWindowFocus: false,
  })
}
