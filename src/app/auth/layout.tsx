export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 80% -10%, color-mix(in srgb, var(--color-gold-200) 12%, transparent) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at -5% 60%, color-mix(in srgb, var(--color-teal-200) 8%, transparent) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 50% 100%, color-mix(in srgb, var(--color-brown-200) 6%, transparent) 0%, transparent 50%),
          linear-gradient(180deg, var(--color-beige-50) 0%, #FFFFFF 40%, var(--color-gray-50) 100%)
        `,
      }}
    >
      {children}
    </div>
  );
}
