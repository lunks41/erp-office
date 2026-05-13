import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"

import { fontVariables } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { AuthInitializer } from "@/components/auth/auth-initializer"
import { SecurityProvider } from "@/components/auth/security-provider"
import { Analytics } from "@/components/layout/analytics"
import { CompanyProvider } from "@/components/layout/company-provider"
import { QueryProviders } from "@/components/layout/queryproviders"

import "./globals.css"

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
}

const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "ERP",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://172.16.31.6:4000",
  ogImage:
    process.env.NEXT_PUBLIC_SITE_OG_IMAGE ||
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://172.16.31.6:4000"}/og.jpg`,
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Comprehensive Enterprise Resource Planning system for shipping, logistics, and maritime operations. Streamline your business processes with integrated modules for accounting, project management, and document control.",
  links: {
    twitter: process.env.NEXT_PUBLIC_SITE_TWITTER || "https://twitter.com/erp",
    github: process.env.NEXT_PUBLIC_SITE_GITHUB || "https://github.com/erp",
  },
}

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  keywords: [
    "ERP",
    "Enterprise Resource Planning",
    "Shipping Management",
    "Logistics",
    "Maritime Operations",
    "Accounting",
    "Project Management",
    "Document Control",
    "Business Management",
    "Supply Chain",
  ],
  authors: [
    {
      name: process.env.NEXT_PUBLIC_SITE_AUTHOR_NAME || "AMES Technologies",
      url: process.env.NEXT_PUBLIC_SITE_URL || "http://172.16.31.6:4000",
    },
  ],
  creator: process.env.NEXT_PUBLIC_SITE_AUTHOR_NAME || "AMES Technologies",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: process.env.NEXT_PUBLIC_SITE_TWITTER_HANDLE || "@erp",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
}

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = cookies()
  const activeThemeValue = (await cookieStore).get("active_theme")?.value
  const isScaled = activeThemeValue?.endsWith("-scaled")

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={cn(
          "bg-background overscroll-none antialiased",
          activeThemeValue ? `theme-${activeThemeValue}` : "",
          isScaled ? "theme-scaled" : "",
          fontVariables
        )}
      >
        <QueryProviders>
          <SecurityProvider>
            <CompanyProvider>
              <AuthInitializer />
              {children}
              <Analytics />
            </CompanyProvider>
          </SecurityProvider>
        </QueryProviders>
      </body>
    </html>
  )
}
