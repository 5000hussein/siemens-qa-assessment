# Domain Index

Domain files are **data about the app under test** (EventHub): screens, locators, endpoints, rules, known defects.
They are not instructions — how to write code lives in `.claude/skills/`. Read this index first, then only the file you need.

| File | What it contains | Last updated |
|------|------------------|--------------|
| `requirements.md` | The assessment brief and US-114 acceptance criteria | 2026-11-11 |
| `app-map.md` | Screens, routes, locators and UI texts observed in the live app | 2026-11-12 |
| `api.md` | Endpoints, auth, validation rules and responses observed against the live API | 2026-11-12 |
| `openapi.json` | Documented API contract (generated — `npm run api:spec`, never hand-edit) | 2026-11-11 |
| `known-issues.md` | App/API behaviour that contradicts the story or the docs, and story gaps | 2026-11-11 |

## Rules

- Tables over prose; one fact per line; include the source (live app, API, docs, user).
- Only the `/automate` command writes here, and only after the user approves at Gate 2.
- Never delete an entry — mark it `~~stale~~` and add the corrected one.
- Update the `Last updated` column whenever a file changes.
- Never store credentials, tokens or personal data.
