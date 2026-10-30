# Implementation status

Baseline: DR0GERSMAN/CIS3339-Project main commit 3fb3fd93037d3eddf1bba7f186f9e7fabe48ab6b. The supplied application and forms are retained and improved.

| Requirement | Implemented in this package |
| --- | --- |
| F1 | Every Vue file uses script setup, including forms/details/charts/App; migration comments included; Chart.js watchers and cleanup. |
| F2 | useApi in all three lists and both dashboard datasets; visible loading/empty/error/retry; Axios interceptor centralizes errors; 401 resets session. |
| F3 | Shared DataTable, columns/rows/optional render, three-state sort, 10-row pages, range/count, search-page reset, keyboard buttons; 18 seed rows/domain. |
| F4 | Token/header/Pinia restoration before initial routing; expiry/corrupt-claim handling; editor-only forms and editor-only mutation controls. |
| S1 | JWT identity/role/orgId, editor middleware, shared org filters mapped to legacy fields, scoped aggregates/relations, single-origin CORS, generic failed login. |
| B1 | Retained route paths, both records checked under organization, idempotent atomic attendee membership updates, required repeat messages. |
| B2 | Safe JSON error middleware; validation/not-found/server statuses; unauthenticated database health. |
| D1 | Idempotent initializer, hashed user/user and admin/admin, stable samples and indexes, config preflight, local dedicated .env files. |
| D2 | Portable imports/assets; build and preview; local production launcher; SPA fallback files and remote deployment instructions. |
| Bonus tests | Isolated backend integration tests and frontend component/composable/store/guard tests. |

## Still requires the team

- Review and test on the team's actual Windows/macOS machines. Confirm the latest Canvas rubric and due dates.
- Make legitimate individual commits/reviews for each person's own work; this ZIP cannot satisfy contribution-history requirements by itself.
- Record the short Sprint 2 demo, accurately describe AI use, and submit the team repository link.
- Prepare any Sprint 3 technical report and 10-15 minute group video with database initialization, roles, denied mutations, isolation, workflows and production build.
- If Canvas requires public deployment, deploy to a chosen host, configure dedicated remote DB/API values and test there. This package supplies local hosting, not a public URL.
- Complete individual peer evaluations when assigned.

## Remaining engineering limits

The starter delete restrictions are checked and tested for sequential use, but fully concurrent deletion versus registration/service-reference creation is not protected by a distributed transaction. Public deployment would also need rate limiting, operational logging/backups, stronger production credential handling, and host-specific configuration. Keep this a dedicated course demonstration. Optional supplementary SearchBar/sidebar/modal extraction and a formal accessibility audit are not all implemented; deletion confirmation uses the browser's accessible confirmation dialog.
