---
name: create-test
description: "Create a new UI or API spec in this repo: file layout, fixtures, JSON data, framework-owned auth, automatic booking cleanup, assertions. Use whenever adding a test under src/tests/."
---

# Skill: Create a New Test

## When to Use

Adding a UI spec under `src/tests/ui/` or an API spec under `src/tests/api/`.

## Steps

### 1. Look it up first

- Story/AC wording: `.claude/knowledge/assessment.md`
- Endpoint contract: `.claude/knowledge/api/endpoints.md`
- Screen and locators: `.claude/knowledge/ui-map.md` (map it with the `explore-with-mcp` skill if missing)
- Is the odd behaviour already known? `.claude/knowledge/known-issues.md`

### 2. Put the data in JSON

Add any new values to `src/data/test_data/<area>.json` under the env key (`PROD`). Never literals in the spec.

### 3. Create the file

- UI: `src/tests/ui/<area>/NNN-<flow>.spec.ts` · API: `src/tests/api/<resource>/NNN-<behaviour>.spec.ts`
- Numbers group files by theme, not execution order — every test must pass on its own.

```ts
import { test, expect } from '../../../core/baseTest';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { buildBookingInput } from '../../../data/builders/bookingBuilder';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.ui.quantity`));

test.describe('US-114 <area>', () => {
  test('ACn: <behaviour in AC language>', async ({ eventsApi, bookingsApi, myBookingsPage }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, quantity));
    // act + verify through page / client methods only
  });
});
```

### 4. Auth and cleanup

- Do **not** log in. UI fixtures are already signed in; `api`/`bookingsApi` already carry the token.
- 401 cases: use `anonymousApi`.
- Bookings via `bookingsApi.create*` are cleaned automatically. UI-created ones: `await bookingsApi.trackByRef(ref)` right after you read the reference.

### 5. Assertions

- Expected texts from `src/config/assertions.ts` (add new ones there).
- Prefer page `verify*` methods; in API specs assert status first, then body.
- Known defect? `test.fail(true, '<docs say X, app does Y>')` and add it to `known-issues.md` + README.

### 6. Run

```bash
npx playwright test <file>            # headed locally
HEADLESS=true npx playwright test <file>
npm run typecheck && npm run lint
```

## Rules

- No helper functions, loops over computed data, or derived values in specs (data-driven `for` over JSON values is fine).
- No `waitForTimeout`. Use `TIMEOUTS`, never raw numbers.
- One behaviour per test; name it with the AC it proves.
