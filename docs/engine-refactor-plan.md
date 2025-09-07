# Engine/Core Refactor Plan

## Overview

This plan extracts the orchestration (“engine”) logic from `internal/gogent` into a small, testable package while keeping the current public surface stable. The migration proceeds in safe, incremental steps with clear acceptance criteria and rollback points.

## Current State

- Mixed concerns in two large files:
  - `internal/gogent/core.go`:
    - Client wiring (DB, migrations, API keys, integrations), request/response logging, function routing (MySQL/MCP), caches.
  - `internal/gogent/execution_engine.go`:
    - Orchestration for single/multi‑variation runs, rate‑limiting, comparison/metrics, summarization, parameter extraction, provider calls, persistence, logging.
- Pain points: tight coupling, hard to test, high change risk, duplicated cross‑cutting logic (summaries, params), growing complexity.

## Goals

- Isolate a reusable engine with small interfaces for persistence, logging, provider calls, and tool execution.
- Keep `internal/gogent` as adapters that satisfy those interfaces.
- Improve unit testability and reduce change risk.
- Preserve behavior and logs during migration.

## Target Architecture

- New package: `pkg/engine` (can start as `internal/engine` and promote later)
  - `engine.go`: run orchestration APIs (`ExecuteMulti`, `ExecuteSingle`).
  - `interfaces.go`:
    - `Provider`: model calls.
    - `Store`: persistence for runs/configs/requests/responses/comparisons.
    - `Logger`: execution + flow events.
    - `ToolRunner`: function execution (Slack, GitHub, HTTP, MCP, MySQL).
    - Optional: `Summarizer`, `ParameterExtractor`.
  - `compare.go`: scoring + aggregation.
  - `summarize.go`: result summarization (current impl: full JSON pass‑through).
  - `params.go`: parameter extraction helpers.
  - `types.go`: thin DTOs that reuse `internal/types` where possible.

- Adapters in `internal/gogent`:
  - `engine_store_adapter.go`: implements `Store` using `db.Queries`.
  - `engine_logger_adapter.go`: implements `Logger` mapping to `logExecutionEvent` + `logExecutionFlowEvent`.
  - `engine_toolrunner_adapter.go`: implements `ToolRunner` using integrations registry and existing routing (HTTP/MCP/MySQL).
  - `gemini_provider_adapter.go`: implements `Provider` via existing Gemini REST path.
  - Optional facade to preserve existing methods (delegate to engine).

## Key Interfaces (sketch)

- Provider:
  - `Generate(ctx, cfg, prompt, context) (Response, error)`
- Store:
  - `CreateExecutionRun`, `GetExecutionRun`
  - `UpsertConfiguration`, `CreateExecutionConfiguration`
  - `LogAPIRequest`, `LogAPIResponse`, `StoreComparisonResult`
- Logger:
  - `Event(level, category, message, meta)`
  - `FlowEvent(name, seq, status, timings, payload)`
- ToolRunner:
  - `Execute(ctx, def, args) (map[string]interface{}, error)`
- Optional:
  - `Summarize(functionName, result) string`
  - `FillMissingArgs(functionName, args, previousResults) map[string]interface{}`

## Incremental Migration Plan

Each stage is small, has tests, and can be rolled back independently.

1) Stage 0 — Scaffolding (no behavior change) — STATUS: Completed
- Scope: Create `pkg/engine` with empty `Engine` and interface definitions; add constructors and basic types. Add adapters’ skeletons in `internal/gogent` without wiring.
- Acceptance:
  - Build passes; no changes to runtime behavior.
- Rollback: Remove new package and stubs.

Progress note: Added `pkg/engine/interfaces.go` and `pkg/engine/engine.go` scaffold with tests.

2) Stage 1 — Extract Pure Helpers — STATUS: Completed
- Scope: Move pure functions from engine file into `pkg/engine` with unit tests.
  - Summarization (current: full JSON) → `pkg/engine/summarize.go`.
  - Parameter extraction (Slack channel) → `pkg/engine/params.go`.
  - Comparison scoring/aggregation helpers → `pkg/engine/compare.go`.
  - Smart JSON truncation utility.
- Wiring: Old code in `internal/gogent` now calls the new helpers (no logic change).
- Acceptance:
  - All tests pass; behavior (strings and logs) unchanged.
- Rollback: Repoint calls back to local functions.

Progress note: Implemented `summarize.go`, `params.go`, `trunc.go` with unit tests; updated `internal/gogent/execution_engine.go` to delegate to these helpers. Test suite passes.

3) Stage 2 — Single Variation via Engine — STATUS: Completed
- Scope: Introduce `Engine.ExecuteSingle` that performs one variation’s flow using interfaces (`Store`, `Logger`, `Provider`, `ToolRunner`).
- Wiring: In `internal/gogent`, wrap existing `executeSingleVariation` to call the new engine path. Keep original signature and delegate. Preserve sequence numbers and event payloads.
- Feature flag: Add `Client.options.UseNewEngineSingle` (default off), enable in CI after parity verified.
- Acceptance:
  - Parity tests pass: request/response logs, timings, statuses, and DB writes match.
- Rollback: Disable flag; code still present for later retry.

Summary: Implemented `Engine.ExecuteSingle` with tests using fakes for `Provider`, `Store`, `Logger`. Added `ClientOptions` flags (`UseNewEngineSingle`, `UseNewEngineMulti`) and `internal/gogent` adapters:
- `engine_adapter.go`: Provider/Store/Logger adapters + `Client.newEngine()` factory
- `execution_engine.go`: Optional delegation to engine when `UseNewEngineSingle` is enabled (default off)

Parity: Added `internal/gogent/engine_parity_test.go` validating single-variation flow events and API req/resp presence for both legacy and engine paths. Extracted comparison helpers to `pkg/engine/compare.go` with unit tests; legacy helpers delegate to reduce drift.

Stage 3 — Multi Variation via Engine — STATUS: Completed
Summary:
- `UseNewEngineMulti` now defers execution to `pkg/engine.ExecuteMulti` after DB mapping and `ai_model_call` start logs; results are merged back. Legacy path remains available.
- Comparison assembly handled by engine when `UseEngineComparator` is set (or via legacy compare through an adapter). Duplicate comparisons are avoided when engine multi already produced one.
- Parity tests cover flow events, API req/resp presence, comparison existence and payload structure (summary totals, per‑config entries, minimal metric keys, best ID membership).

Progress note (engine scaffolding): Implemented `pkg/engine.ExecuteMulti` with a `Comparator` interface and added `engine_multi_test.go`. Wired `engineComparator` adapter in `internal/gogent/engine_adapter.go` mapping to `compareResults` and `StoreComparisonResult`. Legacy orchestration remains the active path; full delegation behind `UseNewEngineMulti` will follow once comparison payload parity is validated.

Progress note (parity expansion): Updated `engine_multi_comparison_parity_test.go` to validate `_summary.total_variations` in `ConfigurationScores` for both legacy and engine runs, ensuring comparison payload structure aligns.
Progress note (parity expansion 2): Added checks that (a) there are at least two configuration score entries (excluding `_summary`) and (b) `BestConfigurationID` is present among the configuration score keys for both legacy and engine runs.
Progress note (compare helper migration): Added `pkg/engine/BasicComparator` to assemble `ComparisonResult` using engine scoring helpers. Not wired by default; storage is handled by adapters. This enables a future flag to switch comparison assembly fully to `pkg/engine` once parity is confirmed.
Progress note (flags/tests): Introduced `ClientOptions.UseEngineComparator` and added `internal/gogent/engine_comparator_parity_test.go` to validate that legacy and engine comparator paths both persist comparison results with the expected structure (`BestConfigurationID`, `ConfigurationScores._summary`).
Progress note (engine comparator in use): The comparator flag now uses `pkg/engine.BasicComparator` for comparison assembly (client still stores results). Parity checks remain green.
Progress note (multi orchestration): `UseNewEngineMulti` now defers execution of prepared configurations to `pkg/engine.ExecuteMulti` after DB mapping and `ai_model_call` start logs. Legacy path runs inline. This preserves IDs/log context and lets us validate engine orchestration without external behavior changes.
Progress note (ops toggles): `NewClient` reads env flags (`USE_ENGINE_SINGLE`, `USE_ENGINE_MULTI`, `USE_ENGINE_COMPARATOR`) and sets client options accordingly, easing rollout/CI toggling without code changes.
Progress note (engine options): Added `RateLimitDelayMs` to `pkg/engine.Options` and implemented optional pacing in `ExecuteMulti`. Default remains 0ms to avoid test flakiness; can be tuned during rollout if needed.

4) Stage 3 — Multi Variation via Engine
- Scope: Move `ExecuteMultiVariation` orchestration into `Engine.ExecuteMulti` (rate limiting, flow events, per‑variation execution, aggregation, comparison).
- Wiring: Delegate from `Client.ExecuteMultiVariation` to engine. Keep `CreateAPIConfiguration` mapping within `Store`.
- Feature flag: `Client.options.UseNewEngineMulti` (default off initially).
- Acceptance:
  - Golden tests for logs and DB artifacts match current behavior.
  - Performance within ±10% of current baseline.
- Rollback: Disable flag.

5) Stage 4 — Tool Routing Extraction — STATUS: Completed
- Scope: Move function/tool routing logic behind `ToolRunner`. Keep integration registry in `internal/gogent`, the adapter delegates to it.
- Summary:
  - Implemented `engineToolRunnerAdapter` that routes `Execute(ctx, functionName, args)` to the client's existing `executeFunctionCall` routing.
  - `newEngine()` wires this adapter so engine-driven flows use current integrations seamlessly (HTTP/MCP/MySQL).
  - Added wiring tests to ensure ToolRunner and comparator selection are correctly configured.
- Acceptance:
  - Existing function execution tests (Slack/GitHub/HTTP/MCP/MySQL) continue to pass; no behavior changes in routing.
- Rollback: Adapter continues to delegate to legacy routing helpers, so reverting requires no structural changes.

6) Stage 5 — Cleanup + Consolidation — STATUS: Completed (targeted)
- Scope: Keep stable public methods as thin delegates and avoid duplicate work across engine/legacy paths.
- Summary:
  - Prevented duplicate comparison assembly/storage when engine multi already produced a comparison result.
  - Centralized comparison scoring helpers in `pkg/engine` and delegated from legacy helpers to reduce drift.
  - Added env-driven toggles (`USE_ENGINE_*`, `ENGINE_RATELIMIT_MS`) for controlled rollout without code changes.
- Future optional cleanup: remove legacy-only helpers once flags are default-on and parity holds in production.

7) Stage 6 — Optional Module Promotion
- Scope: If desired, move `pkg/engine` to its own module/repo. Publish minimal API.
- Acceptance:
  - Consumers import the module without pulling the rest of `gogent`.

## Testing Strategy

- Unit tests in `pkg/engine` use fakes for `Store`, `Logger`, `Provider`, `ToolRunner` with predictable outputs.
- Golden tests for summarization and comparison scoring.
- Backward‑compat integration tests remain in `internal/gogent`; DB tests use `gogent_test` with auto‑migrate.
- Log parity tests compare structured payloads (sequence number, names, statuses, timings, sizes), not raw strings.
- Performance smoke checks on multi‑variation flows.

## Risks & Mitigations

- Circular imports: Keep `pkg/engine` free of `db.Queries` and `Client`; use interfaces and reuse `internal/types` only.
- Behavior drift: Golden tests + dual‑run comparison (old vs new) behind feature flags.
- Logging parity: Mirror `logExecutionEvent`/`logExecutionFlowEvent` shapes in `Logger`.
- Migration complexity: Small stages, each shippable and reversible.
- Concurrency/sequence counters: Keep sequence counter state within `Logger` adapter or pass via context; add tests.

## Work Breakdown (Backlog)

- Define `pkg/engine` scaffolding, interfaces, DTOs.
- Extract helpers: summarize, params, compare, truncation + tests.
- Build adapters in `internal/gogent`: store/logger/tools/provider.
- Stage 2: Implement `ExecuteSingle` + flag + parity tests.
- Stage 3: Implement `ExecuteMulti` + comparison + flag + parity tests.
- Stage 4: Finalize `ToolRunner` with integrations routing.
- Stage 5: Cleanup old engine paths; update docs.

## Rollout Plan

- Default to old code paths until each stage passes parity tests.
- Enable flags per‑stage in CI first, then default on.
- Keep flags for one release for rapid rollback.

## Open Questions

- Should `pkg/engine` live under `internal/engine` first to prevent external import during iteration?
- Do we want streaming provider support now (push events) or later?
- Should `Logger` handle sequence counters internally or accept them from engine for full control?
- How much of `types` should be mirrored vs reused to avoid dependency depth?

---

Owner: Core platform
Reviewers: Runtime + Integrations
Initial ETA: 2–3 small PRs for Stages 0–2, then evaluate cadence.
