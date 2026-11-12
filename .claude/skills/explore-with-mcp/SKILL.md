---
name: explore-with-mcp
description: "Map an EventHub screen or API call with the Playwright MCP before automating it, then record locators and quirks in .claude/knowledge/. Use before writing a page object for an unmapped screen or when a locator broke."
---

# Skill: Explore a Screen with the Playwright MCP

## When to Use

Before automating a screen or endpoint that is not yet described in `.claude/knowledge/`.

## Setup

`.mcp.json` registers `playwright` (`@playwright/mcp`). `npm run mcp:setup` pre-downloads it and lists servers. The MCP browser is separate from the test browser and starts signed out.

## Steps

1. `browser_navigate` to `https://eventhub.rahulshettyacademy.com/login`.
2. Ask the user to sign in in the MCP browser window (agents must not type the account password), or work on public screens only.
3. `browser_navigate` to the target screen, then `browser_snapshot` — the accessibility tree gives role + name for role-based locators.
4. Look for `data-testid` / `id` attributes with `browser_evaluate` if roles are ambiguous.
5. Trigger the interaction (`browser_click`, `browser_fill_form`) and snapshot again for the resulting state (dialogs, confirmations, validation messages).
6. `browser_network_requests` to see which API calls the screen makes — that tells you what the API layer can set up or verify.
7. Record findings:
   - locators and texts → `.claude/knowledge/ui-map.md`
   - anything that contradicts the story or the API docs → `.claude/knowledge/known-issues.md`
8. Clean up any booking you created while exploring (cancel it in the UI or via `DELETE /bookings/{id}`).

## Rules

- Exploration is read-mostly: no "Clear all bookings", no admin event edits on the shared account.
- Never paste tokens or passwords into knowledge files.
