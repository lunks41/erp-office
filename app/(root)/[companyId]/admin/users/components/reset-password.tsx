"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { useResetPasswordV1 } from "@/hooks/use-admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResetPasswordData {
  password: string
  confirmPassword: string
}

interface FormErrors {
  password?: string
  confirmPassword?: string
}

interface ResetPasswordProps {
  userId: number
  userCode: string
  onCancelAction: () => void
  onSuccessAction?: () => void
}

export function ResetPassword({
  userId,
  userCode,
  onCancelAction,
  onSuccessAction,
}: ResetPasswordProps) {
  const [resetPasswordData, setResetPasswordData] = useState<ResetPasswordData>(
    {
      password: "",
      confirmPassword: "",
    }
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Reset form when component mounts (dialog opens)
  const resetForm = () => {
    setResetPasswordData({ password: "", confirmPassword: "" })
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFormErrors({})
  }

  // Reset form on mount and when userId changes (dialog opens for different user)
  useEffect(() => {
    resetForm()
  }, [userId])

  const resetPasswordMutation = useResetPasswordV1()

  const handleCancelReset = () => {
    resetForm()
    resetPasswordMutation.reset()
    onCancelAction()
  }

  const validateForm = () => {
    const errors: FormErrors = {}

    if (resetPasswordData.password.length < 3) {
      errors.password = "Password must be at least 3 characters long"
    }

    if (resetPasswordData.password !== resetPasswordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleResetPassword = async () => {
    if (!userId) {
      toast.error("User ID is required for password reset")
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      const response = await resetPasswordMutation.mutateAsync({
        userId: userId,
        userCode: userCode,
        userPassword: resetPasswordData.password,
        confirmPassword: resetPasswordData.confirmPassword,
      })

      if (response.result === 1) {
        toast.success("Password reset successfully")
        resetForm()
        onSuccessAction?.()
      } else {
        toast.error("Failed to reset password")
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while resetting password"
      toast.error(errorMessage)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={resetPasswordData.password}
            onChange={(e) => {
              setResetPasswordData({
                ...resetPasswordData,
                password: e.target.value,
              })
              // Clear error when user starts typing
              if (formErrors.password) {
                setFormErrors({ ...formErrors, password: undefined })
              }
            }}
            className={`pr-10 ${formErrors.password ? "border-red-500" : ""}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        {formErrors.password && (
          <p className="text-sm text-red-500">{formErrors.password}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={resetPasswordData.confirmPassword}
            onChange={(e) => {
              setResetPasswordData({
                ...resetPasswordData,
                confirmPassword: e.target.value,
              })
              // Clear error when user starts typing
              if (formErrors.confirmPassword) {
                setFormErrors({ ...formErrors, confirmPassword: undefined })
              }
            }}
            className={`pr-10 ${formErrors.confirmPassword ? "border-red-500" : ""}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        {formErrors.confirmPassword && (
          <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={handleCancelReset}
          disabled={resetPasswordMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleResetPassword}
          disabled={
            resetPasswordMutation.isPending ||
            !resetPasswordData.password ||
            !resetPasswordData.confirmPassword
          }
        >
          {resetPasswordMutation.isPending ? "Resetting..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
