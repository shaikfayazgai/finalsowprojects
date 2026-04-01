import { MeshBackground } from "@/components/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MeshBackground variant="warm" className="min-h-screen flex justify-center px-6 py-6">
      <div className="w-full max-w-7xl flex justify-start py-8 pl-6">
        {children}
      </div>
    </MeshBackground>
  );
}
