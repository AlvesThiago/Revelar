import { getDeclarationBySlug } from "@/lib/queries";
import { slugifyCoupleName } from "@/lib/slug";

export async function uniqueSlugFromCouple(base: string, ignoreId?: string) {
  const root = slugifyCoupleName(base);
  let candidate = root;
  let n = 2;
  while (true) {
    const found = await getDeclarationBySlug(candidate);
    if (!found || found.row.id === ignoreId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}
