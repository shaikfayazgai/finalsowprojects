import { Suspense } from "react";
import { CredentialsWorkspace } from "../components/credentials-workspace";
import { WalletSkeleton } from "../components/wallet-skeleton";

export default function ContributorCredentialsPage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <CredentialsWorkspace />
    </Suspense>
  );
}
