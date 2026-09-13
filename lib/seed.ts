import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { declarations, photos, users } from "@/lib/schema";
import { hashPassword, newId } from "@/lib/crypto";

const EXAMPLE_OWNER_EMAIL = "exemplo@revelar.app";
const EXAMPLE_SLUG = "gabriel-e-amanda";

const EXAMPLE_PHOTOS = [
  {
    imageUrl:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80",
    caption: "O café daquele domingo em que o tempo parou.",
    filter: "vintage",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1522673607200-164d71b6623e?auto=format&fit=crop&w=1400&q=80",
    caption: "A primeira viagem. Você riu o caminho inteiro.",
    filter: "natural",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=1400&q=80",
    caption: "Quando o sol baixou e eu soube que era você.",
    filter: "sepia",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?auto=format&fit=crop&w=1400&q=80",
    caption: "Nossas mãos já se conheciam.",
    filter: "bw",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=1400&q=80",
    caption: "O jantar em que você pediu sobremesa por nós dois.",
    filter: "vintage",
  },
  {
    imageUrl:
      "https://images.unsplash.com/photo-1529333166437-7750c2d54e7b?auto=format&fit=crop&w=1400&q=80",
    caption: "Ainda bem que o universo insistiu.",
    filter: "natural",
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedIfNeeded().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function seedIfNeeded() {
  const [legacyDemo] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "demo@revelar.app"))
    .limit(1);

  if (legacyDemo) {
    await db
      .update(users)
      .set({ passwordHash: hashPassword(randomBytes(32).toString("hex")) })
      .where(eq(users.id, legacyDemo.id));
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, EXAMPLE_OWNER_EMAIL))
    .limit(1);

  const userId = existingUser?.id ?? newId();
  const passwordHash = hashPassword(randomBytes(32).toString("hex"));

  if (!existingUser) {
    await db.insert(users).values({
      id: userId,
      name: "Gabriel",
      email: EXAMPLE_OWNER_EMAIL,
      passwordHash,
    });
  }

  const [existingExample] = await db
    .select({ id: declarations.id })
    .from(declarations)
    .where(eq(declarations.slug, EXAMPLE_SLUG))
    .limit(1);

  if (existingExample) return;

  const declarationId = newId();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  start.setMonth(start.getMonth() - 3);
  start.setDate(14);

  await db.insert(declarations).values({
    id: declarationId,
    userId,
    slug: EXAMPLE_SLUG,
    coupleName: "Gabriel & Amanda",
    title: "Nosso primeiro ano de muitos",
    startDate: start,
    soundtrackUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    soundtrackType: "url",
    soundtrackName: "Piano ao entardecer",
    revealEffect: "polaroid",
    wallpaper: "wood",
    viewMode: "deck",
    slideshowSeconds: 6,
    published: true,
  });

  await db.insert(photos).values(
    EXAMPLE_PHOTOS.map((photo, index) => ({
      id: newId(),
      declarationId,
      sortOrder: index,
      imageUrl: photo.imageUrl,
      caption: photo.caption,
      filter: photo.filter,
    }))
  );
}
