# Verification results

Verified October 29, 2026, on Linux with Node.js 24.22.1, MongoDB 7.0.24 and Vite 6.4.5. Based on team main commit 3fb3fd93037d3eddf1bba7f186f9e7fabe48ab6b.

## Actual checks

| Check | Result |
| --- | --- |
| Fresh copy without node_modules: npm run setup | Passed; both lockfile-based npm ci installs completed. |
| npm test | Passed: 11 backend integration tests and 6 frontend tests. |
| npm run build | Passed; production frontend/dist generated with no unresolved imports. |
| Vue source parse | All 16 Vue files use script setup; no legacy script/Options API definitions. |
| npm run demo:production | Passed; real local MongoDB, initialization, Express startup and Vite production preview. |
| Browser editor login and dashboard | Passed; attendance and ZIP charts loaded. |
| All three lists | Passed; 18 rows/domain, page 1/page 2, sorting, details navigation. |
| Nested detail route reload | Passed for clients, events and services; session and authorization restored. |
| Search with no results and Clear Search | Passed against real API. |
| Viewer direct navigation to three creation forms | Redirected to dashboard as required. |
| Viewer direct API mutation | Returned 403 independently of frontend guards. |
| Client/service/event create and update in browser | Passed through migrated forms and real backend. |
| Failed list request and Retry recovery | Passed; readable network error then data reloaded. |
| Forged but decodable JWT | API rejected it; frontend cleared saved token and redirected to login. |
| Browser errors/warnings | Zero uncaught page errors and zero Vue warnings during the tested workflows. |

Backend tests specifically exercised two organizations, protected reads, every mutation family as a viewer, cross-organization IDs, forged ownership fields, related service ownership, malformed IDs, seed reruns and preserved changes, bcrypt demo accounts, safe 400/404/500 responses, CORS, health, and eight simultaneous duplicate registrations. Test databases are isolated from demo/grading data.

Frontend tests exercise shared-table sorting/page resets/custom rendering, useApi success/failure/retry/out-of-order results, token restoration and cleanup, route roles, and error messages.

The browser checks used the production bundle, Chromium 134 and a real isolated local MongoDB/API. Browser automation and temporary test databases/screenshots were used only for verification and are not included as user data. The normal npm test suites are included and reproducible; browser walkthrough steps can be repeated manually using the demo accounts.

## Verification limits

Windows/macOS installation was not exercised here. No public hosting provider was deployed or tested; SPA fallback files are supplied and local nested-route refresh was exercised. No teammate reviews, meaningful individual commits, rubric score, instructor acceptance, complete accessibility audit, or presentation submission is claimed. Cross-process concurrent delete/register integrity is a documented remaining engineering limitation; duplicate registration itself is atomic and tested. See IMPLEMENTATION_STATUS.md for remaining human deliverables.
