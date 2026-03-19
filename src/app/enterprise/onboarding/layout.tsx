import { MeshBackground } from "@/components/ui";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MeshBackground variant="warm" className="min-h-screen flex justify-center p-4">
      <div className="w-full max-w-3xl flex flex-col py-6">
        {children}
      </div>
    </MeshBackground>
  );
}
