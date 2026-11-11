# Skill: Create a New Page Object

## When to Use

A new screen that no existing page object covers. If it belongs to an existing screen (e.g. another section of event details), extend that page object instead.

## Steps

### 1. Map the screen

Use the `explore-with-mcp` skill, then record the locators in `.claude/knowledge/ui-map.md`.

### 2. Create `src/pages/<Name>Page.ts`

```ts
import { type Page, type Locator, expect } from '@playwright/test';
import { CommonPage } from './CommonPage';
import { ROUTES } from '../config/routes';
import { TIMEOUTS } from '../utils/timeouts';

export class NamePage extends CommonPage {
  // ========== SECTION ==========
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);

    // ========== SECTION ==========
    this.heading = page.getByRole('heading', { name: 'Title', level: 1 });
  }

  // ========== NAVIGATION ==========
  async navigate(): Promise<void> {
    await this.navigateTo(ROUTES.something);
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }

  // ========== VERIFICATIONS ==========
  async verifySomething(value: string): Promise<void> {
    await expect(this.heading).toContainText(value);
  }
}
```

- Extend `CommonPage` for signed-in screens (header nav, user email); `BasePage` for signed-out ones (`LoginPage`).
- Locators: role → `getByTestId` → XPath/CSS. Scope to a parent when text repeats.
- Computation that an assertion needs (totals, labels) lives in the page method, not the spec.

### 3. Register

`src/factories/PageFactory.ts`: private field + `getNamePage()`.
`src/core/baseTest.ts`: add to `Fixtures` type and `namePage: async ({ pages }, use) => { await use(pages.getNamePage()); }`.

### 4. Routes and texts

New URL → `src/config/routes.ts`. New expected text → `src/config/assertions.ts`.

## Rules

- Never model destructive shared-account actions ("Clear all bookings").
- No static waits; `waitFor` before interaction.
- Update `CLAUDE.md` (structure), `.claude/agents/playwright.md` and `ui-map.md`.
