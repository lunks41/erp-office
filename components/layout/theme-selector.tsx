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

const THEME_ICONS = [
  {
    name: "Default",
    value: "default-scaled",
    icon: <Sun className="h-4 w-4" />,
  },
  {
    name: "Blue",
    value: "blue-scaled",
    icon: <Droplet className="h-4 w-4" />,
  },
  {
    name: "Green",
    value: "green-scaled",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    name: "Amber",
    value: "amber-scaled",
    icon: <CircleDollarSign className="h-4 w-4" />,
  },
  {
    name: "Mono",
    value: "mono-scaled",
    icon: <Moon className="h-4 w-4" />,
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
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 rounded-md border-[#C4D6FF] bg-[#E0EAFF] text-[#3355CC] hover:bg-[#C4D6FF] hover:text-[#3355CC]"
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
