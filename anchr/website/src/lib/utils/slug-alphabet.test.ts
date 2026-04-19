import { describe, expect, it } from "vitest";
import { SAFE_ALPHABET, generateRandomSlug } from "./slug-alphabet";

// Characters deliberately excluded from SAFE_ALPHABET because they're easy to
// confuse at a glance on a phone screen. If any of these slip through, the
// whole point of the safe-alphabet design — "can a user read this short URL
// off a sticker and type it into a browser?" — falls apart.
const AMBIGUOUS_CHARS = ["0", "O", "1", "l", "I"];

describe("generateRandomSlug", () => {
  it("generates a slug of the requested length", () => {
    //* Act
    const slug = generateRandomSlug(5);

    //* Assert
    expect(slug).toHaveLength(5);
  });

  it("generates a slug of length 7", () => {
    //* Act
    const slug = generateRandomSlug(7);

    //* Assert
    expect(slug).toHaveLength(7);
  });

  it("only contains characters from the safe alphabet", () => {
    //* Act
    const slugs = Array.from({ length: 100 }, () => {
      return generateRandomSlug(6);
    });

    //* Assert
    for (const slug of slugs) {
      for (const char of slug) {
        expect(SAFE_ALPHABET).toContain(char);
      }
    }
  });

  it("never contains ambiguous characters", () => {
    //* Act
    const slugs = Array.from({ length: 200 }, () => {
      return generateRandomSlug(8);
    });

    //* Assert
    for (const slug of slugs) {
      for (const char of AMBIGUOUS_CHARS) {
        expect(slug).not.toContain(char);
      }
    }
  });

  it("generates different slugs on consecutive calls", () => {
    //* Act
    const slugs = new Set<string>();
    for (let i = 0; i < 50; i++) {
      slugs.add(generateRandomSlug(6));
    }

    //* Assert — with 31^6 possible combinations, 50 slugs should all be unique
    expect(slugs.size).toBe(50);
  });
});

describe("SAFE_ALPHABET", () => {
  it("excludes every ambiguous character", () => {
    //* Act
    const alphabet = SAFE_ALPHABET;

    //* Assert — regression guard. The marketing typewriter and the production
    //  slug generator both read from this constant, so a typo that slipped an
    //  "0" or "l" back in would fail both places at once.
    for (const char of AMBIGUOUS_CHARS) {
      expect(alphabet).not.toContain(char);
    }
  });
});
