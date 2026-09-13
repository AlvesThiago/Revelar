import { notFound } from "next/navigation";
import { getPublicDeclarationAction } from "@/app/actions/declarations";
import { LockedGate } from "@/components/viewer/locked-gate";
import { ViewerExperience } from "@/components/viewer/viewer-experience";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicDeclarationAction(slug);
  if (result.status === "missing") return { title: "Declaração" };
  const name = result.status === "ok" ? result.declaration.coupleName : result.coupleName;
  return { title: name || "Declaração" };
}

export default async function CouplePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicDeclarationAction(slug);
  if (result.status === "missing") notFound();
  if (result.status === "locked") {
    return (
      <LockedGate
        slug={slug}
        coupleName={result.coupleName}
        title={result.title}
        wallpaper={result.wallpaper}
      />
    );
  }
  return <ViewerExperience declaration={result.declaration} />;
}
