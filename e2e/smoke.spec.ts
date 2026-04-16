import { test, expect } from "@playwright/test";

const BASE = "http://localhost:8080";

// Helper: go to dashboard with demo org set, dismiss tour
async function gotoDashboard(page: any, path = "/dashboard") {
  // Set demo org and dismiss tour before navigating
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.evaluate(() => {
    localStorage.setItem("vaigence_org_id", "demo-org-00000000");
    localStorage.setItem("vaigence_tour_done", "true");
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(2000);
}

// All routes to test
const routes = [
  { path: "/", name: "Landing" },
  { path: "/login", name: "Login" },
  { path: "/onboarding", name: "Onboarding" },
  { path: "/dashboard", name: "Dashboard (redirects to overview)" },
  { path: "/dashboard/overview", name: "Dashboard Overview" },
  { path: "/dashboard/messages", name: "Dashboard Messages" },
  { path: "/dashboard/chat", name: "Dashboard Chat" },
  { path: "/dashboard/leads", name: "Dashboard Leads" },
  { path: "/dashboard/teammate", name: "Dashboard Teammate" },
  { path: "/dashboard/workflows", name: "Dashboard Workflows" },
  { path: "/dashboard/knowledge", name: "Dashboard Knowledge" },
  { path: "/dashboard/integrations", name: "Dashboard Integrations" },
  { path: "/dashboard/deploy", name: "Dashboard Deploy" },
  { path: "/dashboard/settings", name: "Dashboard Settings" },
  { path: "/dashboard/admin", name: "Dashboard Admin" },
];

for (const route of routes) {
  test(`${route.name} (${route.path}) loads without errors`, async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (!text.includes("localhost:3001") && !text.includes("ERR_CONNECTION_REFUSED") && !text.includes("Failed to fetch") && !text.includes("401") && !text.includes("Failed to load resource")) {
          errors.push(text);
        }
      }
    });

    page.on("pageerror", (err) => {
      errors.push(`PAGE ERROR: ${err.message}`);
    });

    // Dismiss tour for dashboard routes
    if (route.path.startsWith("/dashboard")) {
      await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.evaluate(() => {
        localStorage.setItem("vaigence_org_id", "demo-org-00000000");
        localStorage.setItem("vaigence_tour_done", "true");
      });
    }

    const response = await page.goto(`${BASE}${route.path}`, { waitUntil: "networkidle", timeout: 15000 });
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes("404") && !e.includes("favicon")
    );
    if (criticalErrors.length > 0) {
      console.log(`Errors on ${route.path}:`, criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);

    const body = await page.locator("body").innerText();
    expect(body.trim().length).toBeGreaterThan(10);

    const errorOverlay = page.locator('[id*="error"], [class*="error-overlay"]');
    expect(await errorOverlay.count()).toBe(0);
  });
}

// ── Feature tests ──

test("Landing page nav links work", async ({ page }) => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await expect(page.getByRole("navigation").getByText("Sales Sammy")).toBeVisible();
  await expect(page.locator("text=Get Started").first()).toBeVisible();
});

test("Dashboard sidebar has Talk to Sammy nav item", async ({ page }) => {
  await gotoDashboard(page);
  await expect(page.locator("text=Talk to Sammy").first()).toBeVisible();
});

test("Dashboard sidebar has dark mode toggle", async ({ page }) => {
  await gotoDashboard(page);
  const toggle = page.locator("text=Dark").first().or(page.locator("text=Light").first());
  await expect(toggle).toBeVisible();
});

test("Dashboard chat page shows suggestions", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/chat");
  await expect(page.locator("text=What would you like to adjust?")).toBeVisible();
  await expect(page.locator('[placeholder="Tell Sammy what to change..."]')).toBeVisible();
});

test("Dashboard messages has split-panel layout", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/messages");
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  await expect(page.locator("text=Pending").first()).toBeVisible();
  await expect(page.locator("text=Select a message")).toBeVisible();
});

test("Dashboard teammate has Edit Profile button", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/teammate");
  await expect(page.locator("text=Edit Profile")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sales Sammy" })).toBeVisible();
});

test("Dashboard teammate edit mode works", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/teammate");

  // Find and click the Edit Profile button
  const editBtn = page.locator("button", { hasText: "Edit Profile" });
  await expect(editBtn).toBeVisible();
  await editBtn.click();
  await page.waitForTimeout(1000);

  // Should show edit mode UI
  await expect(page.locator("text=Editing Sammy").first()).toBeVisible({ timeout: 5000 });

  // Cancel should exit edit mode
  const cancelBtn = page.locator("button", { hasText: "Cancel" }).first();
  await cancelBtn.click();
  await page.waitForTimeout(500);
  await expect(editBtn).toBeVisible();
});

test("Dashboard admin page loads", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/admin");
  await expect(page.getByRole("heading", { name: "Admin Panel" })).toBeVisible();
});

test("Dashboard knowledge page has rich text editor", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/knowledge");
  await expect(page.getByRole("heading", { name: "Knowledge Base" })).toBeVisible();
  await page.click("text=Add Knowledge");
  await page.waitForTimeout(500);
  await expect(page.locator('[title="Bold"]').first()).toBeVisible();
});

test("Dashboard overview shows demo data", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/overview");
  await expect(page.locator("text=Touches Sent")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sales Sammy" })).toBeVisible();
});

test("Dashboard leads shows contacts", async ({ page }) => {
  await gotoDashboard(page, "/dashboard/leads");
  await expect(page.locator("text=Adaeze Okonkwo")).toBeVisible();
});

test("Onboarding has knowledge intake step", async ({ page }) => {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
  await expect(page.locator("text=Meet Sammy")).toBeVisible();

  // Step 1 (business), step 2 (knowledge)
  await page.click("text=Continue");
  await page.waitForTimeout(500);
  await page.click("text=Continue");
  await page.waitForTimeout(500);

  await expect(page.locator("text=Help Sammy learn your business")).toBeVisible();
  await expect(page.locator("text=Website or page URLs")).toBeVisible();
});

test("Onboarding can navigate through all steps", async ({ page }) => {
  await page.goto(`${BASE}/onboarding`, { waitUntil: "networkidle" });
  await expect(page.locator("text=Meet Sammy")).toBeVisible();

  for (let i = 0; i < 9; i++) {
    await page.click("text=Continue");
    await page.waitForTimeout(500);
  }

  await expect(page.locator("text=Finish Setup")).toBeVisible();
});
