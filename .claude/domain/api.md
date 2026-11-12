# EventHub API — what the tests rely on

Documented contract: `openapi.json` in this folder (refresh with `npm run api:spec`).
This file adds what was **observed** against the real API on 2026-11-11.

- Base URL: `https://api.eventhub.rahulshettyacademy.com/api/` (Swagger UI at `/api/docs`)
- Auth: `POST auth/login` `{ email, password }` → `{ success, token, user: { id, email } }`. JWT valid 7 days. Send `Authorization: Bearer <token>`.
- Everything except `health`, `config`, `auth/register`, `auth/login` returns `401 {"success":false,"error":"Unauthorized"}` without a token.
- Data is scoped per account (own sandbox): `GET events` shows that account's events; `GET bookings` shows only that account's bookings, although the docs say "List all bookings".

## Bookings

| Call | Success | Errors observed |
|---|---|---|
| `POST bookings` `{ eventId, customerName, customerEmail, customerPhone, quantity }` | `201 { success, data: Booking, message: "Booking confirmed!" }` | `400 { error: "Validation failed", details: [{ field, message }] }`; `404` unknown event; `401` no token |
| `GET bookings?eventId&status&page&limit` | `200 { data: Booking[], pagination: { total, page, limit, totalPages } }` | |
| `GET bookings/{id}` | `200 { data: Booking }` | `404` after cancel |
| `GET bookings/ref/{ref}` | `200 { data: Booking }` | `404` after cancel |
| `DELETE bookings/{id}` | `200 { success, message: "Booking cancelled" }` — hard delete, seats restored | `404` unknown / already cancelled; `401` no token |

Validation rules: `quantity` integer 1–10 (`"Quantity must be an integer between 1 and 10"`), `customerName` ≥ 2 chars, `customerEmail` valid email, `customerPhone` ≥ 10 chars.

Booking as returned: `id, eventId, userId, customerName, customerEmail, customerPhone, quantity, totalPrice (string!), status ("confirmed"), bookingRef, createdAt, updatedAt, event{...}`.

## Events

`GET events?category&city&search&page&limit` → `{ data: Event[], pagination }`. `GET events/{id}` → `{ data: Event }`.
Event: `id, title, description, category, venue, city, eventDate, price (string!), totalSeats, availableSeats, imageUrl, ...`.
The sandbox account has 3 events (ids differ per account); some have past `eventDate` but are still listed as upcoming and bookable.
