# Skill: Debug a Test Failure

## Steps

### 1. Read the error

File and test name, failing line and method, error type (`TimeoutError`, `expect(...).toHaveText`, HTTP status mismatch), and Playwright's call log.

### 2. Look at the evidence (UI)

Failed tests keep a screenshot, video, trace and `error-context.md` (accessibility snapshot at failure) in `test-results/<test-folder>/`.

```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```

### 3. Common causes

| Symptom | Likely cause | Fix |
|---|---|---|
| Every UI test redirects to `/login` | `.auth/user.json` stale or `setup` didn't run | Run via `--project=ui` (pulls in `setup`), check `.env` |
| `EVENTHUB_USER_EMAIL ... must be set` | `.env` missing/empty | Copy `.env.example`, fill values |
| `element(s) not found` on a text locator | React split text nodes; XPath `text()` only sees the first node | Use `locator('span', { hasText })` or role-based |
| Seat count off by N | Another booking on the same event happened concurrently | Workers must stay at 1; check nothing else uses the account |
| `No event with at least N available seats` | Sandbox events sold out | Lower `minAvailableSeats` in JSON or free seats via cancel |
| A `test.fail()` test turns red | The documented defect was fixed | Remove the `test.fail` line, update `known-issues.md` and README |
| 401 in API tests | Token expired (7 days) or wrong account | Re-run; token is fetched per worker |

### 4. Re-run

```bash
npx playwright test <file> --retries=0
SLOW_MO=500 npx playwright test <file>        # watch it
npx playwright test <file> --debug
```

## Rules

- Look at the screenshot / error-context before guessing.
- Never "fix" with `waitForTimeout`; find the right condition.
- If the app changed, update `.claude/knowledge/ui-map.md` along with the locator.
