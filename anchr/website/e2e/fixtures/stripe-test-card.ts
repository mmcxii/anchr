import type { Locator, Page } from "@playwright/test";

/**
 * Fills out the Stripe-hosted checkout page with Stripe's standard success
 * test card (4242 4242 4242 4242) and submits the form.
 *
 * Stripe's Checkout DOM changes occasionally — this helper is intentionally
 * defensive:
 *
 *   • Prefers role/label locators over CSS classes (stable across visual
 *     refreshes) and lists multiple candidates per field so a single
 *     selector change doesn't break the helper.
 *   • For each card field the helper first tries the top-level page, then
 *     every cross-origin frame attached to it. Stripe Elements historically
 *     embeds card inputs inside a frame from `js.stripe.com`; the current
 *     hosted checkout (2024+) may render them at the top level or inside
 *     a Payment Element iframe.
 *   • Optional fields (email, name) return silently if absent so the
 *     helper doesn't fail when the Checkout session pre-populated them.
 *   • On failure: captures a DOM snapshot listing every iframe, input, and
 *     `data-elements-stable-field-name` attribute on the page so the next
 *     CI run tells us exactly what selectors to add.
 *
 * If Stripe ships a layout change: the fix is usually a new selector in
 * the candidates block for the affected field, guided by the snapshot.
 */

const TEST_CARD_NUMBER = "4242424242424242";
const TEST_EXPIRY_MMYY = "12 / 34";
const TEST_CVC = "123";
const PER_CANDIDATE_TIMEOUT_MS = 3_000;

/**
 * The subset of Page/Frame that exposes Playwright's locator API.
 */
type LocatorRoot = Pick<Page, "getByLabel" | "getByPlaceholder" | "getByRole" | "locator">;

export type StripeCheckoutFormValues = {
  cardCvc?: string;
  cardExpiry?: string;
  cardNumber?: string;
  email?: string;
  name?: string;
};

export async function fillStripeTestCard(page: Page, values: StripeCheckoutFormValues = {}): Promise<void> {
  const cardNumber = values.cardNumber ?? TEST_CARD_NUMBER;
  const cardExpiry = values.cardExpiry ?? TEST_EXPIRY_MMYY;
  const cardCvc = values.cardCvc ?? TEST_CVC;

  // Wait for Stripe to finish loading its UI — the payment form may not
  // be immediately present after the URL change.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);

  if (values.email != null) {
    await fillOptional(page, values.email, emailCandidates);
  }

  await fillRequired(page, cardNumber, cardNumberCandidates, "card number");
  await fillRequired(page, cardExpiry, cardExpiryCandidates, "card expiry");
  await fillRequired(page, cardCvc, cvcCandidates, "card cvc");

  if (values.name != null) {
    await fillOptional(page, values.name, nameCandidates);
  }

  await clickSubmit(page);
}

// ─── Candidate builders ──────────────────────────────────────────────────────
//
// Each function returns an array of Locators to try, in preference order.
// Locators include:
//   • getByLabel    — matches visible <label> text
//   • getByPlaceholder — matches placeholder attribute
//   • locator()     — explicit CSS/attribute selectors
//   • data-elements-stable-field-name — Stripe Elements' documented
//     stable attribute for testing (https://docs.stripe.com/testing)

function emailCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/email/i),
    root.getByPlaceholder(/email/i),
    root.locator("input#email"),
    root.locator('input[name="email"]'),
    root.locator('input[autocomplete="email"]'),
  ];
}

function cardNumberCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/card number/i),
    root.getByPlaceholder(/1234 1234|card number/i),
    root.locator('[data-elements-stable-field-name="cardNumber"] input'),
    root.locator('[data-elements-stable-field-name="cardNumber"]'),
    root.locator("input#cardNumber"),
    root.locator('input[name="cardNumber"]'),
    root.locator('input[name="cardnumber"]'),
    root.locator('input[name="number"]'),
    root.locator('input[autocomplete="cc-number"]'),
    root.locator('input[data-testid="card-number-input"]'),
  ];
}

function cardExpiryCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/expiration|expiry|mm ?\/ ?yy/i),
    root.getByPlaceholder(/mm ?\/ ?yy/i),
    root.locator('[data-elements-stable-field-name="cardExpiry"] input'),
    root.locator('[data-elements-stable-field-name="cardExpiry"]'),
    root.locator("input#cardExpiry"),
    root.locator('input[name="cardExpiry"]'),
    root.locator('input[name="exp-date"]'),
    root.locator('input[name="expiry"]'),
    root.locator('input[autocomplete="cc-exp"]'),
  ];
}

function cvcCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/cvc|cvv|security code/i),
    root.getByPlaceholder(/cvc|cvv/i),
    root.locator('[data-elements-stable-field-name="cardCvc"] input'),
    root.locator('[data-elements-stable-field-name="cardCvc"]'),
    root.locator("input#cardCvc"),
    root.locator('input[name="cardCvc"]'),
    root.locator('input[name="cvc"]'),
    root.locator('input[autocomplete="cc-csc"]'),
  ];
}

function nameCandidates(root: LocatorRoot): Locator[] {
  return [
    root.getByLabel(/name on card|cardholder name/i),
    root.locator("input#billingName"),
    root.locator('input[name="billingName"]'),
    root.locator('input[autocomplete="cc-name"]'),
    root.locator('input[autocomplete="name"]'),
  ];
}

// ─── Fill strategies ─────────────────────────────────────────────────────────

async function fillRequired(
  page: Page,
  value: string,
  candidatesFor: (root: LocatorRoot) => Locator[],
  fieldLabel: string,
): Promise<void> {
  if (await tryFill(page, value, candidatesFor(page))) {
    return;
  }

  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) {
      continue;
    }
    if (await tryFill(page, value, candidatesFor(frame))) {
      return;
    }
  }

  // Capture a diagnostic snapshot so the next CI run shows what selectors
  // ARE available on the page, making the fix a targeted one-line tweak.
  const snapshot = await capturePageSnapshot(page);
  throw new Error(
    [
      `[fillStripeTestCard] could not find the ${fieldLabel} input on the hosted checkout page`,
      ``,
      `--- DOM snapshot for selector debugging ---`,
      snapshot,
    ].join("\n"),
  );
}

async function fillOptional(page: Page, value: string, candidatesFor: (root: LocatorRoot) => Locator[]): Promise<void> {
  if (await tryFill(page, value, candidatesFor(page))) {
    return;
  }
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) {
      continue;
    }
    if (await tryFill(page, value, candidatesFor(frame))) {
      return;
    }
  }
}

async function tryFill(_page: Page, value: string, candidates: Locator[]): Promise<boolean> {
  for (const candidate of candidates) {
    try {
      if ((await candidate.count()) > 0) {
        await candidate.first().fill(value, { timeout: PER_CANDIDATE_TIMEOUT_MS });
        return true;
      }
    } catch {
      // Element might have detached between count() and fill() — try next candidate.
      continue;
    }
  }
  return false;
}

async function clickSubmit(page: Page): Promise<void> {
  const submit = page.getByTestId("hosted-payment-submit-button");
  if ((await submit.count()) > 0) {
    await submit.click();
    return;
  }
  await page.getByRole("button", { name: /^(subscribe|pay|start trial|complete)/i }).click();
}

// ─── Diagnostics ─────────────────────────────────────────────────────────────

/**
 * Capture a compact snapshot of the page's frames, inputs, and Stripe
 * Elements stable attributes so a failing test tells us exactly what
 * selectors to add instead of requiring a manual browser session.
 */
async function capturePageSnapshot(page: Page): Promise<string> {
  const lines: string[] = [];
  lines.push(`URL: ${page.url()}`);
  lines.push(`Frames (${page.frames().length}):`);

  for (const frame of page.frames()) {
    const name = frame.name() || "(main)";
    const url = frame.url();
    lines.push(`  frame: name="${name}" url="${url.slice(0, 120)}"`);

    try {
      // List all inputs with their identifying attributes.
      const inputs = await frame.locator("input, [data-elements-stable-field-name]").all();
      for (const input of inputs.slice(0, 30)) {
        const tag = await input.evaluate((el) => el.tagName.toLowerCase()).catch(() => "?");
        const attrs = await input
          .evaluate((el) => {
            const a: Record<string, string> = {};
            for (const attr of [
              "id",
              "name",
              "type",
              "placeholder",
              "autocomplete",
              "data-elements-stable-field-name",
              "aria-label",
              "data-testid",
            ]) {
              const v = el.getAttribute(attr);
              if (v != null && v !== "") {
                a[attr] = v;
              }
            }
            return a;
          })
          .catch(() => ({}));
        if (Object.keys(attrs).length > 0) {
          lines.push(`    <${tag}> ${JSON.stringify(attrs)}`);
        }
      }
    } catch {
      lines.push(`    (frame not accessible)`);
    }
  }

  return lines.join("\n");
}
