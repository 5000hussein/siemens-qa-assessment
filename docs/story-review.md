# US-114 "Book tickets for an event": story review and coverage

> As a visitor to EventHub, I want to book tickets for an event, so that I can attend it.
>
> - **AC1:** When I choose the number of tickets, enter my name, email and phone, and click Confirm Booking, my booking is created and I see a confirmation with a booking reference.
> - **AC2:** The total price is the ticket price multiplied by the number of tickets.
> - **AC3:** The booking appears in My Bookings.
> - **AC4:** I can cancel a booking.
> - **AC5:** The same works through the API using `POST /api/bookings`.

[Back to the README](../README.md)

---

## 1. What is missing or unclear: questions for the Product Owner

| # | Area | Question |
|---|---|---|
| Q1 | Actor | The story says "As a **visitor**", but booking requires a signed-in account. Is guest checkout intended, or should the story say "registered user"? |
| Q2 | AC1 inputs | What are the field rules? The app enforces name ≥ 2 characters, a valid email, and a "10-digit" phone (UI) but only ≥ 10 characters (API). Which is correct, and are international formats allowed? |
| Q3 | AC1 quantity | The app limits a booking to 1–10 tickets. Is 10 the business rule? Per booking, per user or per event? |
| Q4 | AC1 availability | What happens when an event has fewer seats than requested, or is sold out? Should the UI cap the counter at the available seats? |
| Q5 | AC1 reference | What is the booking-reference format, and is it guaranteed unique? (See D1.) Is a confirmation email expected? |
| Q6 | AC2 price | Which currency? Any taxes, booking fees, discounts or rounding? Should the total be shown before confirming? (It is.) |
| Q7 | AC3 My Bookings | Which fields must be shown, in what order, with what pagination? Should cancelled bookings still appear, marked "cancelled"? |
| Q8 | AC4 cancel | Who can cancel, and until when (the event date? a cut-off)? Are refunds part of this story? (There is a "Check eligibility for refund?" button.) Are seats released? Should cancelling need confirmation? (There is a dialog.) |
| Q9 | AC4 outcome | Should a cancelled booking be **deleted** or **marked cancelled**? (See D3.) |
| Q10 | AC5 API | What is the response contract, which errors are expected (400/401/404/409), and must the API apply the same rules as the UI? |
| Q11 | Events | Can past events be booked? (See D5.) |
| Q12 | Non-functional | Concurrency (two users taking the last seats), accessibility, mobile and performance targets? |

## 2. Where the application differs from the story or the docs

| # | Observation | Where | Evidence in this repo |
|---|---|---|---|
| D1 | **Booking reference format:** the docs say `EVT-XXXXXX`; the API returns the first letter of the event title plus 6 characters (`D-0VYXU6`). | API docs vs API | `004-contract-vs-docs.spec.ts` (`test.fail`) |
| D2 | **Number types:** `totalPrice` and `price` are documented as numbers but returned as strings (`"900"`). A client that computes `price * quantity` on strings risks errors. | API docs vs API | `004-contract-vs-docs.spec.ts` (`test.fail`) |
| D3 | **Cancel is a hard delete:** `DELETE /bookings/{id}` removes the record (a later `GET` returns 404), yet the schema has `status: cancelled` and the list has a `status=cancelled` filter that can never return anything. | API docs vs API | `003-cancel-booking.spec.ts` |
| D4 | **"List all bookings"** returns only the signed-in user's bookings. The behaviour is right; the docs are wrong. | API docs | none |
| D5 | **Past events are listed as "Upcoming" and can be booked:** events dated July and October 2026 appear under "Upcoming Events" and accept bookings in November 2026. | UI | manual check |
| D6 | **The phone rule differs:** the UI says "Enter a valid 10-digit phone"; the API only requires `minLength 10` on a free-text string. | UI vs API | manual check (the API test's invalid phone `123` breaks both rules, so it doesn't show the difference) |
| D7 | **No feedback after cancelling:** the card disappears without a message or toast. | UI | none |

**Assumptions made to keep going:** a signed-in user counts as a "visitor"; the observed reference format is acceptable; "cancel" means the booking disappears from My Bookings and its seats are released; the 1–10 ticket limit is intended.

## 3. What is covered and why

25 tests: 1 setup, 6 UI, 18 API (2 of them known-defect checks).

| AC | UI | API |
|---|---|---|
| AC1 booking, confirmation, reference | Full flow from the events list, reference format checked | 201 response shape and reference format |
| AC1 negative | Invalid name, email and phone show messages and create no booking | 400 for quantity 0 and 11, short name, bad email, short phone, empty body; 404 unknown event; 401 no token |
| AC2 price × quantity | Summary at 1, 3 and 10 tickets, plus the confirmation total | `totalPrice` for 3 and 10 tickets |
| AC3 in My Bookings | The card shows ref, event, quantity, total and status; View Details shows ref, status, event, customer and payment summary | Read back by id, by reference and from the list |
| AC4 cancel | Cancel through the dialog; gone after a reload; backend returns 404; seats restored | 200 then 404; seats restored; cancel twice returns 404; unknown id returns 404; no token returns 401 and the booking survives |
| AC5 via API | n/a | All of the above, plus available seats drop by the booked quantity |

**Why this split:** UI tests cover what only the UI can prove: the user journey, what is on screen and the client-side validation. Rules and edge cases (limits, invalid input, auth, error codes, seat arithmetic) are cheaper and more stable through the API, so most combinations live there. Each AC has at least one positive UI test and one positive API test, and negative cases sit on the boundaries the app enforces (0, 1, 10 and 11 tickets).

**Not covered, on purpose:**
- registration, which is outside US-114
- admin event management, which changes shared data
- the refund check, which is not in the ACs
- visual and cross-browser checks
