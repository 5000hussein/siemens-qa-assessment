---
name: framework-conventions
description: Repo structure and coding conventions for this Playwright + TypeScript framework - where files go, page objects, API clients, fixtures, auth, test data, cleanup and spec layout.
user-invocable: false
---

# Skill: Framework Conventions

## Where things go

| What | Path |
|---|---|
| Page objects | `src/pages/<Name>Page.ts` (signed-in screens extend `CommonPage`, others `BasePage`) |
| API clients | `src/api/<Name>Api.ts` extending `BaseApi`; types in `src/api/types.ts` |
| Registration | One fixture line in `src/core/fixtures.ts`: `xPage: async ({ page }, use) => { await use(new XPage(page)); }` |
| Test data | `src/data/test_data/<area>.json` keyed by env (`PROD`), read in specs with `readJsonValue` |
| Expected texts / routes | `src/data/assertions.json` / `src/config/routes.ts` |
| Specs | `src/tests/ui/<area>/NNN-<flow>.spec.ts`, `src/tests/api/<resource>/NNN-<behaviour>.spec.ts` |
| Timeouts | `TIMEOUTS` from `src/utils/timeouts.ts` |

`NNN` groups files by theme; it never implies execution order.

## Page objects

- `readonly` locators grouped under `// ========== SECTION ==========`, initialised in the constructor.
- Action methods: `waitFor({ state: 'visible' })` → action → wait for the resulting state.
- `verify*(values…)` methods own every assertion that needs computation or formatting.
- Text used only to **find** an element (a button name, a field label, a section heading used as an anchor) lives in the page object's locator. Text the test **asserts** on (messages, statuses, dialog titles) lives in `assertions.json` and is passed in or imported.
- One class per screen; add to it rather than creating a sibling. Never model destructive shared-account actions.

## API clients

- One class per topic, like the pages. Each method calls **one endpoint and returns the `APIResponse`**: no checks, no unwrapping, no tracking inside the client.
- Specs assert on the response: status first, then `(await response.json())` body.
- Relative paths (no leading `/`). Never set auth headers in a client.

## Auth and data ownership

- Tests never log in. UI: the `setup` project saves storage state; API: the `apiRequest` fixture carries the token and every client fixture is built on it. `anonymousBookingsApi` is only for 401 cases.
- Each test arranges its own data (through the API when it is not what is being tested), acts on the layer under test, and leaves nothing behind.
- Cleanup is the opt-in `bookingCleanup` fixture: request it only in tests that create a booking and call `bookingCleanup.track(id)` as soon as the id is known (UI bookings: look the id up by reference right after the confirmation). Its teardown cancels the booking even when the test failed; never cancel at the end of a test unless cancelling is what it tests.
- Records are chosen by name from test data and looked up through the API (e.g. `GET /events?search=<name>`); never pin ids. Request bodies come from test data JSON (`readJsonObject`).
- Credentials only in `.env`. Never read or print `.env` or `.auth/`.

## Specs

```ts
import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, <area>DataPath } from '../../../config/environment';

const quantity = Number(readJsonValue(<area>DataPath, `${currentEnv}.<key>`));

test.describe('<Story or feature>', () => {
  test('<ACx>: Check the user is able to <action>', async ({ <fixtures you need> }) => {
    // arrange (API) → act (page/client) → verify (page verify* / status + body)
  });
});
```

- Test titles: `Check the user is able to <action>`; negatives: `Check the user is not able to <action> (<status>)`. Prefix the AC when there is one.
- One behaviour per `test()`; request only the fixtures it uses.
- No helper functions, computed values or literals in specs. Data-driven `for` loops over JSON values are fine.
- API: assert the exact status first, then the body. Never accept "any of 4xx".
- Documented behaviour the app breaks → `test.fail(true, '<expected X, actual Y>')`, and record it in `.claude/domain/known-issues.md`.

## Style

Prettier + ESLint (`npm run format`, `npm run lint`). No comments restating code — only *why*. No `waitForTimeout`; no raw timeout numbers.
