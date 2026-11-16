# Country Search 🌎

Live country search app powered by the public [countries.dev](https://countries.dev) API (in Russia use vpn).
Type a query and the app fetches matching countries with debouncing, request cancellation, timeout handling, and in-memory caching.

## Features

- **Live search** with debounce (`300ms`) to avoid firing a request on every keystroke
- **Stale-request protection** via `AbortController` — previous request is aborted on each input change
- **Timeout handling** (`5s`) using `AbortSignal.timeout`, distinguished from user-initiated aborts
- **Robust error handling**
  - `404` from API is treated as _no matches_ (not an error)
  - network/HTTP/timeout errors are surfaced with a **Retry** action
  - `AbortError` is never shown to the user
- **Response caching & in-flight deduplication** by normalized query
  - repeated identical query returns cached result (no extra network call)
  - concurrent/rapid identical requests share the same in-flight promise
  - cancelling one consumer does not break the shared in-flight request for others
- **Search history** (last 5 queries) persisted in `localStorage`
- **Country details view** (flag, capital, region, population, area, languages, currencies, borders, etc.)
- **UI states:** idle, loading, results, empty, error

## Tech Stack

- **TypeScript** (strict)
- **Vite** (dev/build tooling)
- **Vitest** (unit tests, fake timers, `fetch` mocking)
- **ESLint**, **Prettier**, **Stylelint**
- **Husky** + **lint-staged** (pre-commit formatting/linting, pre-push runs tests)

## Install & Run

1. Clone the repository:

   ```bash
     git clone https://github.com/abeilleee/country-search.git
     cd country-search
   ```

2. Install dependencies:

   ```bash
     npm install
   ```

3. Start the local development server (with Hot Module Replacement):

   ```bash
     npm run dev
   ```

## How It Works

- **`debounce(fn, delay)`** — custom higher-order function that delays execution and resets on subsequent calls.
- **`searchCountries(query, signal)`** — wraps `fetch` to `GET /name/{query}`
  - composes caller signal with timeout via `AbortSignal.any`
  - returns `[]` on `404` (no matches)
  - throws `HttpError` for other non-OK responses
  - propagates `AbortError` / `TimeoutError` / network errors for upstream classification
- **`mapCountryResponse(raw)`** — pure mapper from API DTO to view model (testable without network/DOM)
- **`classifySearchError` + `HttpError`** — distinguishes abort, timeout, HTTP, network, and unknown failures
- **`createCountryCache()`** — in-memory cache and in-flight request deduplication (`countryCache` singleton used by the store)
  - cache key: normalized query (`trim().toLowerCase()`)
  - cached hit → resolved immediately (no extra network request)
  - in-flight hit → reuses the same shared request/promise
  - each caller subscribes with its own `AbortSignal`; aborting one caller does not cancel others
  - shared request is aborted only when the last waiter cancels; successful results are cached and mapped once

## CI/CD & Deployment

The project is automatically deployed to GitHub Pages using GitHub Actions.

- Automatic Deployment: Every push to the country-search branch triggers the workflow to build the project and deploy the dist folder to the gh-pages branch.
- Manual Deployment: You can use script `npm run deploy`.

The live version is available at: [Play the game](https://abeilleee.github.io/country-search/)

## Project Structure

```text
src/
  core/        # DOM-free logic: debounce, fetch, mapping, errors, cache, history
  store/       # App state + search orchestration
  ui/          # Components and rendering
  helpers/     # Small utilities
  tests/       # Vitest suites and fixtures
  constants.ts # Shared constants/enums (API, timeouts, statuses)
```

## Scripts

| Script            | Description                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start Vite dev server                      |
| `npm run build`   | Type-check and build (`tsc && vite build`) |
| `npm run preview` | Preview production build                   |
| `npm test`        | Run tests (Vitest)                         |
| `npm run lint`    | Run ESLint                                 |
| `npm run format`  | Format with Prettier                       |
| `npm run deploy`  | Deploy `dist` to GitHub Pages              |

## Testing

Run all tests:

```bash
npm test
```

The suite covers (among others):

- `debounce` behavior
- `searchCountries` (URL/signals, 404 semantics, `HttpError`, abort/timeout propagation)
- `mapCountryResponse` mapping
- error classification (`AbortError` / `TimeoutError` / `HttpError` / network / unknown)
- race-condition handling in search flow (latest response wins, stale request aborted)
- `createCountryCache` (cache hits, normalized keys, in-flight deduplication, caller-cancel isolation, shared abort on last waiter)
