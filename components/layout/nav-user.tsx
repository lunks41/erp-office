"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { BadgeCheck, LogOut } from "lucide-react"

import { COMPANY_HEADER_UTILITY_BUTTON } from "@/components/layout/company-header-utility"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    role: string
    avatar: string
  }
}) {
  const router = useRouter()
  const { logOut, currentCompany } = useAuthStore()

  const handleLogout = async () => {
    try {
      await logOut()
      // After successful logout, redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={COMPANY_HEADER_UTILITY_BUTTON}
          aria-label="User Profile"
        >
          <Avatar className="size-7 rounded-md">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-md text-[11px] font-semibold leading-none text-[#3355CC]">
              CN
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg text-[#3355CC]">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {user.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/${currentCompany?.companyId}/admin/profile`)
            }
          >
            <BadgeCheck />
            Account Profile
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
