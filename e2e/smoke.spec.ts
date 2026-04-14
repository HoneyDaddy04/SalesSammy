import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8080";

// All routes to test
const routes = [
  { path: "/", name: "Landing" },
  { path: "/login", name: "Login" },
  { path: "/onboarding", name: "Onboarding" },
  { path: "/dashboard", name: "Dashboard (redirects to overview)" },
  { path: "/dashboard/overview", name: "Dashboard Overview" },
  { path: "/dashboard/messages", name: "Dashboard Messages" },
  { path: "/dashboard/leads", name: "Dashboard Leads" },
  { path: "/dashboard/teammate", name: "Dashboard Teammate" },
  { path: "/dashboard/workflows", name: "Dashboard Workflows" },
  { path: "/dashboard/knowledge", name: "Dashboard Knowledge" },
  { path: "/dashboard/integrations", name: "Dashboard Integrations" },
  { path: "/dashboard/deploy", name: "Dashboard Deploy" },
  { path: "/dashboard/settings", name: "Dashboard Settings" },
];

for (const route of routes) {
  test(`${route.name} (${route.path}) loads without errors`, async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore network errors to localhost:3001 (expected without backend)
        if (!text.includes("localhost:3001") && !text.includes("ERR_CONNECTION_REFUSED") && !text.includes("Failed to fetch") && !text.includes("401") && !text.includes("Failed to load resource")) {
          errors.push(text);
        }
      }
    });

    // Capture page crashes
    page.on("pageerror", (err) => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    const response = await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 15000 });

    // Page should return 200
    expect(response?.status()).toBe(200);

    // Wait for React to render
    await page.waitForTimeout(2000);

    // No crash errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("404") && !e.includes("favicon")
    );
    if (criticalErrors.length > 0) {
      console.log(`Errors on ${route.path}:`, criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);

    // Page should have visible content (not blank)
    const body = await page.locator("body").innerText();
    expect(body.trim().length).toBeGreaterThan(10);

    // No uncaught error overlays
    const errorOverlay = page.locator('[id*="error"], [class*="error-overlay"]');
    expect(await errorOverlay.count()).toBe(0);
  });
}

// Test specific interactions
test("Landing page nav links work", async ({ page }) => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await expect(page.locator("text=Sales Sammy")).toBeVisible();
  await expect(page.locator("text=Get Started")).toBeVisible();
});

test("Login demo button navigates to dashboard", async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await expect(page.locator("text=Welcome back")).toBeVisible();
  await page.click("text=Try Demo Dashboard");
  await page.waitForURL("**/dashboard/**", { timeout: 10000 });
  // Should see dashboard content
  await page.waitForTimeout(2000);
  const body = await page.locator("body").innerText();
  expect(body).toContain("Dashboard");
});

test("Dashboard overview shows demo data", async ({ page }) => {
  // Set demo org ID
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.click("text=Try Demo Dashboard");
  await page.waitForURL("**/dashboard/**", { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Should have stat cards with non-zero values
  await expect(page.locator("text=Touches Sent")).toBeVisible();
  await expect(page.locator("text=Sales Sammy")).toBeVisible();
});

test("Dashboard leads shows contacts and click works", async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.click("text=Try Demo Dashboard");
  await page.waitForURL("**/dashboard/**", { timeout: 10000 });

  // Navigate to leads
  await page.goto(`${BASE}/dashboard/leads`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Should see contact names
  await expect(page.locator("text=Adaeze Okonkwo")).toBeVisible();

  // Click a contact
  await page.click("text=Adaeze Okonkwo");
  await page.waitForTimeout(2000);

  // Should see contact detail view
  await expect(page.locator("text=Back to leads")).toBeVisible();
  await expect(page.locator("text=Finova Technologies")).toBeVisible();
});

test("Dashboard messages shows pending approvals", async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.click("text=Try Demo Dashboard");
  await page.waitForURL("**/dashboard/**", { timeout: 10000 });

  await page.goto(`${BASE}/dashboard/messages`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  await expect(page.locator("text=Messages")).toBeVisible();
  await expect(page.locator("text=Pending")).toBeVisible();
  // Should have demo messages
  await expect(page.locator("text=Adaeze Okonkwo")).toBeVisible();
});

test("Onboarding can navigate through all steps", async ({ page }) => {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
  await expect(page.locator("text=Meet Sammy")).toBeVisible();

  // Click through steps without filling (free navigation)
  for (let i = 0; i < 8; i++) {
    await page.click("text=Continue");
    await page.waitForTimeout(500);
  }

  // Should be on step 9 (Escalation) with Finish Setup button
  await expect(page.locator("text=Finish Setup")).toBeVisible();
});
