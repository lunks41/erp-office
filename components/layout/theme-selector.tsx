"use client"

import React from "react"
import { Check, CircleDollarSign, Droplet, Leaf, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemeConfig } from "@/components/layout/active-theme"
import {
  COMPANY_HEADER_UTILITY_BUTTON,
  COMPANY_HEADER_UTILITY_ICON,
} from "@/components/layout/company-header-utility"

const THEME_ICONS = [
  {
    name: "Default",
    value: "default-scaled",
    icon: <Sun className={COMPANY_HEADER_UTILITY_ICON} />,
  },
  {
    name: "Blue",
    value: "blue-scaled",
    icon: <Droplet className={COMPANY_HEADER_UTILITY_ICON} />,
  },
  {
    name: "Green",
    value: "green-scaled",
    icon: <Leaf className={COMPANY_HEADER_UTILITY_ICON} />,
  },
  {
    name: "Amber",
    value: "amber-scaled",
    icon: <CircleDollarSign className={COMPANY_HEADER_UTILITY_ICON} />,
  },
  {
    name: "Mono",
    value: "mono-scaled",
    icon: <Moon className={COMPANY_HEADER_UTILITY_ICON} />,
  },
]

const NEXT_PUBLIC_DEFAULT_THEME = "amber-scaled"

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig()
  const currentTheme =
    THEME_ICONS.find((theme) => theme.value === activeTheme) || THEME_ICONS[0]

  React.useEffect(() => {
    if (!activeTheme) {
      setActiveTheme(NEXT_PUBLIC_DEFAULT_THEME)
    }
  }, [activeTheme, setActiveTheme])

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={COMPANY_HEADER_UTILITY_BUTTON}
            aria-label="Theme Selector"
          >
            {currentTheme.icon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Themes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEME_ICONS.map((theme) => (
            <DropdownMenuItem
              key={theme.value}
              onClick={() => setActiveTheme(theme.value)}
              className="flex items-center gap-3"
            >
              {theme.icon}
              <span>{theme.name}</span>
              {activeTheme === theme.value && (
                <Check className="text-primary ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
