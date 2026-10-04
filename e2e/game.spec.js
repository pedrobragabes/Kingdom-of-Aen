import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import { CARD_COLLECTION } from "../js/data/cards.js";

const ids = CARD_COLLECTION.slice(0, 22).map((card) => card.id);

async function checkAccessibility(page, testInfo, phase) {
  const result = await new AxeBuilder({ page }).analyze();
  const path = testInfo.outputPath(`accessibility-${phase}.json`);
  await writeFile(path, JSON.stringify(result.violations, null, 2));
  await testInfo.attach(`accessibility-${phase}.json`, {
    path,
    contentType: "application/json",
  });
  expect(result.violations).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("builder, mulligan, duas rodadas e reinício funcionam por teclado", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(
    (deck) => {
      if (!localStorage.getItem("kingdomOfAen_playerDeck")) {
        localStorage.setItem("kingdomOfAen_playerDeck", JSON.stringify(deck));
      }
    },
    ids.slice(0, 21),
  );
  await page.goto("/");
  await expect(page.locator("#stat-units")).toHaveText("21");
  await expect(page.locator("#start-game-btn")).toBeDisabled();
  const available = page
    .locator("#collection-grid .builder-card:not(.in-deck)")
    .first();
  await available.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#stat-units")).toHaveText("22");
  await page.reload();
  await expect(page.locator("#stat-units")).toHaveText("22");
  await page.screenshot({
    path: testInfo.outputPath("builder.png"),
    fullPage: true,
    animations: "disabled",
  });
  await checkAccessibility(page, testInfo, "builder");
  await page.locator("#start-game-btn").focus();
  await page.keyboard.press("Enter");
  const mulligan = page.locator("#mulligan-overlay");
  await expect(mulligan).toBeVisible();
  await expect(page.locator("#mulligan-confirm-btn")).toBeFocused();
  await checkAccessibility(page, testInfo, "mulligan");
  await page.keyboard.press("Tab");
  await expect(page.locator("#mulligan-cards")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#mulligan-cards button").first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#mulligan-cards")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#mulligan-confirm-btn")).toBeFocused();
  await page.locator("#mulligan-cards button").first().press("Enter");
  await expect(page.locator("#redraw-count")).toHaveText("1");
  await expect(
    page.locator("#mulligan-cards button.swapped").first(),
  ).toBeVisible();
  await page.locator("#mulligan-cards button").last().press("Space");
  await expect(page.locator("#redraw-count")).toHaveText("0");
  await expect(page.locator("#mulligan-cards button.swapped")).toHaveCount(2);
  await expect(page.locator("#mulligan-cards button:disabled")).toHaveCount(10);
  await expect(
    page.locator("#mulligan-overlay [data-game-feedback]"),
  ).toContainText("0 trocas restantes");
  await checkAccessibility(page, testInfo, "mulligan-swapped");
  await page.locator("#mulligan-confirm-btn").press("Enter");
  await expect(mulligan).toBeHidden();
  await expect(page.locator(".hand-cards .card")).toHaveCount(10);
  await page.screenshot({
    path: testInfo.outputPath("battle.png"),
    fullPage: true,
    animations: "disabled",
  });
  if (testInfo.project.name === "desktop") {
    await expect(page.locator("#pass-button")).toBeInViewport({ ratio: 1 });
  }
  await expect(page.locator("#turn-status")).toContainText("Seu turno");
  await checkAccessibility(page, testInfo, "battle");
  await page.clock.install();
  const handCard = page
    .locator('.hand-cards .card:not([data-agile="true"])')
    .first();
  const row = await handCard.getAttribute("data-type");
  const wrongRow = row === "melee" ? "ranged" : "melee";
  await handCard.press("Enter");
  await page.locator(`.row.player[data-type="${wrongRow}"]`).press("Enter");
  await expect(page.locator("#battle-feedback")).toBeVisible();
  await expect(page.locator("#battle-feedback")).toContainText(
    "deve ser jogada na fileira",
  );
  await expect(handCard).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".hand-cards .card")).toHaveCount(10);
  await checkAccessibility(page, testInfo, "invalid-row");
  await page.locator(`.row.player[data-type="${row}"]`).press("Enter");
  await expect(page.locator(".hand-cards .card")).toHaveCount(9);
  await expect(page.locator(".player-side .cards-container .card")).toHaveCount(
    1,
  );
  await page.clock.runFor(3000);
  await expect(page.locator("#turn-status")).toContainText(
    /Seu turno|O oponente passou/,
  );
  await expect(page.locator("#pass-button")).toBeEnabled();
  await page.locator("#pass-button").press("Enter");
  await page.clock.runFor(35_000);
  await expect(
    page.locator("#player-gems .active, #opponent-gems .active"),
  ).not.toHaveCount(0);
  await expect(page.locator("#pass-button")).toBeEnabled();
  await page.locator("#pass-button").press("Enter");
  await page.clock.runFor(35_000);
  await expect(page.locator("#game-over-modal")).toBeVisible();
  expect(
    await page
      .locator("#player-round-wins, #opponent-round-wins")
      .allTextContents(),
  ).toContain("2");
  await checkAccessibility(page, testInfo, "game-over");
  await page.screenshot({
    path: testInfo.outputPath("game-over.png"),
    fullPage: true,
  });
  await page.locator("#play-again-btn").press("Enter");
  await page.clock.runFor(32);
  await expect(mulligan).toBeVisible();
  await expect(page.locator("#redraw-count")).toHaveText("2");
  await expect(
    page.locator("#player-gems .active, #opponent-gems .active"),
  ).toHaveCount(0);
  await page.locator("#mulligan-confirm-btn").press("Enter");
  for (let round = 0; round < 2; round++) {
    await page.locator("#pass-button").press("Enter");
    await page.clock.runFor(35_000);
  }
  await expect(page.locator("#game-over-modal")).toBeVisible();
  await page.locator("#back-to-builder-btn").press("Enter");
  await expect(page.locator("#scene-builder")).toHaveClass(/active/);
  await expect(page.locator("#stat-units")).toHaveText("22");
  await expect(page.locator("#start-game-btn")).toBeFocused();
  await page.clock.runFor(60_000);
  await expect(page.locator("#game-over-modal")).toBeHidden();
  expect(errors).toEqual([]);
});

test("baralho vazio, coleção esgotada e limpeza têm instruções e estados textuais", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#deck-grid .empty-state")).toContainText(
    "pelo menos 22 unidades",
  );
  await expect(page.locator("#start-game-btn")).toBeDisabled();
  await expect(
    page.locator('#collection-grid [data-card-id="adr14no_1"] .card-name'),
  ).toHaveText("Adriano");
  await checkAccessibility(page, testInfo, "empty-deck");
  await page.evaluate(
    (deck) =>
      localStorage.setItem("kingdomOfAen_playerDeck", JSON.stringify(deck)),
    CARD_COLLECTION.map((card) => card.id),
  );
  await page.reload();
  await expect(page.locator("#collection-grid .in-deck-label")).toHaveCount(
    CARD_COLLECTION.length,
  );
  await expect(
    page.locator("#collection-grid .builder-card").first(),
  ).toHaveAttribute("aria-disabled", "true");
  await page.locator('[data-filter="available"]').click();
  await expect(page.locator('[data-filter="available"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator("#collection-grid .empty-state")).toContainText(
    "Todas as cartas já estão no baralho",
  );
  await checkAccessibility(page, testInfo, "empty-collection");
  await page.locator("#deck-grid .deck-card").first().click();
  await expect(page.locator("#collection-grid .builder-card")).toHaveCount(1);
  await expect(page.locator("#stat-total")).toHaveText(
    String(CARD_COLLECTION.length - 1),
  );
  await page.locator("#clear-deck-btn").click();
  await expect(page.locator("#builder-feedback")).toBeVisible();
  await expect(page.locator("#builder-feedback")).toContainText(
    "confirmar a limpeza do baralho",
  );
  await page.locator("#clear-deck-btn").click();
  await expect(page.locator("#stat-total")).toHaveText("0");
  await expect(page.locator("#collection-grid .builder-card")).toHaveCount(
    CARD_COLLECTION.length,
  );
  await expect(page.locator("#deck-grid .empty-state")).toBeVisible();
  await expect(page.locator("#builder-feedback")).toContainText(
    "Baralho limpo",
  );
  await checkAccessibility(page, testInfo, "cleared-deck");
});

test("layout mantém coleção, deck, controles e overlays acessíveis em retrato e paisagem", async ({
  page,
}, testInfo) => {
  await page.addInitScript(
    (deck) =>
      localStorage.setItem("kingdomOfAen_playerDeck", JSON.stringify(deck)),
    ids,
  );
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.locator("#collection-grid .builder-card").first(),
    ).toBeVisible();
    expect(
      await page.locator("#collection-grid").evaluate((el) => el.clientWidth),
    ).toBeGreaterThan(200);
    expect(
      await page.locator("#collection-grid").evaluate((grid) => {
        const cards = [...grid.children].map((card) =>
          card.getBoundingClientRect(),
        );
        const first = cards[0];
        const nextRow = cards.find((card) => card.top > first.top + 20);
        return nextRow.top >= first.bottom;
      }),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator("#start-game-btn").click();
    await expect(page.locator("#mulligan-confirm-btn")).toBeInViewport();
    await page.locator("#mulligan-confirm-btn").click();
    await expect(page.locator(".hand-cards .card")).toHaveCount(10);
    await page.locator("#pass-button").scrollIntoViewIfNeeded();
    await expect(page.locator("#pass-button")).toBeInViewport();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`battle-${viewport.width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    expect(
      await page.locator(".hand-cards").evaluate((hand) => {
        const bounds = hand.getBoundingClientRect();
        const card = hand.firstElementChild.getBoundingClientRect();
        return card.top >= bounds.top && card.bottom <= bounds.bottom;
      }),
    ).toBe(true);
  }
});

test("servidor de testes expõe apenas arquivos do jogo", async ({
  request,
}) => {
  expect((await request.get("/.git/config")).status()).toBe(404);
  expect((await request.get("/package.json")).status()).toBe(404);
  expect((await request.get("/js/../.git/config")).status()).toBe(404);
  expect((await request.post("/index.html")).status()).toBe(405);
});
