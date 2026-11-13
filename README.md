# EventHub QA Automation — US-114 "Book tickets for an event"

UI and API automation for the EventHub booking flow, built with **Playwright + TypeScript**.
The framework is built to grow: a team should be able to add screens, endpoints and flows for years without restructuring it.

- Web app: https://eventhub.rahulshettyacademy.com
- API docs: https://api.eventhub.rahulshettyacademy.com/api/docs

---

## 1. How to run

**Prerequisites:** Node.js 20+, an EventHub account (register at `/register`; credentials for the submitted account are provided in the submission form).

```bash
npm ci
npx playwright install chromium
cp .env.example .env          # then set EVENTHUB_USER_EMAIL and EVENTHUB_USER_PASSWORD
npm test                      # setup + UI + API (24 tests, ~45 s)
```

| Command | What it does |
|---|---|
| `npm run test:ui` | UI tests (the `setup` project signs in first) |
| `npm run test:api` | API tests only |
| `npx playwright test <file>` | One spec |
| `HEADLESS=true npm test` | Hide the browser locally (it is visible by default; always headless in CI) |
| `SLOW_MO=500 npm run test:ui` | Slow each action down to watch the run |
| `npm run test:report` | Open the HTML report (screenshots, video, trace on failure) |
| `npm run typecheck && npm run lint && npm run format:check` | Static checks |
| `npm run api:spec` | Re-download the OpenAPI spec into `.claude/domain/openapi.json` |

Every test cleans up the bookings it creates, so the shared environment is left as it was found.

---

## 2. Story review (US-114)

### What is missing or unclear — questions for the Product Owner

| # | Area | Question |
|---|---|---|
| Q1 | Actor | The story says "As a **visitor**", but booking requires a signed-in account. Is guest checkout intended, or should the story say "registered user"? |
| Q2 | AC1 – inputs | What are the field rules? The app enforces name ≥ 2 chars, a valid email, a "10-digit" phone (UI) / ≥ 10 characters (API). Which is correct, and are international formats allowed? |
| Q3 | AC1 – quantity | The app limits bookings to 1–10 tickets. Is 10 the business rule? Per booking, per user, or per event? |
| Q4 | AC1 – availability | What happens when an event has fewer seats than requested, or is sold out? Should the UI cap the counter at the available seats? |
| Q5 | AC1 – reference | What is the booking-reference format and its uniqueness guarantee? (See D1.) Is a confirmation email expected? |
| Q6 | AC2 – price | Which currency? Any taxes, booking fees, discounts or rounding? Should the total be shown before confirming (it is)? |
| Q7 | AC3 – My Bookings | Which fields must be shown, in what order, with what pagination? Should cancelled bookings still appear (as "cancelled")? |
| Q8 | AC4 – cancel | Who can cancel and until when (event date? cut-off)? Are refunds part of this story (there is a "Check eligibility for refund?" button)? Are seats released? Should cancelling be confirmed (there is a dialog)? |
| Q9 | AC4 – outcome | Should a cancelled booking be **deleted** or **marked cancelled**? (See D3.) |
| Q10 | AC5 – API | What is the response contract, which errors are expected (400/401/404/409), and is the API required to apply the same rules as the UI? |
| Q11 | Events | Can past events be booked? (See D5.) |
| Q12 | Non-functional | Concurrency (two users taking the last seats), accessibility, mobile, performance targets? |

### What the application does differently from the story or the docs

| # | Observation | Where | Evidence in this repo |
|---|---|---|---|
| D1 | **Booking reference format** — docs say `EVT-XXXXXX`; the API returns the first letter of the event title + 6 characters (`D-0VYXU6`). | API docs vs API | `004-contract-vs-docs.spec.ts` (`test.fail`) |
| D2 | **Number types** — `totalPrice` and `price` are documented as numbers but returned as strings (`"900"`). Clients that do `price * quantity` on strings risk errors. | API docs vs API | `004-contract-vs-docs.spec.ts` (`test.fail`) |
| D3 | **Cancel = hard delete** — `DELETE /bookings/{id}` removes the record (later `GET` → 404), yet the schema has `status: cancelled` and the list has a `status=cancelled` filter that can never return anything. | API docs vs API | `003-cancel-booking.spec.ts` |
| D4 | **"List all bookings"** returns only the signed-in user's bookings. Correct behaviour, but the docs are wrong. | API docs | — |
| D5 | **Past events listed as "Upcoming" and bookable** — events dated July/October 2026 are listed under "Upcoming Events" and accept bookings in November 2026. | UI | manual |
| D6 | **Featured event seat count doesn't change** — booking 2 tickets for the featured "Hollywood Monsoon Night" left `availableSeats` at 2287; a non-featured booking reduced seats as documented. | API | manual (tests choose events dynamically) |
| D7 | **Phone rule differs** — UI: "Enter a valid 10-digit phone"; API: `minLength 10` on a free string. | UI vs API | `002-booking-validation.spec.ts` |
| D8 | **No feedback after cancelling** — the card disappears silently, without a toast or message. | UI | — |

**Assumptions made to keep going:** a signed-in user counts as a "visitor"; the observed reference format is acceptable; "cancel" means the booking disappears from My Bookings and its seats are released; the 1–10 ticket limit is intended.

---

## 3. Architecture and key decisions

```
src/
  api/          BaseApi → AuthApi, EventsApi, BookingsApi  (+ types.ts)
  pages/        BasePage → CommonPage → EventsPage, EventDetailsPage, MyBookingsPage, BookingDetailsPage ; BasePage → LoginPage
  core/         baseTest.ts — every fixture: pages, API clients, auth token, cleanup
  config/       environment.ts (env, paths, credentials), routes.ts
  data/         environments.json, assertions.json (expected texts), test_data/bookings.json, builders/bookingBuilder.ts
  tests/        setup/ (auth), ui/booking/, api/bookings/
```

| Decision | Why |
|---|---|
| **Authorization is owned by the framework.** A `setup` project signs in through the UI once and saves storage state, so UI tests start signed in. A worker-scoped `apiToken` fixture logs in through `/auth/login` once, and the `api` fixture injects `Authorization: Bearer`. No test logs in. | This is what the brief asks for. Login logic lives in one place, so an auth change touches one file, and suites run faster. |
| **Separate layers: specs → page objects / API clients → data.** | Specs read like the acceptance criteria. Locators and HTTP details are each written once. |
| **One fixture file** (`baseTest.ts`): every page object and API client is a one-line fixture. | Adding a screen or endpoint is a recipe: create a class, add one fixture line. Specs only ask for what they need. |
| **All test data in JSON** (`src/data/test_data/*.json`, keyed by environment), plus a `buildBookingInput()` builder. | No literals in specs. A new environment means a new JSON key, not code changes. |
| **Events chosen at runtime** (`findBookableEvent(minSeats)`). | Event IDs differ per sandbox account and seats change over time, so hard-coded IDs would break. |
| **Every test creates its own data and cleans up.** `BookingsApi` tracks every booking it creates, and fixture teardown cancels them. UI-created bookings are registered with `trackByRef`. | The environment is shared and public (the brief asks for clean-up). Tests can run in any order and be re-run without manual resets. |
| **Set up through the API, verify on the layer under test.** The cancel UI test creates its booking via the API. | Faster and less flaky. Each test exercises only the behaviour it's named after. |
| **UI results cross-checked against the API.** After a UI booking, the test reads it back by reference and checks the event, quantity and total. | Shows that what the user sees matches what was actually stored. |
| **Known defects are executable** (`test.fail` with a reason). | They stay visible in every run without turning the run red. When a defect is fixed, the test fails and tells you to remove the marker. |
| **Single worker.** | All tests share one account and three sandbox events, so seat-count assertions would race. The tests are already independent: give each worker its own account and set `workers` > 1. |
| **Built on the team's ADGM framework conventions** (BasePage/CommonPage, JSON data helpers, `assertions.json`, `TIMEOUTS`, ESLint/Prettier rules). | Familiar to the team. Deliberate differences: no PageFactory layer, framework-owned auth, `.env` credentials, API clients instead of fixtures in the test folder, independent tests instead of chained ones. |
| **Role-based locators first**, then `data-testid`, then CSS/XPath; no static waits (enforced by ESLint). | Resilient to styling changes and closer to how users and assistive tech see the page. |

### AI tooling inside the repo

- `.mcp.json` registers the **Playwright MCP** as `playwright-test` (Chrome, starts signed in from the framework's saved login state; named so it can't clash with a global `playwright` server) and the **GitHub MCP** (it needs `GITHUB_PERSONAL_ACCESS_TOKEN` in the environment; `/automate` checks it in its preflight).
- `CLAUDE.md` holds the always-on rules for any AI agent in the repo.
- **`/automate <requirement or flow>`** (`.claude/commands/automate.md`) turns a requirement into a verified test and a PR:
  1. Gate 1 asks whether to automate web or API, and the coverage and target.
  2. `explorer` maps the live page with the Playwright MCP, or makes live API calls.
  3. `test-writer` writes the code.
  4. `verifier` runs typecheck, lint, coverage and convention checks, then a live run, with at most 2 fix cycles.
  5. At Gate 2 a PR is opened, only after the user approves and only if the live run passed.
- **`/test-fix <spec>`** diagnoses a failing test and fixes the framework code without weakening the assertion.
- `.claude/skills/` holds the general conventions (`framework-conventions`, `locator-rules`) that every agent preloads through its `skills:` frontmatter.
- `.claude/domain/` holds the facts about the app under test: requirements, app map, API notes plus `openapi.json` (regenerated with `npm run api:spec`), and known issues. Agents read `INDEX.md` first, and only `/automate` writes there, after approval.

---

## 4. What is covered and why

24 tests: 1 setup, 5 UI, 18 API (including 2 known-defect checks).

| AC | UI | API |
|---|---|---|
| AC1 booking + confirmation + reference | Full flow from the events list, with the reference format checked | 201 response shape and reference format |
| AC1 negative | Invalid name/email/phone show messages and create no booking | 400 for quantity 0/11, short name, bad email, short phone, empty body; 404 unknown event; 401 no token |
| AC2 price × quantity | Summary at 1, 3 and 10 tickets, plus the confirmation total | `totalPrice` for 2 and 10 tickets |
| AC3 in My Bookings | Card shows ref, event, quantity, total and status | Read back by id, by reference and from the list |
| AC4 cancel | Cancel through the dialog, gone after reload, backend 404, seats restored | 200 then 404, seats restored, double cancel → 404, unknown id → 404, no token → 401 and booking survives |
| AC5 via API | — | All of the above, plus available seats decrease by the booked quantity |

**Why this split:** the UI tests cover what only the UI can prove: the user journey, what's on screen and the client-side validation. Rules and edge cases (limits, invalid input, auth, error codes, seat arithmetic) are cheaper and more stable through the API, so most of the combinations live there. Each AC has at least one positive UI test and one positive API test. Negative cases are chosen at the boundaries the app actually enforces (0/1/10/11 tickets).

**Not covered, on purpose:** registration (outside US-114), admin event management (it changes shared data), the booking details page and the refund check (not in the ACs), and visual or cross-browser checks.

---

## 5. With more time

1. **A dedicated account per worker** (created through `/auth/register` in global setup and removed afterwards), then parallel runs.
2. **Schema validation** of every response against `openapi.json` (e.g. with Ajv), so contract drift like D1/D2 is caught automatically rather than one field at a time.
3. **Sold-out and concurrency tests**: create an event with a few seats through `/events`, then race two bookings for the last seat.
4. **Booking details page and refund check** page objects; accessibility checks with `@axe-core/playwright`.
5. **GitHub Actions** workflow (deferred as agreed): typecheck, lint, then UI and API projects, with credentials from repository secrets and the HTML report uploaded as an artifact.
6. Firefox/WebKit and mobile viewport projects, and a reporter that publishes results to the team's test-management tool.

---

## 6. Credentials

The tests read `EVENTHUB_USER_EMAIL` / `EVENTHUB_USER_PASSWORD` from `.env` (git-ignored). The account used for this submission is shared through the submission form, not in the repository. Any freshly registered account also works, because events are picked at runtime.
