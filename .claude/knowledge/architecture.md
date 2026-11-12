# EventHub QA Automation - Architecture

**Keep this file up to date.** Whenever you add pages, clients, fixtures or flows, update the relevant section.

## What This Project Is

Playwright + TypeScript automation of the EventHub ticket-booking flow (US-114). EventHub is a public practice app with a Next.js UI (`https://eventhub.rahulshettyacademy.com`) and a REST API (`https://api.eventhub.rahulshettyacademy.com/api`). Each account is an isolated sandbox with its own events and bookings.

## Tech Stack

- Playwright 1.65, TypeScript 5 (strict), ESLint + Prettier (same rules as ADGM)
- Chromium (Desktop Chrome device), single worker, headed locally / headless in CI
- `dotenv` for `.env`, `cross-env` available for env switching

## Architecture

### Layers

```
tests (specs)            what is being verified, in AC language
  │ fixtures (core/baseTest.ts)   wiring + auth + cleanup
  ├── pages/  (UI)        BasePage → CommonPage → EventsPage / EventDetailsPage / MyBookingsPage
  │                       BasePage → LoginPage
  ├── api/    (HTTP)      BaseApi → AuthApi / EventsApi / BookingsApi
  └── data/   (inputs)    environments.json, test_data/bookings.json, builders/
config/                   environment, routes, assertions (expected texts)
```

### Fixtures & Factories

- `PageFactory` lazily creates page objects; each is exposed as a fixture (`eventsPage`, `eventDetailsPage`, `myBookingsPage`, …).
- `ApiFactory` does the same for API clients over one `APIRequestContext`.
- `apiToken` (worker scope): logs in once via `AuthApi` using `.env` credentials.
- `api`: authenticated `ApiFactory` with `Authorization: Bearer <token>`; on teardown runs `bookingsApi.cleanup()`.
- `anonymousApi`: unauthenticated `ApiFactory`, for 401 tests only.
- `authApi` / `eventsApi` / `bookingsApi`: shortcuts into `api`.
- UI auth: the `setup` project (`src/tests/setup/auth.setup.ts`) signs in through `LoginPage` once and saves `.auth/user.json`; the `ui` project loads it as `storageState`. The app keeps its JWT in `localStorage['eventhub_token']`, which storage state captures.

### Data

- `src/data/environments.json` — `baseUrl`, `apiBaseUrl` per `ENV` (default `PROD`).
- `src/data/test_data/bookings.json` — customer details, quantities, limits, invalid values, not-found ids, keyed by env.
- `src/data/builders/bookingBuilder.ts` — `buildBookingInput(eventId, quantity, overrides?)`.
- `.env` — `EVENTHUB_USER_EMAIL`, `EVENTHUB_USER_PASSWORD`, optional `HEADLESS`, `SLOW_MO`.

### Assertions, routes, timeouts

- `config/assertions.ts`: `successMessages`, `dialogs`, `validationMessages`, `bookingStatuses`, `bookingRefPattern`.
- `config/routes.ts`: `ROUTES.events`, `ROUTES.eventDetails(id)`, `ROUTES.myBookings`, …
- `utils/timeouts.ts`: `TIMEOUTS.short | medium | long | …` (copied from ADGM).
- `utils/format.ts`: `formatPrice()` renders amounts like the UI (`$2,500`).

## Test Patterns

### UI booking (AC1–AC3)
`eventsApi.findBookableEvent(min)` → `eventsPage.navigate()` → `openEvent(title)` → `setTicketQuantity(q)` → `verifyPriceSummary(price, q)` → `fillCustomerDetails(...)` → `clickConfirmBooking()` → `getBookingReference()` → `bookingsApi.trackByRef(ref)` → `verifyConfirmation(...)` → `clickViewMyBookings()` → `verifyBookingListed(...)`.

### UI cancel (AC4)
`bookingsApi.createBooking(buildBookingInput(...))` → `myBookingsPage.navigate()` → `cancelBooking(ref)` (opens the "Cancel this booking?" dialog, confirms) → `verifyBookingNotListed(ref)` → API: booking 404, seats back to the starting count.

### API (AC5)
`bookingsApi.create(buildBookingInput(...))` → assert status, body shape, `bookingRef` pattern, `Number(totalPrice) === Number(price) × quantity`. Negative cases drive the same call with overrides from `bookings.json`.

### Known defects
`test.fail(true, reason)` in `004-contract-vs-docs.spec.ts`; each one is also listed in `known-issues.md` and the README.
