import { MeshBackground } from "@/components/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MeshBackground variant="warm" className="min-h-screen flex justify-center py-6">
      <div className="w-full max-w-7xl py-8 px-6">
        {children}
      </div>
    </MeshBackground>
  );
}
