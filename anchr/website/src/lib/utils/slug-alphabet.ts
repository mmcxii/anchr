/**
 * Pure slug-generation primitives, safe to import from both server and client
 * code. The DB-touching uniqueness wrapper lives in `short-slug.ts` and must
 * stay server-only; this module holds the alphabet and the random-draw
 * function that don't depend on Drizzle / Neon, so marketing visuals can
 * import from here without pulling db evaluation into the client bundle.
 */

/** Safe alphabet excluding ambiguous characters (0, O, 1, l, I). */
export const SAFE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/**
 * Generate a slug of the given length from SAFE_ALPHABET using
 * `crypto.getRandomValues` (CSPRNG). Math.random is predictable and shouldn't
 * seed user-facing identifiers that end up as discoverable URL paths.
 *
 * We reject bytes that fall into a biased tail (`bytes[i] >= cap`) and retry,
 * which eliminates modulo bias across the 31-char alphabet. `cap` is the
 * largest multiple of alphabet.length that fits in a byte.
 */
export function generateRandomSlug(length: number): string {
  const alphabet = SAFE_ALPHABET;
  const cap = Math.floor(256 / alphabet.length) * alphabet.length;
  let slug = "";
  while (slug.length < length) {
    const bytes = new Uint8Array(length - slug.length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && slug.length < length; i++) {
      if (bytes[i] < cap) {
        slug += alphabet[bytes[i] % alphabet.length];
      }
    }
  }
  return slug;
}
