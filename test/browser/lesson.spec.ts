import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page, request }) => {
  await request.post("/api/reset-demo", { data: { mode: "demo" } });
  await page.goto("/");
});
async function walk(page: import("@playwright/test").Page) {
  await page.locator("#walkthrough").click();
  await expect(page.locator("#status")).toContainText("Walkthrough complete");
}
test("guided memory revision shows current and historical formatted text", async ({
  page,
}) => {
  await walk(page);
  await expect(page.locator("#memory-count")).toContainText("1 current");
  await expect(page.locator("#version-count")).toContainText("2 versions");
  await expect(page.locator("#memory-rendered")).toContainText(
    "troubleshooting",
  );
  await expect(page.locator("#version-rendered")).not.toContainText(
    "troubleshooting",
  );
  await expect(page.locator("#memory-details code.hljs")).toBeVisible();
  await expect(page.locator("#runtime-preview")).toContainText("read_only");
  await expect(page.locator("#timeline")).not.toContainText(
    "Use ISO 8601 dates",
  );
});
test("peer edit triggers conflict, retrieval and reviewed retry", async ({
  page,
}) => {
  await walk(page);
  await page.locator("#peer-update").click();
  await expect(page.locator("#status")).toContainText("Peer edit simulated");
  await page
    .locator("#memory-content")
    .fill("Reviewed course convention: add a worked example.");
  await page.locator("#update-memory").click();
  await expect(page.locator("#status")).toContainText("Conflict");
  await expect(page.locator("#memory-content")).toHaveValue(
    "Reviewed course convention: add a worked example.",
  );
  await page.locator("#retrieve-memory").click();
  await expect(page.locator("#memory-content")).toHaveValue(/Peer reviewer/);
  await page
    .locator("#memory-content")
    .fill("Reviewed course convention: add a worked example.");
  await page.locator("#update-memory").click();
  await expect(page.locator("#status")).toContainText("Guarded update applied");
  await expect(page.locator("#memory-rendered")).toContainText(
    "Reviewed course convention",
  );
});
test("redaction, retained deleted lineage and one-way store retirement", async ({
  page,
}) => {
  await walk(page);
  const version = await page.locator("#version-select").inputValue(),
    store = await page.locator("#store-select").inputValue(),
    memory = await page.locator("#memory-select").inputValue();
  await page.locator(".archive-panel summary").click();
  await page.locator("#redact-confirm").fill(`REDACT ${version}`);
  await page.locator("#redact-version").click();
  await expect(page.locator("#version-rendered")).toContainText(
    "Historical content redacted",
  );
  await page.locator("#delete-memory-confirm").fill(`DELETE ${memory}`);
  await page.locator("#delete-memory").click();
  await expect(page.locator("#memory-count")).toContainText("0 current");
  await expect(page.locator("#version-count")).toContainText("3 versions");
  await page.locator("#archive-store-confirm").fill(`ARCHIVE ${store}`);
  await page.locator("#archive-store").click();
  await expect(page.locator("#store-state")).toContainText("archived");
  await expect(page.locator("#create-memory")).toBeDisabled();
  await page.locator("#delete-store-confirm").fill(`DELETE ${store}`);
  await page.locator("#delete-store").click();
  await expect(page.locator("#store-state")).toContainText("No store");
});
test("second store is isolated and all 19 cards have colored code", async ({
  page,
}) => {
  await walk(page);
  const first = await page.locator("#store-select").inputValue();
  await page.locator("#store-name").fill("Other course");
  await page.locator("#create-store").click();
  await expect(page.locator("#memory-count")).toContainText("0 current");
  await page.locator("#store-select").selectOption(first);
  await expect(page.locator("#status")).toContainText("Store and current");
  await page.locator("#memory-select").selectOption({ index: 1 });
  await expect(page.locator("#memory-rendered")).toContainText(
    "troubleshooting",
  );
  await page.locator("#tab-map").click();
  const details = page.locator("#panel-map details");
  await expect(details).toHaveCount(19);
  await details.evaluateAll((nodes) =>
    nodes.forEach((n) => ((n as HTMLDetailsElement).open = true)),
  );
  await expect(page.locator("#panel-map pre code.hljs")).toHaveCount(19);
  expect(
    await page.locator("#panel-map .hljs-keyword").count(),
  ).toBeGreaterThan(10);
});
test("eight UML steps, quiz feedback, keyboard tabs and larger text", async ({
  page,
}) => {
  await page.locator("#tab-how").click();
  await expect(page.locator("#workflow-guide svg")).toHaveCount(2);
  await page.locator(".uml-activity summary").click();
  const steps = page.locator(".workflow-step-buttons button");
  await expect(steps).toHaveCount(8);
  await steps.nth(6).click();
  await expect(page.locator(".workflow-step-detail")).toContainText(
    "Redact historical text",
  );
  await page.locator("#tab-how").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#tab-quiz")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#quiz fieldset")).toHaveCount(6);
  await page.locator("#quiz fieldset").first().locator("input").nth(1).check();
  await expect(page.locator("#score")).toContainText("1 / 6");
  await page.locator("#larger").click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBeTruthy();
});
