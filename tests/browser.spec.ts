import { test, expect } from "@playwright/test";
import { generateStorefrontHtml, generateStoreAppJs } from "../scripts/generate-storefront";

test.beforeEach(async ({ page }) => {
  // Remove remote assets so tests cannot pass or fail depending on third-party CDNs.
  const html = generateStorefrontHtml("Browser Test Store")
    .replace(/<script\b[^>]*\bsrc="[^"]*"[^>]*><\/script>/g, "")
    .replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, "");
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  await page.addScriptTag({ content: generateStoreAppJs() });
});

test("cart drawer opens with dialog semantics, focus and close restoration", async ({ page }) => {
  const open = page.locator("#cartOpenBtn");
  const drawer = page.locator("#cartDrawer");
  await open.click();
  await expect(drawer).toHaveClass(/(?:^|\s)is-open(?:\s|$)/);
  await expect(drawer).toHaveAttribute("aria-hidden", "false");
  await expect(drawer).toHaveAttribute("aria-modal", "true");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(page.locator("#cartCloseBtn")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).not.toHaveClass(/(?:^|\s)is-open(?:\s|$)/);
  await expect(open).toBeFocused();
});

test("cart tab key wraps focus inside the active drawer", async ({ page }) => {
  await page.locator("#cartOpenBtn").click();
  const first = page.locator("#cartCloseBtn");
  await expect(first).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#cartDrawer button").last()).toBeFocused();
});

test("hotspot selection updates accessible pressed state", async ({ page }) => {
  const pins = page.locator("[data-hotspot]");
  await pins.first().click();
  await expect(pins.first()).toHaveAttribute("aria-pressed", "true");
  await expect(pins.last()).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#hotspotStatus")).toContainText("coat");
});

test("lookbook custom element initializes without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", err => errors.push(err.message));
  await page.locator("lookbook-carousel").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const isRegistered = await page.evaluate(() => Boolean(customElements.get("lookbook-carousel")));
  expect(isRegistered).toBe(true);
  expect(errors).toEqual([]);
});
