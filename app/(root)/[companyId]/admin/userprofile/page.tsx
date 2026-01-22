"use client"

import {
  ResetPasswordSchemaType,
  UserProfileSchemaType,
  resetPasswordSchema,
  userProfileSchema,
} from "@/schemas/admin"
import { useAuthStore } from "@/stores/auth-store"
import { usePermissionStore } from "@/stores/permission-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import PhotoUpload from "@/components/custom/photo-upload"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useGetById, usePersist } from "@/hooks/use-common"
import { clientDateFormat, formatDateForApi, parseDate } from "@/lib/date-utils"
import { AdminTransactionId, ModuleId } from "@/lib/utils"

export default function ProfilePage() {
  const { user } = useAuthStore()
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>("")

  const moduleId = ModuleId.admin
  const transactionIdProfile = AdminTransactionId.userProfile

  const { hasPermission } = usePermissionStore()

  const _canEdit = hasPermission(moduleId, transactionIdProfile, "isEdit")
  const _canDelete = hasPermission(moduleId, transactionIdProfile, "isDelete")
  const _canView = hasPermission(moduleId, transactionIdProfile, "isRead")
  const _canCreate = hasPermission(moduleId, transactionIdProfile, "isCreate")

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    emailNotifications: true,
    loginAlerts: true,
  })

  // API hooks
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useGetById<UserProfileSchemaType>(
    "/admin/GetUserProfile",
    "userProfile",
    user?.userId || "0"
  )

  const updateProfileMutation = usePersist<UserProfileSchemaType>(
    "/admin/SaveUserProfile"
  )

  const resetPasswordMutation = usePersist<ResetPasswordSchemaType>(
    "/admin/ResetPassword"
  )

  // Profile form
  const profileForm = useForm<UserProfileSchemaType>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      userId: parseInt(user?.userId || "0"),
      firstName: user?.userName?.split(" ")[0] || "",
      lastName: user?.userName?.split(" ").slice(1).join(" ") || "",
      birthDate: "",
      gender: "M",
      profilePicture: "",
      bio: "",
      primaryContactType: "Phone",
      primaryContactValue: "",
      secondaryContactType: "Phone",
      secondaryContactValue: "",
      addressType: "Home",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      languagePreference: "en-US",
      themePreference: "system",
      timezonePreference: "UTC",
    },
    mode: "onChange", // Enable real-time validation
  })

  // Update form when profile data is loaded
  useEffect(() => {
    if (profileData?.data) {
      // Handle both array and single object responses
      const profile = Array.isArray(profileData.data)
        ? profileData.data[0]
        : profileData.data

      if (profile) {
        // Set current profile picture for avatar display
        setCurrentProfilePicture(profile.profilePicture || "")

        profileForm.reset({
          userId: profile.userId,
          firstName: profile.firstName || user?.userName?.split(" ")[0] || "",
          lastName:
            profile.lastName ||
            user?.userName?.split(" ").slice(1).join(" ") ||
            "",
          birthDate: format(
            parseDate(profile.birthDate as string) || new Date(),
            clientDateFormat
          ),
          gender: profile.gender || "M",
          profilePicture: profile.profilePicture || "",
          bio: profile.bio || "",
          primaryContactType: profile.primaryContactType || "Phone",
          primaryContactValue: profile.primaryContactValue || "",
          secondaryContactType: profile.secondaryContactType || "Phone",
          secondaryContactValue: profile.secondaryContactValue || "",
          addressType: profile.addressType || "Home",
          street: profile.street || "",
          city: profile.city || "",
          state: profile.state || "",
          postalCode: profile.postalCode || "",
          country: profile.country || "",
          languagePreference: profile.languagePreference || "en-US",
          themePreference: profile.themePreference || "system",
          timezonePreference: profile.timezonePreference || "UTC",
        })
      }
    }
  }, [profileData, user?.userName, profileForm])

  // Password form
  const passwordForm = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      userId: parseInt(user?.userId || "0"),
      userCode: user?.userCode || "",
      userPassword: "",
      confirmPassword: "",
    },
  })

  // Update password form when user data changes
  useEffect(() => {
    if (user) {
      passwordForm.setValue("userId", parseInt(user.userId || "0"))
      passwordForm.setValue("userCode", user.userCode || "")
    }
  }, [user, passwordForm])

  // Profile form submission
  const onProfileSubmit = async (data: UserProfileSchemaType) => {
    if (Object.keys(profileForm.formState.errors).length > 0) {
      toast.error("Please fix the form errors before submitting")
      return
    }

    // Format birthDate for API submission
    const formattedData = {
      ...data,
      birthDate: formatDateForApi(data.birthDate) || "",
    }

    updateProfileMutation.mutate(formattedData)
  }

  // Password form submission
  const onPasswordSubmit = async (data: ResetPasswordSchemaType) => {
    if (Object.keys(passwordForm.formState.errors).length > 0) {
      toast.error("Please fix the password form errors before submitting")
      return
    }

    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        passwordForm.reset()
      },
    })
  }

  const handleSecuritySettingChange = (
    setting: keyof typeof securitySettings
  ) => {
    setSecuritySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }))

    toast.success("Setting Updated", {
      description: `${setting.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())} has been ${securitySettings[setting] ? "disabled" : "enabled"}.`,
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="container mx-auto space-y-2 px-4 pt-2 pb-4 sm:space-y-3 sm:px-6 sm:pt-3 sm:pb-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">
            Account Profile
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your account settings, personal information, and security
            preferences.
          </p>
        </div>
      </div>

      {isLoadingProfile && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      )}

      {profileError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                Error loading profile
              </p>
              <p className="text-sm text-red-700">
                {profileError.message || "Failed to load profile data"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Avatar and Basic Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>
                Upload and manage your profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <PhotoUpload
                  currentPhoto={currentProfilePicture}
                  onPhotoChange={(filePath) => {
                    // Update the profile picture in the form
                    profileForm.setValue("profilePicture", filePath)
                    setCurrentProfilePicture(filePath)
                  }}
                  isDisabled={updateProfileMutation.isPending}
                  label="Upload New Picture"
                  photoType="profile"
                  userId={user?.userId || ""}
                  userName={user?.userName || ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Two-Factor Authentication</Label>
                  <p className="text-muted-foreground text-xs">
                    Add extra security layer
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={() =>
                    handleSecuritySettingChange("twoFactorAuth")
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-muted-foreground text-xs">
                    Security alerts via email
                  </p>
                </div>
                <Switch
                  checked={securitySettings.emailNotifications}
                  onCheckedChange={() =>
                    handleSecuritySettingChange("emailNotifications")
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm">Login Alerts</Label>
                  <p className="text-muted-foreground text-xs">
                    New login notifications
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={() =>
                    handleSecuritySettingChange("loginAlerts")
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Basic Information</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register("firstName")}
                        placeholder="Enter your first name"
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-destructive text-sm">
                          {profileForm.formState.errors.firstName.message?.toString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register("lastName")}
                        placeholder="Enter your last name"
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-destructive text-sm">
                          {profileForm.formState.errors.lastName.message?.toString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...profileForm.register("birthDate")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue(
                            "gender",
                            value as "M" | "F" | "O"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...profileForm.register("bio")}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-destructive text-sm">
                        {profileForm.formState.errors.bio.message?.toString()}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="primaryContactType">
                        Primary Contact Type
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue(
                            "primaryContactType",
                            value as
                              | "Phone"
                              | "Email"
                              | "WhatsApp"
                              | "Skype"
                              | "Other"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Skype">Skype</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primaryContactValue">
                        Primary Contact
                      </Label>
                      <Input
                        id="primaryContactValue"
                        {...profileForm.register("primaryContactValue")}
                        placeholder="Enter contact value"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryContactType">
                        Secondary Contact Type
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue(
                            "secondaryContactType",
                            value as
                              | "Phone"
                              | "Email"
                              | "WhatsApp"
                              | "Skype"
                              | "Other"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Phone">Phone</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Skype">Skype</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryContactValue">
                        Secondary Contact
                      </Label>
                      <Input
                        id="secondaryContactValue"
                        {...profileForm.register("secondaryContactValue")}
                        placeholder="Enter contact value"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="addressType">Address Type</Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue(
                            "addressType",
                            value as
                              | "Home"
                              | "Office"
                              | "Billing"
                              | "Shipping"
                              | "Other"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Office">Office</SelectItem>
                          <SelectItem value="Billing">Billing</SelectItem>
                          <SelectItem value="Shipping">Shipping</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input
                        id="street"
                        {...profileForm.register("street")}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        {...profileForm.register("city")}
                        placeholder="Enter city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        {...profileForm.register("state")}
                        placeholder="Enter state"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        {...profileForm.register("postalCode")}
                        placeholder="Enter postal code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        {...profileForm.register("country")}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Globe className="h-4 w-4" />
                    Preferences
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="languagePreference">Language</Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue("languagePreference", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es-ES">Spanish</SelectItem>
                          <SelectItem value="fr-FR">French</SelectItem>
                          <SelectItem value="de-DE">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="themePreference">Theme</Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue(
                            "themePreference",
                            value as "light" | "dark" | "system"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezonePreference">Timezone</Label>
                      <Select
                        onValueChange={(value) =>
                          profileForm.setValue("timezonePreference", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">
                            Eastern Time
                          </SelectItem>
                          <SelectItem value="America/Chicago">
                            Central Time
                          </SelectItem>
                          <SelectItem value="America/Denver">
                            Mountain Time
                          </SelectItem>
                          <SelectItem value="America/Los_Angeles">
                            Pacific Time
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const testData = {
                        userId: parseInt(user?.userId || "0"),
                        firstName: "Test",
                        lastName: "User",
                        birthDate: "",
                        gender: undefined,
                        profilePicture: "",
                        bio: "",
                        primaryContactType: undefined,
                        primaryContactValue: "",
                        secondaryContactType: undefined,
                        secondaryContactValue: "",
                        addressType: undefined,
                        street: "",
                        city: "",
                        state: "",
                        postalCode: "",
                        country: "",
                        languagePreference: "en-US",
                        themePreference: "system" as const,
                        timezonePreference: "UTC",
                      }
                      updateProfileMutation.mutate(testData)
                    }}
                  >
                    Test API
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const formData = profileForm.getValues()
                      onProfileSubmit(formData)
                    }}
                  >
                    Test Form Submit
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    onClick={() => {}}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      {...passwordForm.register("userPassword")}
                      placeholder="Enter your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.userPassword && (
                    <p className="text-destructive text-sm">
                      {passwordForm.formState.errors.userPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...passwordForm.register("confirmPassword")}
                      placeholder="Confirm your new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-destructive text-sm">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg border p-4">
                  <h4 className="mb-2 font-medium">Password Requirements</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
