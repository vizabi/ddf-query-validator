# ddf-query-validator — LLM Context File

## Purpose

`@vizabi/ddf-query-validator` validates **DDFQL queries** (the query language used by Gapminder/Vizabi datasets) in two phases: structural (syntax) and definitional (semantic against a dataset's concepts). Used as a dependency inside `@vizabi/reader-ddfcsv`, which in turn powers the `small-waffle` API server.

---

## Tech Stack

- **TypeScript** source in `src/`, compiled to `lib/` (CommonJS, ES2017 target)
- **lodash-es** for all utility functions (not lodash — the ES module version, for tree-shaking in browser consumers)
- **Mocha + Chai + nyc** for tests; `tsx` used to run `.ts` test files directly (no separate compile step for tests)
- Tests live in `test/**/*.spec.ts`, run recursively

### Key commands

```bash
npm test            # runs preunit (clean → npm i → tslint → tsc) then nyc mocha
npm run tsc         # compile TypeScript + run tslint
npx mocha           # run tests WITHOUT the preunit step (faster, skips compile + install)
```

---

## Source Files

| File | Role |
|------|------|
| `src/index.ts` | Re-exports everything from all other modules |
| `src/helper.service.ts` | Constants (`AVAILABLE_QUERY_OPERATORS`, `AVAILABLE_FROM_CLAUSE_VALUES`, etc.) + query-type predicates (`isDatapointsQuery`, `isEntitiesQuery`, etc.) |
| `src/interfaces.ts` | TypeScript interfaces: `IQuery`, `IReader`, `QueryFeature` enum, `IQueryFeatureDetector` type |
| `src/structure.service.ts` | **Phase 1 validation**: structural checks on a raw query object (no dataset needed) |
| `src/definition.service.ts` | **Phase 2 validation**: semantic checks against a `conceptsLookup` Map from the loaded dataset |
| `src/dataset-manager.service.ts` | Multi-dataset/branch/commit routing — resolves `dataset`, `branch`, `commit` params to a `repositoryPath` |
| `src/features.service.ts` | Feature detection for query optimizer: detects `WhereClauseBasedOnConjunction` and `ConjunctionPartFromWhereClauseCorrespondsToJoin` patterns (used by `reader-ddfcsv` to select fewer CSV files) |

---

## Two-Phase Validation Pipeline

### Phase 1 — `validateQueryStructure(query, options?)`

Called **before** any data is loaded. Pure structural checks, no conceptsLookup needed.

Returns `Promise<void>` — resolves if valid, rejects with:
```
"Too many query structure errors: \n* <error1>\n* <error2>"
```

Runs these sub-validators (each returns `string[]`):
1. `validateDatasetStructure` — dataset/branch/commit must be strings if present
2. `validateFromStructure` — `from` must be a non-empty string from the allowed set
3. `validateSelectStructure` — `select` shape varies by query type (datapoints need ≥2 keys + ≥1 value; entities/concepts need exactly 1 key; schemas need exactly `key`+`value`)
4. `validateWhereStructure` — where must be a plain object; operators must be from `AVAILABLE_QUERY_OPERATORS`; **`$and`/`$or`/`$nor` must be arrays** (see below)
5. `validateLanguageStructure` — language must be a string if present (schemas must NOT have it)
6. `validateJoinStructure` — join must be a plain object; schemas/concepts must NOT have it
7. `validateOrderByStructure` — order_by must be string or array of strings/direction-objects

### Phase 2 — `validateQueryDefinitions(query, options)`

Called **after** concepts are loaded. `options.conceptsLookup` is a `Map<string, concept>`.

Returns `Promise<void>` — resolves if valid, rejects with:
```
"Too many query definition errors [repo: <basePath>]: \n* <error1>"
```

Currently only validates `select` definitions (checks key/value items exist in conceptsLookup). The `validateWhereDefinitions` function **exists but is effectively disabled** — gated by `if (query.debug !== true) return []`.

---

## Design Patterns

### `checkIf*` helper pattern

All checks are private functions with signature `(clause, ...) => string | void`:
- Return the error message string if invalid
- Return `void` (undefined) if valid

Results are pushed into `errorMessages[]` and then `compact()` strips the `undefined`s:

```ts
errorMessages.push(
  checkIfWhereHasInvalidStructure(whereClause, joinPath),
  checkIfWhereHasUnknownOperators(joinClause, whereOperators, joinPath),
  checkIfBooleanOperatorsAreArrays(whereClause, joinPath),
);
return compact(errorMessages);
```

### Join-path prefix

`getJoinIDPathIfExists(options)` returns either `""` (top-level where) or `"join.$id."` when validating a join sub-where. Prefixed into error messages so the user sees e.g. `'join.$geo.where' clause must be object only`.

### `getWhereOperators` (in structure.service)

Builds a flat list of `{name: string, isLeaf: boolean}` for every `$`-prefixed field in the where clause (recursively). Used to check against `AVAILABLE_QUERY_OPERATORS`.

- `isLeaf: false` — operator is a key (e.g. `$and`, `$or`, `$in`)
- `isLeaf: true` — operator is a value (e.g. `{ country: '$geo' }` where `$geo` is a join reference)

### AVAILABLE_QUERY_OPERATORS

```ts
new Set(['$eq','$gt','$gte','$lt','$lte','$ne','$in','$nin','$or','$and','$not','$nor','$size','$all','$elemMatch'])
```

Note: `$size`, `$all`, `$elemMatch` are listed but not actually used in DDF datasets.

---

## Key Validation: Boolean Operators Must Be Arrays

**Added in v1.4.5** — `checkIfBooleanOperatorsAreArrays` in `validateWhereStructure`.

**Motivation**: Urlon (the URL query encoding used in small-waffle) can produce `$nor: { geo: {...} }` (an object) when the client encodes `$nor` without the `@` array sigil. The reader (`ddf-csv.ts`) then calls `filter['$nor'].map(...)` and crashes with `filter[field].map is not a function` — a 500 error. The fix belongs here so the error is caught as a structured 400 before the reader is called.

```ts
function checkIfBooleanOperatorsAreArrays(clause, joinPath): string | void {
  // recursively checks that $and/$or/$nor are arrays at every nesting level
}
```

The check was **not previously present** anywhere in the codebase. Confirmed by:
- Phase 1 only checked: where is a plain object + operators are in the allowed set
- Phase 2 `validateWhereDefinitions` is disabled (debug-only)
- `features.service.ts` accesses `query.where.$and` iteratively but runs after phase 1

---

## Test Structure

```
test/
├── common.ts                          # Shared: expectPromiseRejection, error regex constants
├── fixtures/
│   └── pop-big.concepts-lookup.json   # A real conceptsLookup for feature/definition tests
├── features.spec.ts                   # Tests for featureDetectors (InClauseUnderConjunction)
├── dataset-manager/                   # Tests for extendQueryWithRepository
└── structure/
    ├── errors-structure.spec.ts       # General structure errors (from, select, join, language)
    ├── datapoints-structure.spec.ts   # Datapoints-specific select checks
    ├── entities-structure.spec.ts     # Entities-specific select checks
    ├── concepts-structure.spec.ts     # Concepts-specific select checks
    ├── schema-structure.spec.ts       # Schema query checks
    ├── query-operators-structure.spec.ts  # Boolean operator array checks (new in v1.4.5)
    └── assets-structure.spec.ts       # (assets — stub/pending)
```

### `expectPromiseRejection` helper

Takes `{ promiseFunction, args, expectedErrors: RegExp[] }`. Asserts:
1. The promise rejects (does not resolve)
2. Exactly `expectedErrors.length` errors are present in the rejection string
3. Each regex matches the rejection string

**Error counting**: scans the rejection message for `\n*` occurrences — the separator used by both `validateQueryStructure` and `validateQueryDefinitions`.

---

## Downstream Consumers

- **`@vizabi/reader-ddfcsv`** (`ddf-csv.ts`): calls `validateQueryStructure` then `validateQueryDefinitions` at the start of every `reader.read()` call. Both rejection strings starting with `"Too many query..."` are caught and re-thrown as the error string.
- **`small-waffle`** (`api-redirect-logic.js`): catches errors containing `"Too many query structure errors"` or `"Too many query definition errors"` and returns HTTP 400 (not 500).

---

## Versions

- **v1.4.4**: last published version before this session
- **v1.4.5**: adds `checkIfBooleanOperatorsAreArrays` + 4 new tests for `$and`/`$or`/`$nor` structure validation

---

## Future Work

### Fundamental

**1. ~~Join sub-where clauses are not validated for boolean operator arrays~~ — FIXED in v1.4.5**

`checkIfBooleanOperatorsAreArrays` is now called both on `query.where` and on each `join.$id.where`, using the `getJoinIDPathIfExists` prefix so error messages say `'join.$geo.where' clause: operator '$nor' must be an array`. Added 3 new tests in `query-operators-structure.spec.ts`.

**2. Join sub-where validation is largely unimplemented (4+ skipped tests)**

`validateJoinStructure` only checks that `join` is a plain object and each entry's `key` is a string. The following tests are `xit` (skipped) and describe desired but unimplemented behavior:
- `join.$id.where` must be a plain object
- `join.$id.where` must not have unknown operators
- `join.$id.where` operators-as-leaves must reference valid join IDs
- `join.$id.key` must be a string (actually implemented but test skipped)

The `getJoinIDPathIfExists` helper already generates the right prefix (`join.$id.`) for error messages — the structure and path for implementing these checks is there.

**3. `validateWhereDefinitions` is permanently disabled**

In `definition.service.ts`, `validateWhereDefinitions` is gated by `if (query.debug !== true) return []`. The commented-out inner checks are significant missing validations: unknown field names in where, fields not present in select, wrong entity-set/domain relatives. The function and its helpers exist but are effectively dead code.

**4. `validateSubqueries` was commented out — and has an async bug**

The commented-out call to `validateSubqueries` would recursively validate join sub-queries. However the function uses `async` inside `flatMap`, which would return `Promise[]` instead of `string[]` — so even if un-commented, it would never accumulate errors correctly. Needs to be rewritten with `await Promise.all(...)` or just synchronous calls.

### Minor / Code Quality

**5. `checkIfBooleanOperatorsAreArrays` stops at first error**

It returns a `string | void` (single result), unlike all other validators that return `string[]` and accumulate all problems. If a query has both `$and: {}` and another where issue, the user only sees one error. Should be refactored to return `string[]`.

**6. Inconsistent test style in `concepts-structure.spec.ts`**

This file uses raw `try/catch` with manual `getAmountOfErrors` + `EXPECTS_EXACTLY_ONE_ERROR`/`EXPECTS_EXACTLY_TWO_ERRORS` constants. All other modern spec files use `expectPromiseRejection`, which is strictly better (enforces exact error counts, guards against false passes on resolve). `concepts-structure.spec.ts` should be migrated.

**7. `flatMapWrapper` is a pointless one-liner**

```ts
function flatMapWrapper(array, iteratee): any[] {
  return flatMap(array, iteratee);
}
```
Used exactly once (in the commented-out `validateSubqueries`). Remove.

**8. `getVersion()` relies on `process.env.npm_package_version`**

Only set when executed via npm scripts. Unreliable when the library is imported directly. A version constant in source is more robust.

**9. `tslint` is deprecated**

`tslint` has been abandoned since 2019. The rest of the devDeps are up to date (`typescript 5.9.x`, `mocha 11.x`, `chai 6.x`). Should migrate to `eslint` + `@typescript-eslint`.

**10. TypeScript safety is effectively disabled**

`tsconfig.json` has `noImplicitAny: false` and `strictNullChecks: false`. Nearly all functions accept `any` parameters. The validator would benefit from strict typing — especially the `IQuery` interface (where `.where` is typed as `any`) and the `checkIf*` functions.

**11. Environment-variable defaults in `helper.service.ts`**

`DEFAULT_REPOSITORY_NAME` and `DEFAULT_REPOSITORY_BRANCH` fall back to `process.env.DEFAULT_REPOSITORY_NAME`. This is an unusual API for a library (environment leaking into static constants). Should be pure constants or passed explicitly through options.

**12. `BASE_PATH` and `GLOBALIS_PATH` in `test/common.ts` are unused**

`concepts-structure.spec.ts` imports them but never uses them. Leftover from a refactor.
