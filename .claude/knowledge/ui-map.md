# EventHub UI map (observed 2026-11-11)

Base: `https://eventhub.rahulshettyacademy.com` (Next.js). Every route except `/login` and `/register` redirects to `/login` when signed out.
Session: JWT in `localStorage['eventhub_token']` (no cookies) — captured by Playwright storage state.

## Header (all signed-in pages) → `CommonPage`
| Element | Locator |
|---|---|
| Home / Events / My Bookings links | `getByTestId('nav-home' / 'nav-events' / 'nav-bookings')` |
| Signed-in email | `getByTestId('user-email-display')` |
| Logout | `getByTestId('logout-btn')` |
| Admin menu | `getByRole('button', { name: 'Admin' })` (not automated) |

## `/login` → `LoginPage`
Email `getByRole('textbox', { name: 'Email' })`, Password `getByRole('textbox', { name: 'Password' })`, `getByRole('button', { name: 'Sign In' })`. Inline errors: "Enter a valid email", "Password must be at least 6 characters". Success → `/`.

## `/events` → `EventsPage`
Heading "Upcoming Events" (h1). Search textbox "Search events, venues…", category and city comboboxes. Each event is an `article` with an h3 title link, date, venue, price (`$2,500`), seats text ("390 seats available" / "8 seats left!") and a "Book Now" link to `/events/{id}`.

## `/events/{id}` → `EventDetailsPage`
- Info: h1 title; label/value pairs as `<p>` siblings — "Price per ticket" → `$300`, "Available" → `390 / 10000 seats`.
- Booking form (`form` containing "Confirm Booking", `novalidate`):
  - Ticket count `#ticket-count` (starts at 1), buttons "−" (disabled at 1) and "+" (disabled at 10), text "(max 10)".
  - Full Name `#customerName` / role textbox "Full Name*"; Email `#customer-email` (`data-testid="customer-email"`); Phone `#phone` (type tel).
  - Summary: `<span>$300 × 1 ticket</span><span>$300</span>` then `<span>Total</span><span>$300</span>`. React splits the first span into several text nodes — match with `locator('span', { hasText: '×' })`, not XPath `text()`.
  - Confirm `#confirm-booking` / role button "Confirm Booking" (disabled while submitting).
  - Client validation (no request sent): "Name must be at least 2 chars", "Enter a valid email", "Enter a valid 10-digit phone".
- Confirmation (same URL, replaces form): h3 "Booking Confirmed! 🎉", "Your tickets are reserved.", text `Booking Ref D-0VYXU6 Customer <name> Tickets <n> Total $<total>`, links "View My Bookings" and "Browse More Events".

## `/bookings` → `MyBookingsPage`
- h1 "My Bookings", button "Clear all bookings" (**never use in tests**).
- Card `getByTestId('booking-card')`: `<ref> confirmed #<id>`, h3 event title, `🎫 <n> tickets`, total `$<amount>`, link "View Details" (`/bookings/{id}`), `getByTestId('cancel-booking-btn')`.
- Empty state: h3 "No bookings yet".
- Cancel opens `role=dialog` "Cancel this booking?" with text "This will cancel <ref> and release <n> seat(s) back to the event. This action cannot be undone." and buttons "Cancel" / "Yes, cancel it". On confirm the card disappears (no toast).

## `/bookings/{id}` (not automated yet)
Breadcrumb `<ref>`, status, Cancel Booking, sections Event Details, Customer Details, Payment Summary (Tickets, Price per ticket, Total Paid), Refund (`getByTestId('check-refund-btn')` "Check eligibility for refund?"), Booking Information.
