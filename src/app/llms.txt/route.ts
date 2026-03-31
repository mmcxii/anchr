import { envSchema } from "@/lib/env";

export function GET() {
  const baseUrl = envSchema.NEXT_PUBLIC_APP_URL;

  const text = `# Anchr

> Anchr is a link-in-bio platform that brings your scattered profiles, payment handles, and important links into one beautiful, blazing-fast page you actually own.

Every user has a public profile at \`${baseUrl}/{username}\`. Each profile page includes rich JSON-LD structured data (schema.org \`ProfilePage\`, \`Person\` with \`sameAs\`, and \`ItemList\` of all links).

Profiles can also be accessed via custom domains (e.g., \`https://alice.com\`).

## Profiles

- [Sitemap](${baseUrl}/sitemap.xml): Discover all public Anchr profiles
- [Pricing](${baseUrl}/pricing): Free and Pro tier details

## API

Anchr provides a public REST API at \`${baseUrl}/api/v1\`. Authenticate with an API key via \`Authorization: Bearer anc_k_...\`.

- \`GET /api/v1/me\` — Authenticated user profile
- \`GET /api/v1/users/{username}\` — Public user profile with links and groups
- \`GET /api/v1/links\` — List, create, update, delete links
- \`GET /api/v1/groups\` — List, create, update, delete groups (Pro)
- \`GET /api/v1/analytics\` — Click analytics summary (Pro)
- \`GET /api/v1/openapi.json\` — Full OpenAPI specification
`;

  return new Response(text, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
