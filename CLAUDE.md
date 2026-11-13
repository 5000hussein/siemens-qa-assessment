# Repo conventions — EventHub QA Automation

Playwright + TypeScript UI and API test automation. The repo also hosts a lite agentic QA command (`/automate`) under `.claude/`.

## Test work — always-on rules

Full conventions live in the **`framework-conventions`** and **`locator-rules`** skills (`.claude/skills/`) — read them before writing or editing tests. The rules never to skip:

- **Grep before writing.** Search `src/pages/`, `src/api/`, `src/data/` for an existing method, locator or data key before creating one. Reuse > re-invent.
- **Tests never log in.** Auth is owned by the framework (setup project + storage state for UI, token fixture for API).
- **No literals in specs.** Data from `src/data/**/*.json`, expected texts from `assertions.json`, routes from `routes.ts`, timeouts from `TIMEOUTS`.
- **Own your data.** Every test arranges its own records, never pins ids, and registers every booking it creates with `bookingCleanup.track(id)` so the fixture teardown cancels it, pass or fail.
- **Selector priority:** role → test id → label/text → `#id` → XPath. Every locator matches exactly one element.
- **No static waits.** No `waitForTimeout`; `waitFor` before interacting; web-first `expect`.
- **Never weaken an assertion.** App vs requirement/doc mismatch → `test.fail(true, reason)` + an entry in `.claude/domain/known-issues.md`.
- **Never read secrets.** `.env` and `.auth/` are gitignored; never open, print or commit them.
- **Green before done:** `npm run typecheck && npm run lint && npm run format:check` and the affected tests pass.
- **One action, one commit.** Fix what was asked; don't refactor "while you're here."

## Agentic QA command

| Command | In → out |
|---|---|
| `/automate <requirement or flow>` | Requirement text → verified Playwright test → PR. Gate 1 questionnaire (web/api, coverage, target) → explore → write → verify (live run) → Gate 2 PR. |
| `/test-fix <spec or title>` | Failing test → root cause → fix without weakening the test. |

`/automate` agents live in `.claude/agents/automate/` (`explorer`, `test-writer`, `verifier`); the command owns both human gates.

## Workflow for non-trivial work

YOU MUST: **restate → MCQs → write a plan → wait for approval → implement.** Do not skip steps.

## Standards

- `.md` files under `.claude/` stay under 100 lines.
- Agents have one focused responsibility and a structured JSON output.
- Rules in agents and skills are general; facts about the app under test live only in `.claude/domain/`.
- No hallucinated locators, endpoints, ids or messages — everything comes from the repo, the live app, or the user.

## Pointers

- **Command:** `.claude/commands/automate.md`
- **Agents:** `.claude/agents/automate/` · **Skills:** `.claude/skills/<name>/SKILL.md`
- **Domain (app facts):** `.claude/domain/INDEX.md` — requirements, app map, API notes + `openapi.json`, known issues
- **Run:** `npm test` · `npm run test:ui` · `npm run test:api` · `npm run test:report` · `npm run api:spec`
- **Browser:** visible locally; `HEADLESS=true` hides it, `SLOW_MO=500` slows it; CI is headless
