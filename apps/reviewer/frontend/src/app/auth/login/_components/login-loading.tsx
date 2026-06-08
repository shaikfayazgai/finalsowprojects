import { AuthFormCard, AuthSplitLayout } from "@/components/auth/auth-split-layout";

export function LoginLoading() {
  return (
    <AuthSplitLayout>
      <AuthFormCard>
        <div className="space-y-4 animate-pulse">
          <div className="h-11 w-11 mx-auto rounded-xl bg-bg-subtle lg:hidden" />
          <div className="h-7 w-3/4 mx-auto rounded-md bg-bg-subtle" />
          <div className="h-4 w-2/3 mx-auto rounded-md bg-bg-subtle" />
          <div className="h-11 w-full rounded-lg bg-bg-subtle mt-4" />
          <div className="h-11 w-full rounded-lg bg-bg-subtle" />
          <div className="h-4 w-8 mx-auto rounded bg-bg-subtle my-4" />
          <div className="h-11 w-full rounded-lg bg-bg-subtle" />
          <div className="h-11 w-full rounded-lg bg-bg-subtle" />
          <div className="h-11 w-full rounded-lg bg-brand/20 mt-2" />
        </div>
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
