# /automate — Test Automation Command (lite)

Turn a requirement or flow into a verified Playwright test, then open a PR.

## Usage

```
/automate <requirement, user story, or flow description>
```

The command owns both human gates. Agents never ask the user anything.

## Gate 1 — Questionnaire (ALWAYS ask)

`AskUserQuestion` on every run, in one call. Never infer the answers from the text and skip the question.

1. **Layer** — `web` (UI through the browser) or `api` (HTTP only).
2. **Coverage** — `happy path` or `happy path + negatives`.
3. **Target** — `new spec file` or `extend an existing spec` (offer the closest existing files).

The answers are the only source of truth for the run; pass them to every agent explicitly.

## Preflight

Stop with a specific message if any check fails.

| Check | Condition |
|---|---|
| Dependencies | `node_modules/` exists (else tell the user to run `npm ci`) |
| Credentials | `.env` exists — check existence only, never read it |
| Playwright MCP | enabled, for `web` only |
| GitHub MCP | enabled, needed at Gate 2 |

## Run

1. **Restate** the requirement as numbered steps with expected results. Unclear or missing → ask the user; never invent steps.
2. **Explore:** `Agent(subagent_type="explorer", prompt="layer: <web|api>\nsteps: <numbered steps>")` → manifest.
3. **Write:** `Agent(subagent_type="test-writer", prompt="layer / coverage / target / steps / manifest")` → files.
4. **Verify:** `Agent(subagent_type="verifier", prompt="layer / steps / files / spec path")` → PASS or FAIL.
5. FAIL → send the verdict back to `test-writer` (or `explorer` if the cause is a locator or contract), then re-verify. **Max 2 cycles**, then stop and report.

## Gate 2 — PR

Show the user: the restated steps, every created/changed file, the verify verdict including the **live run**, and any warnings.

- Live run not PASS → **no PR**. Report the failure and the `test-results/` path.
- PASS → `AskUserQuestion`: create the PR, or leave the files on disk?

**On approval only:**
1. Branch `feat/<short-slug>` from an up-to-date `main`; commit only the generated files.
2. Push and open the PR with the GitHub MCP — title `test: <summary>`, body = steps, files, verify results.
3. Add anything new the explorer learned (screens, locators, endpoint behaviour, defects) to `.claude/domain/` following `.claude/domain/INDEX.md`.

## Final report

Layer · coverage · files (new vs reused) · live run PASS/FAIL · PR URL (or why not) · domain files updated.
