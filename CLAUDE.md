# Repo conventions — EventHub QA Automation

Playwright + TypeScript UI and API test automation for EventHub (story US-114, book tickets). The repo also ships a lite agentic QA package under `.claude/`.

## Test work — always-on rules

Full conventions live in the **`framework-conventions`** and **`locator-rules`** skills — read them before writing or editing tests. The rules never to skip:

- **Grep before writing.** Search `src/pages/`, `src/api/`, `src/data/` for an existing method, locator or data key before creating one. Reuse > re-invent.
- **Tests never log in.** Auth is owned by the framework (setup project + storage state for UI, `apiToken` worker fixture for API).
- **API classes only call the endpoint** and return the response; specs assert on status and body.
- **No literals in specs.** Data from `src/data/**/*.json` (`readJsonValue` / `readJsonObject`), expected texts from `assertions.json`, routes from `routes.ts`, timeouts from `TIMEOUTS`.
- **Own your data.** Find records by name through the API (e.g. `GET /events?search=<eventName>`), never pin ids, and register every booking with `bookingCleanup.track(id)` so the fixture teardown cancels it, pass or fail.
- **Test titles:** `Check the user is (not) able to <action>`, AC prefix when there is one.
- **Selector priority:** role → test id → label/text → `#id` → XPath. Every locator matches exactly one element.
- **No static waits.** No `waitForTimeout`; `waitFor` before interacting; web-first `expect`.
- **Never weaken an assertion.** App vs requirement/doc mismatch → `test.fail(true, reason)` + an entry in `.claude/domain/known-issues.md` and the README story review.
- **Never read secrets.** `.env` and `.auth/` are gitignored and denied in `settings.json`; never open, print or commit them.
- **Green before done:** `npm run typecheck && npm run lint && npm run format:check` and the affected tests pass.
- **One action, one commit.** Fix what was asked; don't refactor "while you're here."

## Workflow for non-trivial work

YOU MUST: **restate → MCQs → write a plan → wait for approval → implement.** Do not skip steps.

## The `.claude/` package

| Path | What it is |
|---|---|
| `commands/automate.md` | `/automate <requirement or flow>` — Gate 1 questionnaire (web/api, coverage, target) → preflight → explore → write → verify (live run, max 2 fix cycles) → Gate 2 PR. The command owns both human gates; agents never ask the user. |
| `agents/automate/explorer.md` | Opus, read-only. Web: walks the steps in a live signed-in Chrome via the `playwright-test` MCP, returns verified locators. API: live calls, records real responses. |
| `agents/automate/test-writer.md` | Opus. Writes page objects / API clients, the spec and its JSON data; registers fixtures. No browser. |
| `agents/automate/verifier.md` | Sonnet. Static checks, step coverage, conventions, live run → PASS/FAIL with exact fixes. Never edits. |
| `skills/framework-conventions/` | Where files go and how code is written. Loaded by every agent. |
| `skills/locator-rules/` | Locator priority, uniqueness, scoping, naming. |
| `skills/test-fix/` | `/test-fix <spec or title>` — failing test → root cause → fix without weakening the test. |
| `domain/` | App facts only. Start at `INDEX.md`: `requirements.md`, `app-map.md`, `api.md`, `openapi.json` (generated), `known-issues.md`. |
| `scripts/fetch-api-spec.js` | `npm run api:spec` — refreshes `domain/openapi.json` from the live Swagger docs. |
| `settings.json` | Enables the `playwright-test` and `github` MCP servers (`.mcp.json`), allows test commands, denies `.env` and `.auth/`. |

## Standards

- `.md` files under `.claude/` stay under 100 lines.
- Agents have one focused responsibility and a structured JSON output.
- Rules in agents and skills are general; facts about the app under test live only in `.claude/domain/`.
- No hallucinated locators, endpoints, ids or messages — everything comes from the repo, the live app, or the user.

## Pointers

- **README:** how to run, story review, coverage, key decisions, framework guide.
- **Run:** `npm test` · `npm run test:ui` · `npm run test:api` · `npm run test:report` · `npm run api:spec`
- **Browser:** visible locally; `HEADLESS=true` hides it, `SLOW_MO=500` slows it; CI is headless.
- **CI:** `.github/workflows/tests.yml` — static checks → API → UI (sequential: shared account), credentials from repository secrets.
