export default function PreAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-app p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
