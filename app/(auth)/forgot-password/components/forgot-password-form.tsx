import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ForgotPasswordForm({
  className,
  imageUrl,
  ...props
}: React.ComponentProps<"div"> & {
  imageUrl?: string
}) {
  const router = useRouter()

  // Form state
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok || data.result === -1) {
        throw new Error(data.message || "Failed to send reset instructions.")
      }

      setSuccess(true)
    } catch (err) {
      console.error("Password reset error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset instructions. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your email to receive password reset instructions
                </p>
              </div>

              {/* Show error message if there's an error */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Show success message */}
              {success ? (
                <Alert>
                  <AlertDescription>
                    If an account exists with this email address, we have sent
                    password reset instructions.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send reset instructions"}
                  </Button>
                </>
              )}

              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Back to login
                </Link>
              </div>

              {success && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/login")}
                  className="mt-2"
                >
                  Return to login
                </Button>
              )}
            </div>
          </form>
          <div className="bg-primary/50 relative hidden md:block">
            {imageUrl && (
              <Image
                fill
                src={imageUrl}
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Need help? Contact <a href="#">support@acmeinc.com</a>
      </div>
    </div>
  )
}
