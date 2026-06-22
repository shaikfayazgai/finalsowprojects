import { redirect } from "next/navigation";

/** Spec alias — `/enterprise/sow/new?mode=upload` → intake wizard. */
export default async function NewSowPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  if (mode && ["upload", "author", "generate", "template"].includes(mode)) {
    redirect(`/enterprise/sow/intake?mode=${mode}`);
  }
  redirect("/enterprise/sow/intake");
}
