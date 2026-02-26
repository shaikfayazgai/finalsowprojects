export default function PreAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  )
}
