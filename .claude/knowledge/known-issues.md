# Known issues & story gaps (observed 2026-11-11)

Before asserting on something that looks wrong, check here. Each item is also in the README story review.
`[test]` = covered by a `test.fail()` in `src/tests/api/bookings/004-contract-vs-docs.spec.ts`.

## App / API vs documentation
1. `[test]` **bookingRef format** — docs: `EVT-XXXXXX`; actual: first letter of the event title + `-` + 6 chars (`D-0VYXU6`, `H-H8L871`). Tests use `bookingRefPattern` (`/^[A-Z0-9]+-[A-Z0-9]{6}$/`).
2. `[test]` **Number types** — `totalPrice` and event `price` are documented as numbers, returned as strings (`"900"`). Tests compare with `Number(...)`.
3. **Cancel is a hard delete** — `DELETE /bookings/{id}` removes the booking (`GET` → 404) although the schema has `status: confirmed | cancelled` and `GET /bookings?status=cancelled` exists. No cancelled booking can ever be listed.
4. **"List all bookings"** — docs say all bookings; actual list is scoped to the signed-in account (correct behaviour, wrong docs).
5. **Past events are "Upcoming" and bookable** — sandbox events dated Jul/Oct 2026 are listed under "Upcoming Events" and accept bookings on 2026-11-11.
6. **Featured event seats** — booking the featured "Hollywood Monsoon Night" did not reduce `availableSeats` (2287 before and after a 2-ticket booking), while "Dilli Diwali Mela" did (390 → 387). Seat tests therefore pick the first event with enough seats; the featured behaviour needs a PO answer.
7. **Phone rule mismatch** — UI says "Enter a valid 10-digit phone", API only requires ≥ 10 characters (`+91 98765 43210` passes both).

## Story (US-114) gaps
- "As a **visitor**" — booking requires a signed-in account.
- AC1 says nothing about field rules (name ≥ 2, email format, phone 10 digits), the 1–10 ticket limit or sold-out events.
- AC2 has no currency, rounding, tax/fee or discount rules.
- AC3 does not say what is shown in My Bookings (fields, order, pagination).
- AC4 does not say who can cancel, until when (event date / refunds — there is a "Check eligibility for refund?" button), whether seats are released, or whether the booking disappears or is marked cancelled.
- AC5 does not define the response contract, auth, or error codes.
