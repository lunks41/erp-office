"use client"

import { useCompanyStore } from "@/stores/company-store"

import { useState } from "react"
import {
  IEmployee,
  IEmployeeBank,
  IEmployeeBasic,
  IEmployeePersonalDetails,
} from "@/interfaces/employee"
import { format } from "date-fns"
import {
  Briefcase,
  Building,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  Flag,
  Globe,
  Hash,
  Home,
  IdCard,
  Landmark,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  Wallet,
} from "lucide-react"

import { clientDateFormat } from "@/lib/date-utils"
import { getDayName } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { EmployeeBasicForm } from "./forms/employee-basic"
import { EmployeePaymentForm } from "./forms/employee-payment"
import { EmployeePersonalForm } from "./forms/employee-personal"

interface Props {
  employee: IEmployee
  employeeBasic: IEmployeeBasic
  employeePersonal: IEmployeePersonalDetails
  employeeBank: IEmployeeBank
  companyId: number
}

export function EmployeeOverview({
  employee,
  employeeBasic,
  employeePersonal,
  employeeBank,
  companyId,
}: Props) {
  const decimals = useCompanyStore((state) => state.decimals)
  const dateFormat = decimals[0]?.dateFormat || clientDateFormat

  const [showIban, setShowIban] = useState(false)
  const [basicDialogOpen, setBasicDialogOpen] = useState(false)
  const [personalDialogOpen, setPersonalDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  // Debug logging
  console.log("Employee data in overview:", employee)

  // Debug logging for mapped data
  console.log("Employee Basic for dialog:", employeeBasic)
  console.log("Employee Personal for dialog:", employeePersonal)
  console.log("Employee Bank for dialog:", employeeBank)

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="border-border bg-card h-full border shadow-sm">
            <CardHeader className="relative shrink-0 pb-4">
              <div className="absolute right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBasicDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-4 flex items-center justify-center">
                <Badge
                  variant="destructive"
                  className="border border-gray-300 bg-gray-50 text-xs text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  BASIC DETAILS
                </Badge>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gray-200 text-lg text-gray-600">
                    {employeeBasic?.employeeName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "EM"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {employeeBasic?.employeeName || ""} (
                    {employeeBasic?.employeeCode || ""})
                  </h3>
                  <p className="text-sm text-gray-500">
                    {employeeBasic?.designationName}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      {employeeBasic?.employerName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm">
                      {employeeBasic?.offEmailAdd || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {employeeBasic?.offPhoneNo || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">
                      {employeeBasic?.genderName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">
                      {employeeBasic?.joinDate
                        ? format(new Date(employeeBasic?.joinDate), dateFormat)
                        : "-"}{" "}
                      (Date of Joining)
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm">
                      {employeeBasic?.departmentName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    <span className="text-sm">
                      {employeeBasic?.workLocationName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Flag className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">
                      {employeeBasic?.nationalityName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-4 w-4 text-sky-500" />
                    <span className="text-sm">
                      {employeeBasic?.employmentType || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-violet-500" />
                    <span className="text-sm">
                      {getDayName(employeeBasic?.dayOfWeek)} (WeekOff)
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    {employeeBasic?.isActive ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="rounded-full bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 text-red-500" />
                        <span className="rounded-full bg-red-100 px-2 py-1 text-sm font-medium text-red-700">
                          Inactive
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Personal Information */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card h-full border shadow-sm">
            <CardHeader className="relative shrink-0 pb-4">
              <div className="absolute right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPersonalDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-4 flex items-center justify-center">
                <Badge
                  variant="destructive"
                  className="border border-slate-300 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  PERSONAL DETAILS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-pink-500" />
                    <label className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.dob
                        ? format(new Date(employeePersonal?.dob), dateFormat)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-teal-500" />
                    <label className="text-sm font-medium text-gray-500">
                      Father&apos;s Name
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.fatherName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Personal Email
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.emailAdd || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Emergency No
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.emergencyContactNo || "-"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-cyan-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Personal No
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.personalContactNo || "-"}
                    </span>
                  </div>
                </div>

                {/* Document Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <IdCard className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Work Permit No
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.workPermitNo || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <IdCard className="h-4 w-4 text-indigo-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Personal No
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.personalNo || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-4 w-4 text-cyan-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Passport No
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.passportNo || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Passport Expiry
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.passportExpiryDate
                        ? format(
                            new Date(
                              employeePersonal?.passportExpiryDate as string
                            ),
                            dateFormat
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <IdCard className="h-4 w-4 text-purple-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Emirates ID No
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.emiratesIdNo || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Emirates ID Expiry
                    </label>
                    <span className="text-sm">
                      {employeePersonal?.emiratesIdExpiryDate
                        ? format(
                            new Date(
                              employeePersonal?.emiratesIdExpiryDate as string
                            ),
                            dateFormat
                          )
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4 text-rose-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Present Residential Address
                    </label>
                  </div>
                  <p className="ml-7 text-sm">
                    {employeePersonal?.currentAddress || ""}
                  </p>
                  <div className="flex items-center space-x-3">
                    <Home className="h-4 w-4 text-red-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Permanent Address
                    </label>
                  </div>
                  <p className="ml-7 text-sm">
                    {employeePersonal?.permanentAddress || ""}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Payment Information */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card h-full border shadow-sm">
            <CardHeader className="relative shrink-0 pb-4">
              <div className="absolute right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="mb-2 flex items-center justify-center">
                <Badge
                  variant="destructive"
                  className="border border-emerald-300 bg-emerald-50 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800"
                >
                  PAYMENT DETAILS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-4">
                {/* Payment Mode */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Payment Mode
                    </label>
                    <span className="text-sm">Bank Transfer</span>
                  </div>
                </div>

                {/* Bank Account Information */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-sky-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Account Holder Name
                    </label>
                    <span className="text-sm">
                      {employeeBasic?.employeeName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-blue-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Bank Name
                    </label>
                    <span className="text-sm">
                      {employeeBank?.bankName || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-4 w-4 text-violet-600" />
                    <label className="text-sm font-medium text-gray-500">
                      Account No
                    </label>
                    <span className="text-sm">
                      {employeeBank?.accountNo || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Hash className="h-4 w-4 text-amber-600" />
                    <label className="text-sm font-medium text-gray-500">
                      SWIFT Code
                    </label>
                    <span className="text-sm">
                      {employeeBank?.swiftCode || ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                    <label className="text-sm font-medium text-gray-500">
                      IBAN No
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {showIban ? employeeBank?.iban || "" : "AEXXXXXXXX"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => setShowIban(!showIban)}
                      >
                        {showIban ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Account Integration */}
                <div className="space-y-3">
                  <div className="mb-2 flex items-center justify-center">
                    <Badge
                      variant="destructive"
                      className="border border-emerald-300 bg-emerald-50 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800"
                    >
                      ACCOUNT INTEGRATION
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Landmark className="h-4 w-4 text-teal-600" />
                    <label className="text-sm font-medium text-gray-500">
                      GL Code
                    </label>
                    {employeeBank?.glId && employeeBank.glId > 0 ? (
                      <span className="text-sm">
                        {employeeBank?.glCode || ""} {"-"}
                        {employeeBank?.glName || ""}
                      </span>
                    ) : (
                      <span className="animate-pulse text-sm font-medium text-red-500">
                        Not Integrated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={basicDialogOpen} onOpenChange={setBasicDialogOpen}>
        <DialogContent
          className="max-h-[80vh] w-[70vw] max-w-none! overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Basic Information</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <EmployeeBasicForm
              employee={employeeBasic}
              onCancelAction={() => setBasicDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={personalDialogOpen} onOpenChange={setPersonalDialogOpen}>
        <DialogContent
          className="max-h-[90vh] w-[70vw] max-w-none! overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Personal Information</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <EmployeePersonalForm
              employee={employeePersonal}
              onCancelAction={() => setPersonalDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent
          className="max-h-[90vh] w-[50vw] max-w-none! overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Payment Information</span>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6">
            <EmployeePaymentForm
              employee={employeeBank}
              companyId={companyId}
              onCancelAction={() => setPaymentDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
