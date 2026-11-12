---
name: test-case-structure
description: "How a booking test is laid out here (arrange via API, act on the layer under test, assert, automatic cleanup), which layer verifies which AC, and fixture selection. Use when planning what a new test should contain."
---

# Skill: Test Case Structure

## Core Principle

Every test is independent: it finds an event, creates the data it needs (through the API when that data is not what is under test), acts on the screen or endpoint under test, verifies, and leaves nothing behind. No test reads data saved by another test.

This differs from ADGM, where approval phases are chained through `applications.json`. EventHub's booking flow has no multi-user approval, so chaining would only add ordering coupling.

## Anatomy

```
Arrange   eventsApi.findBookableEvent(min)      (+ bookingsApi.createBooking(...) if the booking is a precondition)
Act       page object / API client calls that represent the user action
Assert    page verify* methods, or status + body checks
Clean     automatic (fixture teardown) — register UI-created bookings with trackByRef
```

## Which layer verifies what

| AC | UI test | API test |
|---|---|---|
| AC1 confirmation + reference | `001-book-tickets` | `001-create-booking` (201, `bookingRef`) |
| AC2 total = price × qty | summary + confirmation | `totalPrice` |
| AC3 appears in My Bookings | `002-my-bookings` | list / by id / by ref |
| AC4 cancel | `002-my-bookings` (dialog) | `003-cancel-booking` |
| AC5 API | — | `001`, `002` (negative), `004` (contract) |

## Fixture selection

Request only what you use: `eventsApi` for event lookup, `bookingsApi` for setup/verification/cleanup, the page objects for the screen under test, `anonymousApi` for 401 checks.
