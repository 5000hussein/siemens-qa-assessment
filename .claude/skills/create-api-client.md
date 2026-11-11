# Skill: Create a New API Client

## When to Use

Testing or using an endpoint group that has no client yet (e.g. `/events` writes, `/config`).

## Steps

### 1. Check the contract

`npm run api:spec` to refresh, then read `.claude/knowledge/api/endpoints.md` and the path in `openapi.json`. Note any doc-vs-reality differences in `known-issues.md`.

### 2. Create `src/api/<Name>Api.ts`

```ts
import type { APIResponse } from '@playwright/test';
import { BaseApi } from './BaseApi';

export class NameApi extends BaseApi {
  // Raw call: returns the response so negative tests can assert status/body
  async get(id: number): Promise<APIResponse> {
    return this.request.get(`things/${id}`);
  }

  // Convenience call: throws on non-2xx, returns typed data for setup steps
  async getThing(id: number): Promise<Thing> {
    const response = await this.get(id);
    if (!response.ok()) throw new Error(`GET things/${id} failed: ${response.status()}`);
    return (await response.json()).data;
  }
}
```

- Paths are relative (no leading `/`) — `apiBaseUrl` ends with `/api/`.
- Never set auth headers here; the fixture's request context already has them.
- Anything the client creates on the shared environment must be tracked and removed in a `cleanup()` (see `BookingsApi`), and `cleanup()` must be called from the `api` fixture teardown.
- Types go in `src/api/types.ts`; type fields as the API actually returns them (comment when it differs from the docs).

### 3. Register

`src/factories/ApiFactory.ts`: private field + `getNameApi()`. Optionally a shortcut fixture in `src/core/baseTest.ts` (`nameApi: async ({ api }, use) => use(api.getNameApi())`).

### 4. Test data

Request bodies come from JSON (`src/data/test_data/*.json`) or a builder in `src/data/builders/`.
