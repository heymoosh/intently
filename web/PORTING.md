# `web/PORTING.md` — `app/lib/` functional inventory

**Generated:** 2026-04-25 by overnight build loop iteration 1 (analysis-only).
**Source branch:** `auto/build-loop/2026-04-25-01-app-lib-inventory`.
**Purpose:** Saturday's wiring port executes against this inventory. Each row below becomes one port task: decide whether to lift the file as-is into `web/`, route it through a server-side shim, or skip it.

## How to read this doc

- **Web-portability rating** is the headline judgment for each function:
  - `mechanical` — pure JS / browser-safe. Copy file or contents into `web/` (or import directly), no behavioral change.
  - `light-touch` — drop a few RN-specific imports or env-var prefixes; behavior preserved.
  - `judgment` — needs a rewrite or a different host (Edge Function vs browser). Behavior may change. Saturday session decides shape.
  - `throwaway` — already covered by the prototype's JSX, or unused in the web target. Do not port.
- **Caller path** is "where this is called from inside `app/` today." Tells you whether the port target needs to be a hook, a util, or a server shim.
- **Files this doc covers (12 source files, 0 utils dir, 0 hooks dir):**
  - `app/lib/agent-output.ts`
  - `app/lib/agent-runner.ts`
  - `app/lib/journal-editor.ts`
  - `app/lib/ma-client.ts`
  - `app/lib/reminders.ts`
  - `app/lib/skill-loader.ts`
  - `app/lib/supabase.ts`
  - `app/lib/tokens.ts`
  - `app/lib/tools.ts`
  - `app/lib/voice.ts`
  - `app/lib/render/daily-brief-context.ts`
  - `app/lib/render/README.md` (doc only, not code)

`app/utils/` and `app/hooks/` do not exist — `useVoiceInput` lives in `app/lib/voice.ts` instead of a hooks dir.

## Dependency map (read this before walking the table)

The lib forms three bands by audience:

1. **Browser-runtime band** — called from React components today. These are the `mechanical` / `light-touch` ports, lifted into `web/` directly:
   - `agent-output.ts` (consumed by `AgentOutputCard.tsx`)
   - `journal-editor.ts` (consumed by `JournalEditor.tsx`)
   - `ma-client.ts` (consumed by `App.tsx` — primary agent invocation path for the web target)
   - `reminders.ts` (consumed by `App.tsx`)
   - `supabase.ts` (consumed by `App.tsx`)
   - `voice.ts` (consumed by `VoiceModal.tsx`)
   - `tokens.ts` (consumed by 8+ components — design token constants)

2. **Server-runtime band** — files written for Node, not the browser. **Not currently called from `app/` runtime code at all.** The web target reaches them through `ma-proxy` (Supabase Edge Function) instead of importing them directly. These are `judgment` / out-of-scope-for-iter-3-wiring:
   - `agent-runner.ts` (uses `@anthropic-ai/sdk`, `process.env.ANTHROPIC_API_KEY`)
   - `skill-loader.ts` (uses `node:fs/promises`)
   - `tools.ts` (mock implementations; consumed by `agent-runner.ts`)
   - `render/daily-brief-context.ts` (consumed by … nobody yet — render target is a future Edge Function or scheduled MA call)

3. **Already replaced** — covered by the prototype's `web/intently-tokens.jsx` or otherwise duplicated:
   - `tokens.ts` (RN-shape mirror of the prototype's design tokens; see throwaway analysis below)

## OPEN QUESTIONS (for Saturday)

1. **`tokens.ts` vs `web/intently-tokens.jsx`** — which is canonical? `tokens.ts` ships RN-shape elevation (shadow props, `expo-google-fonts` font constants); the prototype's `intently-tokens.jsx` likely uses CSS box-shadow + Google Fonts `<link>`. If the prototype is canonical, `tokens.ts` is throwaway for the web target. Iter 2 should confirm.
2. **`render/daily-brief-context.ts` has no caller in either codebase yet.** The render layer is unwired. Saturday session needs to decide: does the daily-brief MA invocation pass `userId` and let the agent fetch context itself (via `read_calendar` / `read_emails` tools), or does the front-end render the markdown context first and pass it to `ma-proxy` as `input`? `ma-client.ts` accepts `input: string | Record<string, unknown>`, so both paths are open.
3. **`agent-runner.ts` exists but is bypassed by `ma-client.ts` → `ma-proxy` Edge Function.** The Edge Function reimplements the agent loop in Deno. So `agent-runner.ts` is dormant. Confirm Saturday: is it kept around as a Node-test target (eval harness), or deleted? If kept, where does it run?
4. **`tools.ts` returns hard-coded fixtures.** Real Google Calendar / Gmail wiring is gated on OAuth (TRACKER Next #2). For demo Saturday, the Edge Function will need its own tool implementations on the server side — `tools.ts` is the contract, not the runtime.

---

## File-by-file inventory

### `app/lib/agent-output.ts` — agent output card view-model

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `AgentOutputKind` (type) | `'brief' \| 'journal' \| 'chat' \| 'review'` | Tagged kind for an agent's emitted card. | none | mechanical | `AgentOutputCard.tsx`, `App.tsx`, all 3 fixture files |
| `InputTraceKind` (type) | `'calendar' \| 'journal' \| 'email' \| 'health'` | Source-trace tag rendered as a chip on the card footer. | none | mechanical | `AgentOutputCard.tsx`, fixtures |
| `AgentOutput` (type) | `{ kind, title, body, generatedAt, inputTraces? }` | Complete card payload — markdown body + ISO timestamp + traces. | none | mechanical | `App.tsx`, `ma-client.ts`, `AgentOutputCard.tsx`, fixtures |
| `KindMeta` (type) | `{ label, glyph, tintKey }` | Display metadata for a card kind (label string, emoji glyph, tint token key). | none | mechanical | `AgentOutputCard.tsx` |
| `kindMetaFor` | `(kind: AgentOutputKind) => KindMeta` | Lookup helper returning a static `KIND_META` row for the kind. | none | mechanical | `AgentOutputCard.tsx` |
| `formatGeneratedAt` | `(iso: string, now?: Date) => string` | Renders ISO timestamp as `"Generated 7:32 AM"` (same day) or `"Generated 7:32 AM · Apr 24"` (other days). Falls back to raw string on parse failure. Locale: en-US, 12h clock. | `Date`, `toLocaleString` | mechanical | `AgentOutputCard.tsx` |
| `labelForInputTrace` | `(trace: InputTraceKind) => string` | Maps trace kind to display label (`'calendar' → 'Calendar'`, etc.). Switch on union; exhaustive. | none | mechanical | `AgentOutputCard.tsx` |

**Port shape:** lift the file verbatim into `web/lib/agent-output.js` (or inline into `index.html` if not splitting). Browser-safe; no RN. Drop `.ts` suffix; types become JSDoc or vanish (Babel-standalone strips TS but the prototype is plain JS today).

---

### `app/lib/agent-runner.ts` — Node-side Anthropic SDK agent loop

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `AgentRunnerError` (class) | `extends Error` | Typed error for runner failures. | none | n/a | only `agent-runner.test.ts` |
| `AnthropicClient` (type) | `{ messages: { create(params) => Promise<resp> } }` | Minimal Anthropic SDK shape so tests can mock without importing the SDK. | none | n/a | tests |
| `AgentResponse` (type) | `{ finalText, toolCalls[], stopReason, usage? }` | Result of one `runSkill` call — final assistant text plus per-tool execution log. | none | n/a | tests |
| `RunSkillOptions` (type) | `{ client?, tools?, context?, maxIterations?, model?, skillLoader? }` | Injection points for the runner — all optional, fall back to defaults. | none | n/a | tests |
| `runSkill` | `(skillName, userInput, opts?) => Promise<AgentResponse>` | Tool-use loop driver: load SKILL.md via `skill-loader`, call `client.messages.create`, dispatch `tool_use` blocks to `tools.ts` registry, feed `tool_result` back, iterate until `stop_reason !== 'tool_use'` or `maxIterations` (default 8). Default model `claude-sonnet-4-6`. | dynamic-imported `@anthropic-ai/sdk`, `process.env.ANTHROPIC_API_KEY`, `skill-loader` | **judgment** (server-only) | **NONE in `app/` runtime.** Only `agent-runner.test.ts`. The `ma-proxy` Edge Function reimplements this logic in Deno. |

**Port shape (Saturday):** do **not** ship into the browser bundle — the Anthropic API key would be exposed. Two viable shapes:
1. **Treat as dormant.** Keep the file in `app/lib/` as the unit-test target / spec for the Edge Function's behavior. Web target only ever calls `ma-client.ts` → `ma-proxy`. **Recommended for the demo.**
2. **Lift Deno-side.** Port `runSkill` into `supabase/functions/ma-proxy/` if the Edge Function's existing implementation drifts from the Node version. Out of scope for Saturday's port.

The browser side never sees this module.

---

### `app/lib/journal-editor.ts` — pure state machine for the journal editor

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `EditorMode` (type) | `'edit' \| 'preview'` | Two-mode toggle between markdown editor and rendered preview. | none | mechanical | `JournalEditor.tsx` |
| `EditorState` (type) | `{ mode, content }` | Editor state snapshot. | none | mechanical | `JournalEditor.tsx` |
| `createEditorState` | `(initialContent?: string) => EditorState` | Factory returning `{ mode: 'edit', content: initialContent }`. | none | mechanical | `JournalEditor.tsx` |
| `toggleMode` | `(state: EditorState) => EditorState` | Returns a new state with `mode` flipped. | none | mechanical | `JournalEditor.tsx` |
| `setContent` | `(state, content) => EditorState` | Returns a new state with the supplied content. | none | mechanical | `JournalEditor.tsx` |
| `isEmpty` | `(state) => boolean` | True if content is whitespace-only. | none | mechanical | `JournalEditor.tsx` |

**Port shape:** lift verbatim into `web/lib/journal-editor.js`. Pure functions, zero deps. The prototype's `intently-journal.jsx` already implements an editor visually; this file replaces its inline state with the same reducer the RN component used.

---

### `app/lib/ma-client.ts` — browser → `ma-proxy` Edge Function client

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `MaSkill` (type) | `'daily-brief' \| 'daily-review' \| 'weekly-review' \| 'monthly-review' \| 'update-tracker' \| 'setup'` | Enum of skills the proxy will dispatch. Mirrors `agents/*/SKILL.md` folder names. | none | mechanical | `App.tsx` |
| `MaProxyRequest` (type) | `{ skill, input, sessionId? }` | POST body shape — `input` is `string \| Record<string, unknown>`. | none | mechanical | `App.tsx` |
| `MaProxyResponse` (type) | `{ sessionId, finalText, status }` | Response shape from the proxy. | none | mechanical | `App.tsx` |
| `MaProxyError` (class) | `extends Error` with `status`, `detail` | Typed error for non-2xx proxy responses. | none | mechanical | `App.tsx` |
| `callMaProxy` | `(req: MaProxyRequest) => Promise<MaProxyResponse>` | POSTs JSON to `${SUPABASE_URL}/functions/v1/ma-proxy`, throws `MaProxyError` on failure. Reads `process.env.EXPO_PUBLIC_SUPABASE_URL`. | `fetch`, `process.env.EXPO_PUBLIC_SUPABASE_URL` | **light-touch** (env var rename) | `App.tsx` |
| `toAgentOutput` | `(finalText, meta) => AgentOutput` | Wraps proxy response text as a full `AgentOutput` for `AgentOutputCard`. | `agent-output` types | mechanical | `App.tsx` |

**Port shape:** lift into `web/lib/ma-client.js`. **One required change:** `process.env.EXPO_PUBLIC_SUPABASE_URL` does not exist in plain-React/Babel-standalone. Replace with one of:
- A literal config block (`window.INTENTLY_CONFIG = { supabaseUrl: '...' }` set in `index.html` before the bundle loads).
- A constant baked into the JSX at build time.
- A Vite-style `import.meta.env.VITE_SUPABASE_URL` if Saturday adopts Vite — out of scope per ADR 0004.

The Supabase URL is non-secret (it's the project URL, not a service key), so inlining is safe.

This is the **primary agent invocation path for the web target** — every `daily-brief`, `daily-review`, `weekly-review` button press routes through here. WIRING-POINTS.md will reference this module heavily.

---

### `app/lib/reminders.ts` — fetch + format due reminders for daily-brief context

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `DueReminder` (type) | `{ id, text, remind_on, status }` | Row shape from the `/reminders/due` endpoint. | none | mechanical | `App.tsx` |
| `fetchDueReminders` | `(date?: Date) => Promise<DueReminder[]>` | GETs `${SUPABASE_URL}/functions/v1/reminders/due?date=YYYY-MM-DD`. **Graceful fallback:** returns `[]` on missing URL, network error, or non-2xx — daily-brief still runs without the memory-moment beat. | `fetch`, `process.env.EXPO_PUBLIC_SUPABASE_URL` | **light-touch** (env var rename) | `App.tsx` |
| `formatRemindersForInput` | `(reminders: DueReminder[]) => string` | Formats the array as a markdown `## Due reminders (from prior sessions)` block to append to the brief's input payload. Returns `''` for empty list. | none | mechanical | `App.tsx` |

**Port shape:** lift into `web/lib/reminders.js`. Same env-var rename as `ma-client.ts`. Fetch graceful fallback works identically in the browser.

---

### `app/lib/skill-loader.ts` — Node-side `agents/*/SKILL.md` loader

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `DEFAULT_MAX_SHARED_BYTES` | `65536` (64 KiB) | Cap on `agents/_shared/life-ops-conventions.md` size to catch prompt bloat. | none | n/a | tests |
| `DEFAULT_MAX_SKILL_BYTES` | `32768` (32 KiB) | Cap on per-skill `SKILL.md` size. | none | n/a | tests |
| `SkillLoaderError` (class) | `extends Error` | Typed loader error. | none | n/a | `agent-runner.ts`, tests |
| `LoadOptions` (type) | `{ agentsDir?, readFileFn?, maxSharedBytes?, maxSkillBytes? }` | Injection points for tests. | none | n/a | tests |
| `loadSkillDefinition` | `(skillName, opts?) => Promise<string>` | Reads `agents/_shared/life-ops-conventions.md` + `agents/<skill>/SKILL.md`, validates skill-name regex `[a-z][a-z0-9-]*`, validates frontmatter `name:` matches folder, asserts size caps, concatenates into one system prompt. | `node:fs/promises`, `node:path`, `process.cwd()` | **judgment** (Node-only) | `agent-runner.ts`, tests. **NOT called from `App.tsx`.** |
| `parseSkillFrontmatter` | `(content, skillName, path) => { name, body }` | Minimal YAML-ish frontmatter extractor — pulls `name:` from a `---`-delimited block. Doesn't depend on a YAML lib. Exported for testing. | none | mechanical (logic) / judgment (callers) | tests |

**Port shape (Saturday):** same as `agent-runner.ts` — **dormant in the web target**. The Edge Function (Deno) reads SKILL.md from the deployed bundle, not via this Node module. Keep `skill-loader.ts` in `app/lib/` as the eval-harness target / spec; the browser never imports it.

If a future use case needs SKILL.md content client-side (debug tooling?), the `parseSkillFrontmatter` function alone is browser-safe (pure string ops) — could be cherry-picked.

---

### `app/lib/supabase.ts` — typed Supabase client singleton

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `supabase` | `SupabaseClient` | Singleton client created with `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Throws on construction if either env var is missing (fail-loud). Auth: `persistSession: false`, `autoRefreshToken: false`, `detectSessionInUrl: false` (no auth flow yet). | `@supabase/supabase-js`, `process.env.EXPO_PUBLIC_SUPABASE_*` | **light-touch** (env-var rename + Babel-standalone can't `import` from npm) | `App.tsx` |

**Port shape:** the trickiest of the browser-band files because Babel-standalone cannot resolve `@supabase/supabase-js` from `node_modules` at runtime. Saturday options:
1. **Use the Supabase UMD bundle** loaded via `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>` in `index.html`, then `const supabase = window.supabase.createClient(url, anonKey, {...})`. Per ADR 0004 the prototype already uses this pattern for any external lib.
2. **If Saturday adopts Vite**, plain ES import works. Out of scope per ADR 0004.

Env-var injection: same as `ma-client.ts` — drop `EXPO_PUBLIC_` prefix, inject via `window.INTENTLY_CONFIG` or inline literal. Anon key is RLS-gated; safe to inline for V1 single-user.

---

### `app/lib/tokens.ts` — design tokens (RN shape)

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `palette` | object | 6 color families (cream, ink, sage, terra, amber, stone) × 3-5 stops each. Hex strings. | none | mechanical | indirectly via `theme` |
| `light` | object | The full light theme — `colors`, `gradients`, `painterly`, `typography` (fonts + scale), `spacing`, `radius`, `elevation`, `motion`, `a11y`. | `palette` | **judgment** (RN-shape) | `theme.light` |
| `theme` | `{ light }` | Theme namespace; future `dark` would slot in here. | `light` | judgment | 8+ components: `App.tsx`, `AgentOutputCard.tsx`, `BriefFlow.tsx`, `GoalDetail.tsx`, `JournalEditor.tsx`, `ProjectCard.tsx`, `ProjectDetail.tsx`, `ReviewFlow.tsx`, `VoiceModal.tsx` |
| `Theme` (type) | `typeof light` | Theme type for component prop typing. | none | mechanical | components |

**Port shape — likely throwaway (depends on iter 2):** the prototype already ships `web/intently-tokens.jsx` as the design-token source. Tokens have **two RN-only shapes** that don't translate to the prototype's CSS-in-JSX style:
- **Elevation:** `tokens.ts` ships RN shadow props (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`). Web equivalent is a CSS `box-shadow` string. Iter 2 audits whether `intently-tokens.jsx` already provides the CSS form.
- **Typography:** `tokens.ts` font names are `expo-google-fonts` package constants (`'Fraunces_500Medium'`). Web equivalent is a font-family string (`"Fraunces, serif"`) loaded via Google Fonts `<link>`. Iter 2 audits.

If `intently-tokens.jsx` covers both, **`tokens.ts` is throwaway** and the prototype's tokens are canonical. Iter 3's wiring map should not reference this file. **Open question 1** above.

---

### `app/lib/tools.ts` — tool scaffolds with mock implementations

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `ToolContext` (type) | `{ userId: string, now: Date }` | Per-call execution context handed to every tool. | none | mechanical | tests, `agent-runner.ts` |
| `Tool<TInput, TOutput>` (type) | `{ name, description, execute(input, ctx) => Promise<TOutput> }` | Generic tool contract. | none | mechanical | n/a |
| `CalendarEvent`, `ReadCalendarInput`, `ReadCalendarOutput` (types) | shapes for calendar tool | Typed I/O for `read_calendar`. | none | mechanical | tests |
| `readCalendar` | `Tool<ReadCalendarInput, ReadCalendarOutput>` | Returns 3 hard-coded fixture events for the requested date. Validates ISO 8601 range. | none | judgment (mock; needs real impl) | `tools` registry |
| `EmailMessage`, `ReadEmailsInput`, `ReadEmailsOutput` (types) | shapes for email tool | Typed I/O for `read_emails`. | none | mechanical | tests |
| `readEmails` | `Tool<ReadEmailsInput, ReadEmailsOutput>` | Returns 3 hard-coded fixture emails, optionally filtered by query substring. Clamps `limit` to 1-100. | none | judgment (mock) | `tools` registry |
| `MarkdownFile`, `ReadFileInput`, `ReadFileOutput` (types) | shapes for read_file | Typed I/O for `read_file`. | none | mechanical | tests |
| `FileNotFoundError` (class) | `extends Error` | Thrown when path not in `FIXTURE_FILES`. | none | mechanical | tests |
| `readFile` | `Tool<ReadFileInput, ReadFileOutput>` | Looks up the path in a 3-entry `FIXTURE_FILES` map (`Goals.md`, `Weekly Goals.md`, `Daily Log.md`). Throws `FileNotFoundError` otherwise. Asserts safe relative path. | none | judgment (mock) | `tools` registry |
| `WriteFileInput`, `WriteFileOutput` (types) | shapes for write_file | Typed I/O for `write_file`. | none | mechanical | tests |
| `WriteConflictError` (class) | `extends Error` | Thrown when `expectedVersion` doesn't match. | none | mechanical | tests |
| `writeFile` | `Tool<WriteFileInput, WriteFileOutput>` | In-memory write that returns the would-be persisted file. Honors optimistic-concurrency check via fake content-hash version. | none | judgment (mock) | `tools` registry |
| `tools` | `{ read_calendar, read_emails, read_file, write_file }` | Registry consumed by `agent-runner.ts`. | the four tool exports | judgment | `agent-runner.ts` |
| `ToolName` (type) | `keyof typeof tools` | Union of registered tool names. | `tools` | mechanical | n/a |

**Port shape (Saturday):** like `agent-runner.ts` and `skill-loader.ts`, **server-side concern**. The browser never executes these — the Edge Function does. Two viable shapes:
1. **Keep `tools.ts` as the contract.** The Edge Function imports the same fixture map (or its own real implementations) and follows these I/O shapes. The file becomes the typed spec, browser never sees it.
2. **Drop entirely.** If the Edge Function's tool layer diverges enough that `tools.ts` is just dead code, remove it post-pivot.

The fixtures (`FIXTURE_FILES`, the 3 events, the 3 emails) are demo seed data. If the Edge Function needs equivalent stubs while OAuth is unwired, lift the constants but not the function bodies.

---

### `app/lib/voice.ts` — Web Speech API hook + classify endpoint POST

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `VoiceState` (type) | `{ kind: 'unsupported' \| 'idle' \| 'listening' \| 'stopped' \| 'error', ... }` | Tagged-union state for the speech recognition lifecycle. | none | mechanical | `VoiceModal.tsx` |
| `useVoiceInput` | `() => { state, start, stop, reset, submitManual }` | React hook wrapping `window.SpeechRecognition` / `window.webkitSpeechRecognition`. Detects support, manages start/stop, accumulates final + interim transcript, exposes `submitManual` for typed-input fallback. Aborts on unmount. | `react` (`useCallback`, `useEffect`, `useRef`, `useState`), `window.SpeechRecognition` | **light-touch** (already browser-only; just needs React import resolved) | `VoiceModal.tsx` |
| `ClassifyResult` (type) | `{ classified: true, reminder } \| { classified: false, reason }` | Response shape from `reminders/classify-and-store`. | none | mechanical | `VoiceModal.tsx` |
| `classifyTranscript` | `(transcript, supabaseUrl) => Promise<ClassifyResult>` | POSTs `{ transcript }` to `${supabaseUrl}/functions/v1/reminders/classify-and-store`, throws on non-2xx. Note: takes `supabaseUrl` as a **parameter**, not from env (caller passes it in). | `fetch` | mechanical | `VoiceModal.tsx` |

**Port shape:** this is the only `app/lib/` file already written for the browser explicitly. Lift `useVoiceInput` into `web/lib/voice.js` (the prototype's `intently-shell.jsx` mounts the hero affordance — voice slots in there per BUILD-RULES.md). React in the prototype is loaded via UMD `<script>`, so `import { useCallback, ... } from 'react'` becomes `const { useCallback, ... } = React;` at the top of the file.

`classifyTranscript` is a plain fetch — lift verbatim. No env-var dependency at the function level (caller supplies the URL).

**Hero affordance significance:** per BUILD-RULES.md the hero is THE single interaction surface — voice goes in there. WIRING-POINTS.md (iter 3) will treat voice as the highest-priority wiring beat.

---

### `app/lib/render/daily-brief-context.ts` — DB rows → daily-brief markdown context

| Export | Signature | What it does | Deps | Portability | Caller in `app/` |
|---|---|---|---|---|---|
| `renderDailyBriefContext` | `(supabase: SupabaseClient, userId: string, today: Date) => Promise<string>` | Pulls `goals`, last `entries` (`brief`/`review`), last `journal` entry (yesterday-bounded), and active `projects` from Supabase; renders them as a markdown context block matching `app/fixtures/daily-brief-seed.ts → DAILY_BRIEF_DEMO_INPUT`. Sections: `Today: <date>`, `User: Sam`, `## Weekly Goals`, `## Yesterday's Daily Log`, `## Today's Calendar` (placeholder `not_connected`), `## Email` (placeholder), `## Recent project state`. | `@supabase/supabase-js` types, `Date` | **judgment** (where does this run?) | **NONE.** Not currently called from `app/` runtime or any test. Only mentioned in seed comments. |

**Port shape (Saturday — needs decision):** the render layer is **unwired**. Two possible homes:
1. **Browser-side render before MA call.** Front-end calls `renderDailyBriefContext(supabase, userId, today)`, passes the resulting string as `input` to `callMaProxy({ skill: 'daily-brief', input: contextString })`. Pro: deterministic context, easy to debug. Con: the agent's tools (`read_calendar`, etc.) become redundant for daily-brief.
2. **Server-side in `ma-proxy` Edge Function.** The Edge Function calls a Deno port of this render function before invoking the agent. Pro: keeps front-end thin. Con: needs to be re-implemented in Deno; types diverge.
3. **Skip the render layer entirely.** Pass `{ userId, date }` to the proxy, agent uses tools to fetch context. Simplest but slowest at runtime (extra tool roundtrips).

**Open question 2** above. Saturday session decides shape; affects what (if anything) gets ported.

If port option 1 wins, the file is **light-touch** (lift to `web/lib/render/daily-brief-context.js`, swap `@supabase/supabase-js` types for plain JS). If 2 or 3 wins, the file is **out of scope for the browser bundle**.

`USER_DISPLAY_NAME = 'Sam'` is hard-coded — TODO (per the file comment) is to look up from the user record post-V1.

---

### `app/lib/render/README.md` — render-layer rationale doc

Documentation, not code. Captures the "DB is source of truth, markdown is render-on-demand view" rule. Worth re-reading Saturday before deciding the render-layer port shape; the rule is still load-bearing regardless of where the render runs.

**Action:** copy the principle into `web/README.md` or wherever the web-target doc lives, so the architectural intent doesn't get lost when the render code moves.

---

## Saturday port checklist (derived from this inventory)

In the order Saturday's session should walk:

1. **Lift mechanical browser-band files into `web/lib/` (or inline into `index.html`):**
   - `agent-output.js` ← `agent-output.ts` (strip TS, keep functions)
   - `journal-editor.js` ← `journal-editor.ts` (verbatim)
   - `voice.js` ← `voice.ts` (replace `import { ... } from 'react'` with `const { ... } = React;`)

2. **Lift light-touch files with env-var rename:**
   - `ma-client.js` ← `ma-client.ts` — replace `process.env.EXPO_PUBLIC_SUPABASE_URL` with `window.INTENTLY_CONFIG.supabaseUrl` (or chosen pattern).
   - `reminders.js` ← `reminders.ts` — same env-var rename.

3. **Decide Supabase client shape:**
   - Add `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>` to `web/index.html`, then port `supabase.ts` as `const supabase = window.supabase.createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })`.

4. **Resolve open questions:**
   - Q1 (tokens canonical): iter 2 informs.
   - Q2 (render-layer home): decide before wiring `daily-brief` button in `web/`.
   - Q3 (`agent-runner.ts` keep/delete): low priority — defer until post-demo.
   - Q4 (`tools.ts` keep/delete): same.

5. **Do NOT port these into the browser bundle:**
   - `agent-runner.ts` (server-side; key exposure)
   - `skill-loader.ts` (Node-only deps)
   - `tools.ts` (mocks; Edge Function owns the real shape)

## Notes on the iteration

- 11 source files + 1 README scanned. No `app/utils/` or `app/hooks/` directories present.
- 7 files in the browser-runtime band (consumed by `App.tsx` or components).
- 4 files in the server-runtime band (no browser caller).
- `tokens.ts` is the only file with a possible "throwaway" verdict — confirmed by iter 2's prototype audit.
- Total port LOC estimate (mechanical + light-touch only): ~600 lines of source → ~600 lines of plain JS in `web/lib/`. Babel-standalone strips TS at runtime so even less manual work if files are kept as `.jsx`-ish modules.
