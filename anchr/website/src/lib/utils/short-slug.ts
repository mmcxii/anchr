import { db } from "@/lib/db/client";
import { shortSlugsTable } from "@/lib/db/schema/short-slug";
import { eq } from "drizzle-orm";
// Pure primitives (alphabet + CSPRNG-backed random-draw) live in
// `slug-alphabet.ts` so client-only modules (e.g. TypewriterUrlVisual) can
// import them without pulling Drizzle / Neon into the browser bundle.
import { SAFE_ALPHABET, generateRandomSlug } from "./slug-alphabet";

// Re-export for server callers that already import from this module.
export { SAFE_ALPHABET, generateRandomSlug };

/** Maximum retries at a given length before bumping to the next. */
const MAX_RETRIES_PER_LENGTH = 3;

/** Starting slug length. */
const DEFAULT_START_LENGTH = 5;

/** Absolute max length to prevent infinite loops. */
const MAX_LENGTH = 12;

export async function generateUniqueShortSlug(startLength = DEFAULT_START_LENGTH): Promise<string> {
  let length = startLength;
  let retries = 0;

  while (length <= MAX_LENGTH) {
    const candidate = generateRandomSlug(length);

    const [existing] = await db
      .select({ slug: shortSlugsTable.slug })
      .from(shortSlugsTable)
      .where(eq(shortSlugsTable.slug, candidate))
      .limit(1);

    if (existing == null) {
      return candidate;
    }

    retries++;
    if (retries >= MAX_RETRIES_PER_LENGTH) {
      length++;
      retries = 0;
    }
  }

  throw new Error("Failed to generate a unique short slug");
}
