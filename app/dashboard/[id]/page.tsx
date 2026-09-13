import { notFound } from "next/navigation";
import { Wizard } from "@/components/dashboard/wizard";
import { SiteHeader } from "@/components/site-header";
import { getDeclarationById } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Estúdio" };

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ passo?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { passo } = await searchParams;
  const record = await getDeclarationById(id);
  if (!record || record.userId !== user.id) notFound();
  const initialStep = Math.min(3, Math.max(0, Number(passo) - 1 || 0));

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <Wizard initial={record} initialStep={initialStep} />
    </div>
  );
}
