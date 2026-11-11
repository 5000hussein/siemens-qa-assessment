# EventHub QA Automation - AI Agent Rules

These rules apply to ALL AI agents (Claude Code, Copilot, Cursor, etc.) used on this project.
Playwright + TypeScript UI and API automation for the EventHub booking flow (US-114, Siemens QA assessment).
Architecture and conventions are carried over from the team's ADGM/AccessRP framework; differences are listed below.

## Knowledge base (read before you write code)

`.claude/knowledge/` is the project's retrieval source. Look up the file that matches the task instead of guessing.

| You are about to... | Read first |
|---|---|
| Touch anything about the booking story or acceptance criteria | [`assessment.md`](.claude/knowledge/assessment.md) |
| Call or test an endpoint | [`api/endpoints.md`](.claude/knowledge/api/endpoints.md), raw spec in [`api/openapi.json`](.claude/knowledge/api/openapi.json) |
| Write or fix a locator / page object | [`ui-map.md`](.claude/knowledge/ui-map.md) |
| Assert on a value that looks "wrong" | [`known-issues.md`](.claude/knowledge/known-issues.md) — it may be a documented defect |
| Understand the overall design | [`.claude/agents/playwright.md`](.claude/agents/playwright.md) |

Refresh the API spec with `npm run api:spec`. Never hand-edit `openapi.json` or `endpoints.generated.md`.
When you learn something new about the app (a new screen, a new quirk, a new endpoint behaviour), add it to the matching knowledge file in the same change.

## Skills

Step-by-step guides in `.claude/skills/`:

- [**create-test**](.claude/skills/create-test.md) — new UI or API spec (file layout, fixtures, data, cleanup)
- [**create-page-object**](.claude/skills/create-page-object.md) — new page object (locators, actions, PageFactory + baseTest registration)
- [**create-api-client**](.claude/skills/create-api-client.md) — new API client (BaseApi, ApiFactory, cleanup tracking)
- [**explore-with-mcp**](.claude/skills/explore-with-mcp.md) — use the Playwright MCP to map a screen before automating it
- [**debug-test-failure**](.claude/skills/debug-test-failure.md) — investigate a failing test
- [**test-case-structure**](.claude/skills/test-case-structure.md) — how a booking test is laid out and why tests are independent

## General Rules

- **Never invent data.** No hardcoded credentials, URLs, event ids, customer details or limits in specs. Read them from `src/data/**/*.json` via `readJsonValue` / `readJsonObject`, or ask the user.
- **Never commit secrets.** Credentials live only in `.env` (gitignored). `.auth/` holds the saved login state and is gitignored. Do not read or print `.env`.
- **Authorization belongs to the framework.** Tests never log in. UI tests get a signed-in browser from the `setup` project's storage state; API tests get an authenticated client from the `api` / `bookingsApi` fixtures (token fetched once per worker). Use `anonymousApi` only for 401 tests.
- **Every test owns its data and cleans up.** Bookings created through `bookingsApi` are cancelled in fixture teardown. A booking created through the UI must be registered with `bookingsApi.trackByRef(ref)`. Never click "Clear all bookings" — the account is shared.
- **Set up through the API, verify through the screen under test.** E.g. the cancel test creates its booking via API, then cancels in the UI.
- **Pick events at runtime.** Use `eventsApi.findBookableEvent(minSeats)`; never pin an event id.
- **Spec files hold no helper functions or computed values.** Expected totals are computed inside page methods (`verifyPriceSummary(price, quantity)`) or are the assertion itself. Payloads come from `buildBookingInput()`.
- **Expected texts go in `src/config/assertions.ts`.** Routes in `src/config/routes.ts`. Timeouts from `TIMEOUTS` in `src/utils/timeouts.ts` — never raw numbers.
- **Known defects are tests, not silent workarounds.** Use `test.fail(true, '<what docs say vs what happens>')` and record it in `known-issues.md` and the README.
- **Keep documentation updated.** New page, client, flow or convention → update this file, `.claude/agents/playwright.md`, the relevant skill and knowledge file.

## Differences from the ADGM framework (deliberate)

| ADGM | EventHub | Why |
|---|---|---|
| Each test calls `loginPage.navigateAndLogin()` | `setup` project + storage state, token fixture | Brief: authorization handled by the framework |
| Credentials in encrypted `users.json.enc` | `.env` | Single sandbox account, reviewers bring their own |
| API fixtures + hardcoded `testData.ts` inside `src/tests/api/` | `src/api/*Api.ts` clients via `ApiFactory`, data in JSON | Same "never hardcode" rule as the UI side; clients reused for UI setup/cleanup |
| Tests chained through `applications.json` | Independent tests, data created per test | No multi-user approval chain here; independent tests are re-runnable and order-free |

Single worker is kept (as in ADGM) because all tests share one account and three sandbox events — seat-count assertions would race.

## Wait Strategy

- **Never use static waits** (`page.waitForTimeout`, sleeps). ESLint fails the build on them in specs.
- `waitFor({ state: 'visible' })` before interacting; web-first `expect(...)` for assertions.
- `waitForURL` after navigation that changes route; `waitForLoadState('domcontentloaded')` as the default after clicks.

## Locator Conventions

- Role-based first: `getByRole('button', { name: 'Confirm Booking' })`, `getByRole('textbox', { name: 'Full Name' })`.
- `data-testid` next (the app ships `booking-card`, `cancel-booking-btn`, `nav-*`, `logout-btn`, …): `getByTestId(...)`.
- XPath / CSS only as fallback (e.g. `#ticket-count`, the "Price per ticket" value). Scope to a parent (form, card, dialog) when the same text appears twice.
- Locators are `readonly` fields grouped by `// ========== SECTION ==========` comments and initialised in the constructor.

## Code Style

Prettier (`.prettierrc.json`) and ESLint (`eslint.config.mjs`) are copied from ADGM. `npm run format` before committing; `npm run lint` must report no errors.

- One blank line before each section comment, none between a section comment and its code.
- No comments that restate the code — only *why* when non-obvious.

## Project Structure

```
src/
  api/          BaseApi, AuthApi, EventsApi, BookingsApi, types.ts
  config/       environment.ts (env + paths + credentials), routes.ts, assertions.ts
  core/         BasePage.ts, baseTest.ts (all fixtures: pages, api clients, auth token)
  data/         environments.json, test_data/bookings.json, builders/bookingBuilder.ts
  factories/    PageFactory.ts, ApiFactory.ts
  pages/        CommonPage, LoginPage, EventsPage, EventDetailsPage, MyBookingsPage
  tests/
    setup/      auth.setup.ts (UI login once, saves .auth/user.json)
    ui/booking/ 001-book-tickets, 002-my-bookings
    api/bookings/ 001-create, 002-validation, 003-cancel, 004-contract-vs-docs
  utils/        jsonHelper.ts, timeouts.ts, format.ts, logger.ts
.claude/        agents/, skills/, knowledge/ (RAG), settings.json
.mcp.json       Playwright MCP + GitHub MCP
scripts/        fetch-api-spec.js, setup-mcp.ps1
```

## Commands

```bash
npm test                 # everything (setup + ui + api)
npm run test:ui          # UI only (runs setup first)
npm run test:api         # API only
npm run test:headed      # UI with visible browser (default locally anyway)
npx playwright test <file>
npm run test:report      # open HTML report
npm run typecheck && npm run lint && npm run format:check
npm run api:spec         # refresh .claude/knowledge/api from Swagger
npm run mcp:setup        # pre-cache Playwright MCP, check GitHub token, list MCP servers
```
