import { revalidatePath } from "next/cache";

export function revalidateUserWorkspace(
  declaration?: { id?: string; slug?: string; previousSlug?: string }
) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/respostas");
  revalidatePath("/dashboard/conta");
  if (declaration?.id) revalidatePath(`/dashboard/${declaration.id}`);
  if (declaration?.slug) revalidatePath(`/nos/${declaration.slug}`);
  if (declaration?.previousSlug && declaration.previousSlug !== declaration.slug) {
    revalidatePath(`/nos/${declaration.previousSlug}`);
  }
}
