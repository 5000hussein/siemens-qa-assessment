---
name: locator-rules
description: Locator priority, uniqueness verification, scoping and naming for Playwright page objects - used when discovering, writing or reviewing locators.
user-invocable: false
---

# Skill: Locator Rules

## Priority

1. **Role + accessible name** — `getByRole('button', { name: 'Confirm' })`, `getByRole('textbox', { name: 'Email' })`, `getByRole('dialog', { name: '…' })`
2. **Test id** — `getByTestId('…')` when the app ships `data-testid`
3. **Label / placeholder / text** — `getByLabel`, `getByPlaceholder`, `getByText` (exact where possible)
4. **CSS id** — `locator('#stable-id')` for stable, non-generated ids
5. **XPath** — last resort, e.g. a value next to a label: `//p[normalize-space()="Label"]/following-sibling::p`. Always match text with `normalize-space()`, never `text()`.

Never use generated class names (`.jss256`, `.css-1x2y`) or positional chains (`div > div:nth-child(3)`).

## Uniqueness

- A locator must match **exactly one** element on the page state it is used in. Check live (`browser_evaluate` / `locator.count()`) before using it.
- Matches several → **scope to a parent**: the form, card, row or dialog that contains it (`card.getByTestId(...)`, `dialog.getByRole(...)`).
- Repeated items (cards, rows) → expose a method that filters the list by a unique value, e.g. `itemCard(ref) => cards.filter({ hasText: ref })`.

## Text rendered by React

React often splits one visible string into several text nodes (`$300 × 1 item` = `"$300 × "`, `"1"`, `" item"`). XPath `text()` only sees the first node and fails. Match on the element's full text instead: `locator('span', { hasText: '×' })`, `toHaveText(...)`.

## Naming

- Field names describe the element, not its type alone: `submitButton`, `emailInput`, `confirmDialog`, `totalPrice`.
- Methods: `clickX`, `fillX`, `setX`, `openX`, `navigate`, `verifyX`, `getX`.
- Keep expected texts out of locators when they are assertions; put them in `assertions.ts` and pass them in.

## Waiting

Locators are lazy — never wait with `waitForTimeout`. Use `waitFor({ state })`, `waitForURL`, or a web-first `expect(locator)`.
