---
description: Run a failing Playwright test by file or title, find the root cause from the error, screenshot, trace and error-context, and fix the framework code without weakening the test. Uses the Playwright MCP when the page needs live inspection.
user-invocable: true
---

# Skill: Test Fix

## Usage

`/test-fix <spec file or test title>`

## 1. Reproduce

```bash
npx playwright test <file> -g "<title>" --retries=0
```

UI failures leave `test-results/<test>/`: `test-failed-1.png`, `error-context.md` (accessibility snapshot at failure), `trace.zip` (`npx playwright show-trace <path>`). Read them **before** forming a theory.

## 2. Classify

| Class | Signs | Action |
|---|---|---|
| Framework bug | locator not found / matches many, wrong wait, wrong data key, fixture not registered | Fix the page object, client, fixture or data. Keep the assertion. |
| Environment | redirected to login, 401, no record with enough capacity, leftover data | Fix setup/data selection/cleanup so it cannot recur. |
| App defect | the app behaves differently from the requirement or docs | Don't change the expectation. Report with evidence; on the user's OK mark `test.fail(true, reason)` and add it to `.claude/domain/known-issues.md`. |

## 3. Common causes

| Symptom | Cause |
|---|---|
| Every UI test lands on `/login` | storage state stale or `setup` didn't run — run via `--project=ui`; check `.env` exists |
| `element(s) not found` on a text locator | React split text nodes — see `locator-rules` |
| `strict mode violation` | locator matches several elements — scope it to a parent |
| Count/total off by N | another write to the same record ran concurrently — workers must stay at 1 |
| A `test.fail` test turns red | the defect was fixed — remove `test.fail`, update `known-issues.md` |

## 4. Inspect live (if the screen changed)

Playwright MCP: `browser_navigate` → `browser_snapshot` → `browser_evaluate` to count matches for the new locator. Update `.claude/domain/app-map.md` with what changed.

## 5. Confirm

Re-run the single test, then its whole project (`npm run test:ui` / `npm run test:api`), then `npm run typecheck && npm run lint`.

## Rules

- Never add `waitForTimeout`, raise timeouts, add retries, widen expected statuses or `test.skip` to get green.
- Never delete data you did not create; cancel only leftovers from the failed run, by id.
- State the root cause in one or two sentences with the evidence.
