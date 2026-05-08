"use client"

// components/providers.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider, ThemeProviderProps } from "next-themes"

import { Toaster } from "@/components/ui/sonner"

import { ActiveThemeProvider } from "./active-theme"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
})

export function QueryProviders({
  children,
  theme,
}: { theme?: string } & ThemeProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <ActiveThemeProvider initialTheme={theme}>
          {children}
          <Toaster />
        </ActiveThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
