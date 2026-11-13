# EventHub QA Automation

UI and API test automation for **EventHub**, built with **Playwright + TypeScript**.

**EventHub** is a ticket-booking platform. A signed-in user browses events (conferences, concerts, sports, workshops, festivals), books 1–10 tickets by entering their name, email and phone, gets a booking reference, sees the booking under **My Bookings**, and can cancel it. Everything the web UI does is also available through a REST API.

| | |
|---|---|
| Web app | https://eventhub.rahulshettyacademy.com |
| API docs (Swagger) | https://api.eventhub.rahulshettyacademy.com/api/docs |
| **Story review, PO questions, coverage per AC** | **[docs/story-review.md](docs/story-review.md)** |

Each account is its own sandbox: its own events and bookings. The environment is public and shared, so every test cleans up what it creates.

---

## 1. Quick start

**Prerequisites:** Node.js 20+ and an EventHub account (register at `/register`). The account used for this submission is shared through the submission form, never in the repository.

```bash
npm ci
npx playwright install chromium
cp .env.example .env          # set EVENTHUB_USER_EMAIL and EVENTHUB_USER_PASSWORD
npm test                      # setup + UI + API: 25 tests, about 45 s
```

| Command | What it does |
|---|---|
| `npm run test:ui` | UI tests (the `setup` project signs in first) |
| `npm run test:api` | API tests only, no browser |
| `npx playwright test <file>` | One spec file |
| `npm run test:debug` | Step through a test in the Playwright Inspector |
| `npm run test:report` | Open the HTML report (screenshot, video and trace for each failure) |
| `HEADLESS=true npm test` | Hide the browser locally (visible by default, always hidden in CI) |
| `SLOW_MO=500 npm run test:ui` | Slow every action by 500 ms to watch the run |
| `npm run typecheck && npm run lint && npm run format:check` | Static checks |
| `npm run api:spec` | Re-download the API spec into `.claude/domain/openapi.json` |

---

## 2. Repo layout

```
src/
  core/      BasePage.ts (parent of all pages) · fixtures.ts (every fixture: auth, pages, API clients, cleanup)
  pages/     CommonPage → EventsPage, EventDetailsPage, MyBookingsPage, BookingDetailsPage · LoginPage
  api/       BaseApi → AuthApi, EventsApi, BookingsApi · types.ts
  config/    environment.ts (env, paths, credentials) · routes.ts
  data/      environments.json · assertions.json (expected texts) · test_data/*.json · builders/
  utils/     jsonHelper.ts · timeouts.ts · format.ts
  tests/     setup/ (sign-in) · ui/<area>/ · api/<resource>/
docs/        story-review.md
.claude/     AI tooling: /automate command, agents, skills, domain knowledge (section 6)
```

---

## 3. How the framework works

### Authorization is handled by the framework, not by tests

No test contains a login step.

- **UI:** the `setup` project signs in **once** through the real login page and saves the browser state (the token in `localStorage`) to `.auth/user.json`. The `ui` project depends on `setup` and loads that file, so every UI test starts signed in.
- **API:** a **worker fixture** (`apiToken`) calls `POST /auth/login` once. The `apiRequest` fixture adds `Authorization: Bearer <token>` to every request, and every API client is built on it. `anonymousBookingsApi` has no token and is used only for 401 checks.

If sign-in changes, one file changes.

### Fixtures

A fixture is an object Playwright creates for a test. The test names what it needs and gets it ready to use:

```ts
test('AC4: a booking can be cancelled', async ({ eventsApi, bookingsApi, myBookingsPage }) => { ... });
```

Each fixture is a small recipe in `src/core/fixtures.ts`:

```ts
bookingsApi: async ({ apiRequest }, use) => {
  const bookingsApi = new BookingsApi(apiRequest); // setup: before the test
  await use(bookingsApi);                          // the test runs here
  await bookingsApi.cleanup();                     // teardown: after the test, even if it failed
},
```

| | Test fixture (default) | Worker fixture (`{ scope: 'worker' }`) |
|---|---|---|
| Created | before **each** test | **once** per worker |
| Shared between tests | no | yes |
| Used for | pages, API clients, cleanup: anything that must start clean | `apiToken`: expensive to get, read-only, safe to share |

### Page objects

`BasePage` holds the browser tab and small helpers (`navigateTo`, `click`, `typeText`). `CommonPage` adds the header shared by every signed-in screen. Each screen has one class that holds its **locators** (how to find elements) and **actions and checks** (`openEvent`, `cancelBooking`, `verifyPaymentSummary`). Specs never use raw locators; they call page methods.

### API clients and cleanup

`BookingsApi`, `EventsApi` and `AuthApi` wrap the endpoints. Each has two kinds of method:
- **raw methods** (`create`, `get`, `cancel`) return the HTTP response, so tests can check status and body
- **convenience methods** (`createBooking`, `getEvent`) throw on errors and return typed data, for setup steps

`BookingsApi` records every booking it creates, and its fixture cancels them after the test. Bookings made through the UI are registered with `trackByRef(ref)`.

### Test data and expected texts

- Inputs live in `src/data/test_data/*.json`, keyed by environment (`PROD`), and are read with `readJsonValue` / `readJsonObject`. Request bodies come from `buildBookingInput()`.
- Expected texts (messages, dialog titles, statuses, patterns) live in `src/data/assertions.json` and are imported directly.
- Events are **picked at runtime** (`findBookableEvent(minSeats)`) because ids differ per account and seats change.

### Waiting and timeouts

Every browser or HTTP action is asynchronous, so each step is `await`ed. A lint rule catches any missing `await`. Playwright **auto-waits** before every click or fill, and `expect(...)` retries until it passes, so there are no fixed sleeps.

| Limit | Value | Applies to |
|---|---|---|
| `timeout` | 60 s | a whole test (the longest takes about 7 s) |
| `expect.timeout` | 10 s | each single assertion |
| `TIMEOUTS.short / medium / long` | 5 / 15 / 30 s | individual waits inside page objects |

### Known defects are tests

When the app contradicts its documentation, the documented behaviour is still asserted, inside `test.fail(true, '<expected X, actual Y>')`. The run stays green while the defect exists and turns red the day it is fixed, which is the signal to remove the marker. See `src/tests/api/bookings/004-contract-vs-docs.spec.ts`.

### One worker, on purpose

All tests share one account and a few events. Seat-count checks would race if tests ran in parallel. The tests are already independent, so going parallel only needs one account per worker.

---

## 4. Repo rules and conventions

### Rules

1. **Tests never log in.** Auth comes from the framework.
2. **No literals in specs.** Data from `src/data/**/*.json`, expected texts from `assertions.json`, routes from `routes.ts`, timeouts from `TIMEOUTS`.
3. **Specs have no helper functions or computed values.** Computation lives in page `verify*` methods; payloads come from builders.
4. **Every test owns its data:** it creates what it needs, never pins ids, and leaves nothing behind. Never use "Clear all bookings".
5. **Locator priority:** role and name → test id → label or text → `#id` → XPath. Each locator matches exactly one element, scoped to a parent when text repeats.
6. **No static waits** (`waitForTimeout` fails lint).
7. **Never weaken an assertion** to make a run pass. A real mismatch becomes `test.fail` plus a note in the story review.
8. **Never commit secrets.** `.env` and `.auth/` are git-ignored.
9. **Green before commit:** typecheck, lint, format check, and the affected tests pass.

### Naming

| Style | Used for | Examples |
|---|---|---|
| **PascalCase** | classes and types | `LoginPage`, `BookingsApi`, `EventItem`, `Fixtures` |
| **camelCase** | variables, functions, methods, fixtures, JSON keys | `loginPage`, `bookingsApi`, `verifySignedInAs()`, `successMessages` |
| **UPPER_CASE** | shared constants | `ROUTES`, `TIMEOUTS` |
| File named after its class (PascalCase) | one class per file | `LoginPage.ts`, `BookingsApi.ts` |
| camelCase file | helpers, config, data, fixtures (no class) | `fixtures.ts`, `jsonHelper.ts`, `assertions.json` |
| kebab-case `NNN-<what>.spec.ts` | test files (`NNN` groups by theme, not run order) | `001-book-tickets.spec.ts` |

The class `LoginPage` is the blueprint; the fixture `loginPage` is the object built from it (`new LoginPage(page)`).

### Adding something

| To add | Do this |
|---|---|
| A screen | Create `src/pages/XPage.ts` extending `CommonPage` (or `BasePage` if signed-out), then add one fixture line in `fixtures.ts`: `xPage: async ({ page }, use) => { await use(new XPage(page)); }` |
| An endpoint | Add methods to the matching client in `src/api/`, or a new `XApi extends BaseApi` plus one fixture line |
| A test | Put data in JSON and texts in `assertions.json`, then write `src/tests/ui/<area>/NNN-<flow>.spec.ts` or `src/tests/api/<resource>/NNN-<behaviour>.spec.ts` |

---

## 5. Configuration explained

### `playwright.config.ts`

| Key | Value | Why |
|---|---|---|
| `testDir` | `./src/tests` | Where tests live |
| `timeout` / `expect.timeout` | 60 s / 10 s | Per test / per assertion (section 3) |
| `fullyParallel`, `workers` | `false`, `1` | One test at a time (section 3) |
| `forbidOnly` | `true` in CI | A forgotten `test.only` fails the CI run instead of silently skipping the rest |
| `retries` | 1 in CI, 0 locally | Absorbs network blips on a public environment; the report still marks the test "flaky" |
| `reporter` | `list` + `html` | One line per test in the terminal, plus a full HTML report |
| `use.baseURL` | from `environments.json` | Pages navigate with short paths (`/bookings`) |
| `use.trace / screenshot / video` | kept on failure only | Evidence for failures; fast passing runs |
| `use.headless`, `slowMo` | `HEADLESS`, `SLOW_MO` | Visible browser locally, hidden in CI |
| `projects` | `setup` → `ui`, and `api` | `setup` signs in once; `ui` depends on it and loads the saved login; `api` needs no browser |

### `tsconfig.json`

Used only for checking (`npm run typecheck`); Playwright runs TypeScript directly, with no build step.

| Key | Why |
|---|---|
| `strict: true` | Full type safety: null handling, no hidden `any` |
| `target` / `lib` | Modern JavaScript (ES2020) plus browser types (`dom`) for code that runs in the page |
| `module` / `moduleResolution` | Node-style modules and imports |
| `esModuleInterop` | Plain `import x from 'pkg'` works for every package |
| `resolveJsonModule` | Lets `assertions.json` be imported with types |
| `skipLibCheck` | Doesn't type-check `node_modules` (faster) |
| `forceConsistentCasingInFileNames` | Import case must match the file name, which Linux CI requires |
| `include: src/**/*` | Only framework code is checked |

### Other files

| File | Purpose |
|---|---|
| `eslint.config.mjs` | TypeScript rules plus Playwright rules: no missing `await`, no `waitForTimeout`, no `test.only`, no `page.pause()` |
| `.prettierrc.json` | Formatting: single quotes, 140-character lines |
| `package.json` | Scripts (section 1) and dev dependencies; Node 20+ |
| `.env.example` | Template for `.env`: only the two credentials |
| `.gitignore` | Keeps secrets (`.env`, `.auth/`) and generated output out of git |
| `.mcp.json` | AI tooling only (section 6); the test suite doesn't use it |

---

## 6. AI tooling

The repo ships a small Claude Code setup. The test suite runs without it.

- **`CLAUDE.md`**: always-on rules for any AI agent working in the repo.
- **`/automate <requirement or flow>`** turns a requirement into a verified test:
  1. A questionnaire asks web or API, the coverage and the target file.
  2. `explorer` maps the live page through the Playwright MCP, or makes live API calls.
  3. `test-writer` writes the code.
  4. `verifier` runs the static checks, step coverage, conventions and a live run, with at most 2 fix cycles.
  5. A PR is opened only after approval and a passing live run.
- **`/test-fix <spec>`** finds the root cause of a failing test and fixes it without weakening the assertion.
- **`.claude/skills/`** hold the conventions every agent loads. **`.claude/domain/`** holds facts about the app (screen map, API notes, the OpenAPI spec, known issues).
- **`.mcp.json`**:
  - `playwright-test`: Chrome, starts signed in from the saved login.
  - `github`: reads `GITHUB_PERSONAL_ACCESS_TOKEN` from the environment.

---

## 7. Key decisions

| Decision | Why |
|---|---|
| Auth in the framework (setup project + token fixture) | Required by the brief; one place to change; faster runs |
| Specs → page objects / API clients → JSON data | Specs read like the acceptance criteria; locators and HTTP details are written once |
| One fixture file, one line per page or client | Adding a screen or endpoint is a two-step recipe |
| Independent tests that create and clean their own data | Shared public environment; any order; re-runnable |
| Set up through the API, verify on the layer under test | Faster, less flaky, each test proves one thing |
| UI results cross-checked against the API | What the user sees matches what was stored |
| Known defects as `test.fail` | Visible in every run without a red build |
| Built on the team's ADGM conventions (BasePage, JSON data, `TIMEOUTS`, lint rules) | Familiar to the team. Differences: no PageFactory layer, framework-owned auth, `.env` credentials, independent tests |

---

## 8. With more time

1. **One account per worker** (registered in global setup, removed afterwards), then parallel runs.
2. **Schema validation** of every response against the OpenAPI spec (e.g. with Ajv), to catch contract drift automatically.
3. **Sold-out and concurrency tests:** create an event with a few seats, then race two bookings for the last one.
4. **Accessibility checks** with `@axe-core/playwright`, and the refund-eligibility flow.
5. **GitHub Actions:** static checks, then UI and API projects, credentials from repository secrets, HTML report as an artifact.
6. Firefox, WebKit and mobile-viewport projects, and publishing results to the team's test-management tool.
