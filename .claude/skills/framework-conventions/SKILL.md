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

- Raw method (`create`, `get`, …) returns `APIResponse` so specs can assert status and body.
- Convenience method (`createX`, `getX`) throws on non-2xx and returns typed data — for setup steps.
- Relative paths (no leading `/`). Never set auth headers in a client.
- Every record the client creates is tracked and removed in `cleanup()`, called from fixture teardown.

## Auth and data ownership

- Tests never log in. UI: the `setup` project saves storage state; API: the `apiRequest` fixture carries the token and every client fixture is built on it. `anonymousBookingsApi` is only for 401 cases.
- Each test arranges its own data (through the API when it is not what is being tested), acts on the layer under test, and leaves nothing behind.
- Pick records at runtime from the API (e.g. "first item with enough capacity"); never pin ids.
- Credentials only in `.env`. Never read or print `.env` or `.auth/`.

## Specs

```ts
import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, <area>DataPath } from '../../../config/environment';

const quantity = Number(readJsonValue(<area>DataPath, `${currentEnv}.<key>`));

test.describe('<Story or feature>', () => {
  test('<requirement it proves>', async ({ <fixtures you need> }) => {
    // arrange (API) → act (page/client) → verify (page verify* / status + body)
  });
});
```

- One behaviour per `test()`; request only the fixtures it uses.
- No helper functions, computed values or literals in specs. Data-driven `for` loops over JSON values are fine.
- API: assert the exact status first, then the body. Never accept "any of 4xx".
- Documented behaviour the app breaks → `test.fail(true, '<expected X, actual Y>')`, and record it in `.claude/domain/known-issues.md`.

## Style

Prettier + ESLint (`npm run format`, `npm run lint`). No comments restating code — only *why*. No `waitForTimeout`; no raw timeout numbers.
