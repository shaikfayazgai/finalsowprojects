import { MeshBackground } from "@/components/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MeshBackground variant="warm" className="min-h-screen flex items-center justify-center p-4">
      {children}
    </MeshBackground>
  );
}
