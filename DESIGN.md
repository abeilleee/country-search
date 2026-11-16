# DESIGN.md — Country Search

## 1. Stale Request Cancellation and `debounce` Delay

### 1.1. How cancellation is implemented

Cancellation is implemented at multiple levels so that a stale response cannot update the application state:

1. **Immediate `abort` on every input change** (`src/store/store.ts`, `createCountrySearch().fetchCountries`): on every call to `fetchCountries`, the current controller is aborted first (`controller?.abort(); controller = null;`).
   - If the input is empty, state is reset (`countries: []`, `error: null`, `loading: false`) and no new request is started.
   - If the input is non-empty, a new `AbortController` is created, state switches to loading, and the search is scheduled via `debouncedRun`.
2. **Real network cancellation:** the active controller signal is passed to `runSearch` and then to `countryCache.get(query, current.signal)` → `searchCountries(query, signal)` (`src/core/searchCountries.ts`). Inside `searchCountries`, the caller signal is composed with a timeout using `AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])`, so the `fetch` is aborted both by a new user input and by a timeout.
3. **Protection against late responses at the state level** (`src/store/store.ts`): `isCurrent(current)` ensures that results/errors are applied only if the controller is still active (checked before `setState` on success/error and in `finally` when resetting `loading`). Even if a stale promise settles later, it cannot overwrite newer state.
4. **Correct handling of `AbortError`:** `classifySearchError` (`src/core/classifySearchError.ts`) classifies a `DOMException` with `name === 'AbortError'` as `SearchFailure.Aborted`; `toSearchError` in `src/store/store.ts` returns `null` for aborted requests, so user-initiated cancellations are never shown as UI errors. UI error rendering is limited to real failures (`src/ui/app.ts`, `getViewStatus` / error branch).
5. **In-flight deduplication with isolated caller cancellation** (`src/core/createCountryCache.ts`): for one normalized query, a single shared network request and shared `AbortController` are reused. Each caller gets its own wrapper subscribed to its own `signal`; aborting one caller rejects only that caller, while the shared request is aborted only when `waiters === 0`. This allows promise reuse without breaking other consumers.

**Why this approach instead of a flag/timestamp ("is this response still relevant?"):**

- A flag/timestamp does **not** cancel an already started `fetch`: the stale request keeps consuming network/resources and may resolve later, requiring extra post-filtering that is easy to miss in some branches.
- `AbortController.abort()` actually interrupts the operation (the request is marked canceled/aborted in DevTools and the promise rejects with `AbortError`), removing the race at the transport level.
- Aborting **on every input change** (not only when debounce eventually fires a new request) is important because a request started after a previous debounce tick can still be in flight during the next debounce wait; without immediate abort, its response could be applied under a newer query.
- The combination of `AbortSignal.any` and `isCurrent` covers external cancellation (new input), internal cancellation (timeout), and asynchronous state races.

### 1.2. Rationale for the `debounce` delay

- Current value: **`DEFAULT_DELAY_MS = 300` ms** (`src/constants.ts`), used by `debounce` (`src/core/debounce.ts`) and `createCountrySearch` (`src/store/store.ts`).
- **If debounce is removed (0 ms):** a request would be sent on almost every keystroke/input event. This would significantly increase network/API load, create unnecessary abort/re-render churn, make races more likely, and degrade UX on slow connections or during fast typing.
- **If the delay is too large (e.g. 1000–1500+ ms):** fewer requests are sent, but the UI feels sluggish because results appear long after the user pauses typing, increasing perceived latency.
- **Why 300 ms:** it is a practical trade-off between responsiveness and request reduction — it coalesces rapid sequential input into a single request while still showing results shortly after a typing pause. The value is configurable via the `delay` parameter in `debounce` / `createCountrySearch`.

## 2. Complexity (Big O)

### 2.1. `mapCountryResponse`

File: `src/core/mapCountryResponse.ts`, function `mapCountryResponse(raw)`.

- The function maps a fixed set of scalar/flat fields (`name`, `region`, `capital`, `population`, `area`, `flags` normalization) in **O(1)** and processes collections linearly:
  - `(raw.languages ?? []).map(toLanguage)` — **O(L)**,
  - `(raw.currencies ?? []).map(toCurrency)` — **O(C)**,
  - `[...(raw.borders ?? [])]` — **O(B)**,
    where `L` is the number of languages, `C` the number of currencies, and `B` the number of borders for a country.
- **Overall time complexity:** **O(L + C + B)**, i.e. **O(n)** with respect to the total number of elements in the processed arrays of a single country.
- **Space complexity:** **O(L + C + B)** for the newly created normalized object and copied arrays/objects (input is not mutated and references are not reused).

### 2.2. Cache and in-flight deduplication (bonus)

File: `src/core/createCountryCache.ts`, `createCountryCache()` / `countryCache.get(query, signal)`.

- **Key normalization** `normalize(query)` (`trim().toLowerCase()`): **O(m)** time and **O(m)** space, where `m` is the query length.
- **Cache hit:** `Map` lookup (`cache.get(key)`) is **O(1)** on average (amortized hash table access), returning a resolved promise is **O(1)**. Total: **O(m)** due to normalization.
- **In-flight deduplication (existing `pending` request):** `pending.get(key)` is **O(1)** on average; `attachCaller` adds a listener/counter in **O(1)** per caller. Total: **O(m)** plus per-caller subscription overhead; **no new network request** is created.
- **Cache miss (new request):** creates an `AbortController`, starts `searchCountries`, and maps the response. Runtime is dominated by network I/O and response processing — **O(Σ(Li + Ci + Bi))** over returned countries (via `mapCountryResponse` per item). Space is **O(S)** for the stored result/promise, where `S` is the total size of cached response data.
- **Storage structures:** `cache: Map<string, Country[]>` and `pending: Map<string, PendingRequest>` use **O(K + S)** memory overall, where `K` is the number of unique keys/pending entries and `S` is the size of stored results.

## 3. Clean Code Principles

### 3.1. Single Responsibility and separation of concerns

- **`src/core/debounce.ts`** — only delays function execution and resets the timer.
- **`src/core/searchCountries.ts`** — only performs the API request, composes input/timeout signals, checks `response.ok`, and applies 404/`HttpError` semantics.
- **`src/core/mapCountryResponse.ts`** — only transforms raw API DTOs into the UI/view model.
- **`src/core/classifySearchError.ts`** and **`src/core/HttpError.ts`** — isolate error representation/classification from transport and UI code.
- **`src/core/createCountryCache.ts`** — handles response caching and in-flight request deduplication.
- **`src/core/searchHistory.ts`** — manages search history and persistence.
- **`src/store/store.ts`** — the single place for search state management (loading/error/results, request relevance, debounce orchestration). UI (`src/ui/app.ts`, `src/ui/components/*`) is responsible for rendering and reacts to store updates.

### 3.2. DRY (Don't Repeat Yourself)

- Shared constants and enums are centralized in **`src/constants.ts`**: `BASE_URL`, `Endpoint`, `TIMEOUT_MS`, `DEFAULT_DELAY_MS`, `HttpStatus`, `SearchFailure`, and history key/limit — reused across core/store/ui instead of magic values.
- HTTP failure construction and interpretation are centralized in **`HttpError`** / **`searchCountries`** and **`classifySearchError`** (consumed by the store), avoiding duplicated error-handling branches.

### 3.3. KISS (Keep It Simple)

- **`src/store/store.ts`** implements state with a simple closure, plain state object, and a `Set` of listeners (`getState`, `subscribe`, `fetchCountries`) without external state-management libraries.
- **`src/core/debounce.ts`** is a minimal `setTimeout`/`clearTimeout` implementation with no third-party utilities.
- Caching is built on standard `Map` and Promises (`src/core/createCountryCache.ts`) with an explicit waiter count instead of additional infrastructure.

### 3.4. Pure functions, immutability, and isolated side effects

- **`src/core/mapCountryResponse.ts`** is a pure, DOM/network-free function; it creates new objects/arrays (`map`, copied `borders`, new `flags/languages/currencies`) and does not mutate the input (covered by tests).
- **`src/core/debounce.ts`** and **`src/core/classifySearchError.ts`** are deterministic and side-effect free with respect to application state.

### 3.5. Testability and explicit contracts

- DOM-free core modules are unit-tested with Vitest using `fetch` mocks and fake timers: **`src/tests/debounce.test.ts`**, **`src/tests/searchCountries.test.ts`**, **`src/tests/mapCountryResponse.test.ts`**, **`src/tests/classifySearchError.test.ts`**, **`src/tests/createCountryCache.test.ts`**, **`src/tests/createCountrySearch.test.ts`**.
- Factories such as `createCountryCache()` and `createCountrySearch(delay)` enable isolated instances in tests; environment dependencies (`fetch`, timers, `AbortController`/`AbortSignal`) are controlled via mocks/stubs, making race, cancellation, and timeout scenarios easy to verify.
- Public functions document their contracts with JSDoc (parameters, behavior, error/result semantics), e.g. **`searchCountries`** in `src/core/searchCountries.ts`, **`debounce`** in `src/core/debounce.ts`, **`mapCountryResponse`** in `src/core/mapCountryResponse.ts`, **`createSearchHistory`** in `src/core/searchHistory.ts`.

### 3.6. Type safety and predictable behavior

- The project is written in TypeScript with strict compiler settings (**`tsconfig.json`**: `strict`, `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, etc.), and DTO/view-model types are used across core and UI (`src/types.ts`, `Country` / `mapCountryResponse`).
- Errors are handled explicitly by category (`AbortError` / `TimeoutError` / `HttpError` / network `TypeError` / unknown) via **`classifySearchError`** and controlled branches in **`src/store/store.ts`**, ensuring real failures are surfaced while cancellations are not.

### 3.7. Formatting and consistency

- **ESLint, Prettier, and Stylelint** are configured and exposed via scripts (`lint`, `format`, `test`) in **`package.json`** to keep code style consistent.
- **Husky + lint-staged** (`.husky/pre-commit`, `package.json` → `lint-staged`) run linters/formatters on staged files before commit; **pre-push** runs `npm test` (`.husky/pre-push`) to block pushing with failing tests.
- Consistent editor/project conventions are supported by configuration files such as **`.editorconfig`**, **`.gitattributes`**, **`eslint.config.js`**, **`.prettierrc`**, and **`stylelint.config.mjs`**.
