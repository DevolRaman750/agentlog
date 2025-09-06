# Test Failures — Analysis and Fix Plan

This document captures the current test failures from `make run-tests`, identifies root causes, and proposes a concrete path to get the suite green locally and in CI.

## Summary of Failures

- Build failure in `gogent/internal/gogent` due to a test calling a function with an outdated signature:
  - File: `internal/gogent/parameter_extraction_test.go`
  - Error: calls to `client.autoExtractParametersFromContext(...)` no longer match the function signature `(context.Context, *ResponsePart, []map[string]interface{})`.

- Database-dependent tests fail to connect to MySQL (sandbox/network restrictions):
  - Package: `gogent/internal/apikeys`
    - Files: `internal/apikeys/service_test.go`, `internal/apikeys/multi_auth_test.go`
    - Error: `dial tcp [::1]:3306: connect: operation not permitted` (Ping to MySQL blocked)
  - Package: `gogent/internal/tests`
    - File: `internal/tests/automation_functions_test.go`
    - Error: `dial tcp [::1]:3306: connect: operation not permitted` (Ping to MySQL blocked)

## Fix Plan by Area

### 1) Parameter Extraction Tests (signature mismatch)

- Impacted file: `internal/gogent/parameter_extraction_test.go`
- Current calls pass a slice of `ResponsePart` and omit `context.Context`.
- Update each call to pass:
  - a `context.Context` (e.g., `context.Background()`), and
  - a pointer to a single `ResponsePart` (not a slice)
  - the `previousResults` as-is

Suggested edits:

1. Import context in the test: `import "context"`
2. Change the test to work on a single `ResponsePart` rather than a slice, and pass a pointer:

```go
// Before
client.autoExtractParametersFromContext(nextCalls, currentResults)

// After
ctx := context.Background()
client.autoExtractParametersFromContext(ctx, &nextCalls[0], currentResults)
```

3. Apply that change in all three subtests:
   - “Slack Channel ID Extraction”
   - “No Extraction When Channel Already Provided”
   - “No Extraction When No Channel Data Available”

No production code changes required — only the test needs to be updated to the new API.

### 2) API Keys Tests (DB dependency: MySQL)

- Impacted files:
  - `internal/apikeys/service_test.go`
  - `internal/apikeys/multi_auth_test.go`
- Root cause: Tests hardcode a MySQL DSN and immediately attempt to connect + ping. In sandboxed environments (and in many CI contexts without DB), this fails.

Recommended approach (short-term, least invasive):

- Gate DB tests behind an environment variable and skip when not configured.
  - Replace the hardcoded DSN with `TEST_MYSQL_DSN` (fall back to empty string or skip if unset).
  - In `setupTestDB(t)`, if DSN is empty or `Ping()` fails, call `t.Skip("MySQL test DB not available; skipping integration test")`.

Sketch of the change:

```go
// const testDSN = "root:Password123!..."   // Remove hardcoded constant

func setupTestDB(t *testing.T) *sql.DB {
    dsn := os.Getenv("TEST_MYSQL_DSN")
    if dsn == "" {
        t.Skip("TEST_MYSQL_DSN not set; skipping DB integration tests")
    }

    db, err := sql.Open("mysql", dsn)
    require.NoError(t, err, "Failed to open DB")

    if err := db.Ping(); err != nil {
        t.Skipf("Cannot reach DB (%v); skipping DB integration tests", err)
    }
    return db
}
```

Alternative (more explicit): Use build tags to mark these as integration tests:

- Add `//go:build integration` to the top of `service_test.go` and `multi_auth_test.go` (or split out the DB-heavy parts into `*_integration_test.go`).
- Run them explicitly with: `go test -tags=integration ./internal/apikeys -v`.

Longer-term option (if we want pure unit tests):

- Introduce a storage/repository interface for `Service` and test with a mock in-memory implementation for CRUD logic.
- Keep a separate small integration suite (tagged or env-gated) that verifies DB schema/migrations and real persistence behavior.

### 3) Automation Functions Integration Test (DB dependency)

- Impacted file: `internal/tests/automation_functions_test.go`
- Root cause: Also assumes a reachable MySQL and a migrated schema/data.

Recommended approach (aligned with API Keys tests):

- Use `TEST_MYSQL_DSN` and skip when not set or not reachable, or
- Mark the test with `//go:build integration` and run explicitly when a DB is available.

Notes on assertions and brittleness:

- It currently asserts exact counts per function group (e.g., slack: 16, github: 17). These can drift as functions evolve.
- Consider either:
  - Asserting lower bounds (e.g., `>=`), or
  - Deriving expectations by enumerating the source of truth (the JSON under `system/functions/*`) and comparing to DB rows after a “system sync” step.

## Running Tests Locally

- Unit tests only (no DB):
  - After applying the changes above, `go test ./...` or `make run-tests` should pass in environments without MySQL.

- Integration tests with MySQL:
  1. Start MySQL and create the `gogent` database.
  2. Apply migrations (see `docs/database_migrations_setup.md`).
  3. Export `TEST_MYSQL_DSN` (example):
     ```bash
     export TEST_MYSQL_DSN='root:Password123!@tcp(localhost:3306)/gogent?parseTime=true'
     ```
  4. Run integration tests:
     - If using env-gated skips: `go test ./... -v`
     - If using build tags: `go test -tags=integration ./... -v`

## Minimal Steps to Green

1. Update `internal/gogent/parameter_extraction_test.go` to match the new `autoExtractParametersFromContext` signature (pass `context`, `*ResponsePart`).
2. Make DB tests opt-in:
   - Either gate via `TEST_MYSQL_DSN` with `t.Skip` when not set/reachable, or
   - Move to `//go:build integration` and run them only when explicitly requested.
3. (Optional) Reduce brittleness in `internal/tests/automation_functions_test.go` by relaxing exact counts or deriving expectations from the `system/functions` definitions.

Once (1) and (2) are done, `make run-tests` should pass in non-DB environments, and full integration coverage can be run when a MySQL instance is available.

