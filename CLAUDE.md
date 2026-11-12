# EventHub QA Automation - AI Agent Rules

Playwright + TypeScript UI and API automation for the EventHub booking flow (US-114, Siemens QA assessment).
These rules apply to every AI agent working in this repo. Details live in the agents, skills and knowledge files below — read the one that matches your task.

## Hard rules

1. **Never invent data.** No credentials, URLs, event ids, customer details or limits in specs. Read them from `src/data/**/*.json`, or ask the user.
2. **Never commit or read secrets.** Credentials live only in `.env`; login state in `.auth/`. Both are gitignored. Never open or print them.
3. **Tests never log in.** Auth belongs to the framework: UI tests start signed in (setup project + storage state), API tests use the authenticated fixtures. `anonymousApi` is only for 401 checks.
4. **Every test owns its data and cleans up.** Bookings made through `bookingsApi` are cancelled in teardown; UI-made bookings are registered with `bookingsApi.trackByRef(ref)`. Never use "Clear all bookings" — the account is shared.
5. **Pick events at runtime** with `eventsApi.findBookableEvent(minSeats)`. Never pin an event id or title.
6. **Specs hold no helpers or computed values.** Computation lives in page `verify*` methods; payloads come from `buildBookingInput()`.
7. **Expected texts** go in `src/config/assertions.ts`, **routes** in `src/config/routes.ts`, **timeouts** from `TIMEOUTS`. No raw numbers.
8. **No static waits.** No `waitForTimeout`; `waitFor` before interacting; web-first `expect`.
9. **Locators:** role-based first, then `getByTestId`, then XPath/CSS as a fallback, scoped to a parent when text repeats.
10. **Never weaken an assertion to get green.** A doc/story mismatch becomes `test.fail(true, reason)` plus an entry in `known-issues.md` and the README.
11. **Single worker.** All tests share one account and a few events; seat-count checks would race in parallel.
12. **Keep the docs true.** If you add a page, client, convention or learn something about the app, update the matching knowledge file and this index in the same change.

## Agents (`.claude/agents/`)

| Agent | Use it for | Skills it loads |
|---|---|---|
| [`ui-test-writer`](.claude/agents/ui-test-writer.md) | New or changed UI tests and page objects | explore-with-mcp, create-page-object, create-test, test-case-structure |
| [`api-test-writer`](.claude/agents/api-test-writer.md) | New or changed API tests and API clients | create-api-client, create-test, test-case-structure |
| [`test-debugger`](.claude/agents/test-debugger.md) | Failing or flaky tests | debug-test-failure, explore-with-mcp |

## Skills (`.claude/skills/<name>/SKILL.md`)

| Skill | What it covers |
|---|---|
| [`create-test`](.claude/skills/create-test/SKILL.md) | Spec layout, fixtures, data, auth, cleanup, assertions |
| [`create-page-object`](.claude/skills/create-page-object/SKILL.md) | Page object structure, locators, PageFactory + baseTest registration |
| [`create-api-client`](.claude/skills/create-api-client/SKILL.md) | API client structure, cleanup tracking, ApiFactory registration |
| [`test-case-structure`](.claude/skills/test-case-structure/SKILL.md) | Arrange/act/assert/clean, which layer proves which AC |
| [`explore-with-mcp`](.claude/skills/explore-with-mcp/SKILL.md) | Mapping a screen or call with the Playwright MCP before automating it |
| [`debug-test-failure`](.claude/skills/debug-test-failure/SKILL.md) | Reading failures, common causes, re-running |

## Knowledge base (`.claude/knowledge/`)

| Read this | When you |
|---|---|
| [`assessment.md`](.claude/knowledge/assessment.md) | need the story, acceptance criteria or deliverables |
| [`architecture.md`](.claude/knowledge/architecture.md) | need the layers, fixtures, data files and test patterns |
| [`api/endpoints.md`](.claude/knowledge/api/endpoints.md) | call or test an endpoint (raw spec: `api/openapi.json`, refresh with `npm run api:spec`) |
| [`ui-map.md`](.claude/knowledge/ui-map.md) | write or fix a locator |
| [`known-issues.md`](.claude/knowledge/known-issues.md) | see behaviour that looks wrong — it may be a documented defect |

## Commands

```bash
npm test                 # setup + UI + API
npm run test:ui          # UI only (signs in first)
npm run test:api         # API only
npx playwright test <file>
npm run test:report      # HTML report
npm run typecheck && npm run lint && npm run format:check
npm run api:spec         # refresh the API knowledge from Swagger
npm run mcp:setup        # pre-cache Playwright MCP, check GitHub token, list MCP servers
```

Locally the browser is visible; `HEADLESS=true` hides it, `SLOW_MO=500` slows it down. CI is always headless.
