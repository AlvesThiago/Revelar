export function slugifyCoupleName(name: string) {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return cleaned || "nos";
}

export function firstNameFromCouple(coupleName: string) {
  const parts = coupleName
    .split(/\s*(?:&|e|E)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[0] || "quem te ama";
}
