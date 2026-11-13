# Assessment brief (source: QA-Practical-Assessment.pdf)

- App: EventHub, web UI + REST API. Web: https://eventhub.rahulshettyacademy.com
- Shared public env: register own accounts, clean up created data.
- Flow: booking tickets for an event.

## US-114: Book tickets for an event
As a visitor to EventHub, I want to book tickets for an event, so that I can attend it.

- AC1 — Choose number of tickets, enter name, email, phone, click Confirm Booking → booking created, confirmation with booking reference shown.
- AC2 — Total price = ticket price × number of tickets.
- AC3 — Booking appears in My Bookings.
- AC4 — I can cancel a booking.
- AC5 — Same works through the API using POST /api/bookings.

## Deliverables
1. Story review (in `docs/story-review.md`, linked from the README): missing/unclear/wrong items, questions for PO, app vs story/docs mismatches.
2. UI + API automation. Architecture matters most; must scale for a team over years.
   Authorization handled by the framework, not by individual tests.
3. Explain test count/coverage choices.
4. Bonus (deferred): GitHub Actions on every push.
5. README: how to run, story review, key decisions, what you'd do with more time. Provide credentials.
