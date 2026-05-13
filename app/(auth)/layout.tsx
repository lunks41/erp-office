
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
    </div>
  )
}
