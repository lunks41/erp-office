import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Removed static export config to fix dynamic routes issue
  // output: "export",

  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  // Ensure static files are served correctly
  trailingSlash: false,

  // Webpack configuration for React-PDF
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configure React-PDF for client-side usage
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        fs: false,
        path: false,
        stream: false,
        util: false,
      }
    }
    return config
  },

  // Configure static file serving
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/documents/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Enable unoptimized images for better compatibility
    unoptimized: true,
    // Add local domains for development
    domains: ["localhost"],
  },

  // Expose app version to client components (footer/sidebar).
  // Priority: explicit .env value -> package.json version -> hard fallback.
  env: {
    NEXT_PUBLIC_APP_VERSION:
      process.env.NEXT_PUBLIC_APP_VERSION ??
      process.env.npm_package_version ??
      "1.2.0",
  },
}

export default nextConfig
