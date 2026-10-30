> Setup creates local `.env` files from `.env.example` and generates a unique JWT secret. Runtime `.env` files are excluded from Git. Demo accounts are for local coursework.

# CIS 3339 Data Platform

Team: Sarrthi Jasrotia, Toby Nzekwu, Oluwatobiloba E Ajakaye, Ezra Kihshen, Donovan Rogers.

This package extends the supplied Vue 3 / Express / MongoDB template. It preserves the client, event, service, registration and chart workflows and existing MongoDB collection names. All Vue components use script setup. Existing template authors and the instructor requirements remain in Project-README.md and frontend/STUDENT-TASKS.md.

## Requirements

- Node.js 22 LTS recommended; package engines require Node 20.19 or newer.
- Internet for npm install and, on the first convenience-demo run, the MongoDB binary download.
- Supported local desktop: Windows, macOS, Linux with MongoDB-compatible OS/CPU. Earlier package verification was on Linux / Node 24. An AI-assisted check of the downloaded main-branch copy on macOS / Node 24.14.1 on October 30, 2026 passed setup, all 17 tests, the production build, production startup, both demo logins, and client/event/service API reads. Windows and a complete browser CRUD walkthrough were not tested in this review.
- Ports 3000 (backend) and 5173 (frontend) must be free.

## Fast local production demo

In this folder (the folder containing this README and root package.json):

```sh
npm run setup
npm run demo:production
```

Then open **http://localhost:5173**. Always use localhost in the browser because CORS_ORIGIN is configured for that origin.

| Role | Username | Password |
| --- | --- | --- |
| Viewer | user | user |
| Editor | admin | admin |

`setup` runs npm ci separately in frontend and backend using the included lockfiles. `demo:production` starts a real local mongod, initializes sample data, builds Vite, and serves the production bundle and API. It is not a frontend mock. Local data persists in .local-db, which is excluded from Git. No cloud credentials are used. First launch downloads MongoDB 7; subsequent launches reuse the cached binary. Stop with Ctrl+C. Run `npm run demo` instead for the Vite development server. Do not run development and production demo commands simultaneously.

## Use installed MongoDB instead

Start MongoDB Community Edition locally, or optionally use Docker:

```sh
docker compose up -d
npm run setup
npm run db:init
npm start
```

Without Docker, start your installed MongoDB service and use the last three commands. Docker is optional. MongoDB must listen at the MONGO_URL in backend/.env. `npm start` launches both apps; `npm run start:production` builds/serves the production frontend instead. You can also start separately:

```sh
cd backend
npm ci
npm run db:init
npm start
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

For the static production bundle:

```sh
cd frontend
npm run build
npm run serve
```

Vite preview serves at port 5173. Keep the backend running. A deployed static site still needs a separately running Express API and MongoDB.

## Configuration

Run `npm run setup` to generate `backend/.env` and `frontend/.env` from the committed `.env.example` files. Setup generates a unique local JWT signing secret. Actual `.env` files are excluded from Git. Submit both actual `.env` files privately through Canvas, per the instructor's announcement. The default configuration is for a local course demonstration.

| File / key | Meaning |
| --- | --- |
| backend/.env MONGO_URL | Default mongodb://127.0.0.1:27017/cis3339. Convenience demo overrides this with its own local process URI. |
| PORT | Express port, 3000. If changed, rebuild frontend with the matching API URL. |
| ORG_ID | Seed organization ObjectId and organization used for login. |
| JWT_SECRET | Course-only signing key. Use a different dedicated key before any public deployment; rotate after grading. |
| CORS_ORIGIN | Single permitted browser origin, http://localhost:5173 by default. |
| SEED_VIEWER_USERNAME / SEED_VIEWER_PASSWORD | Initial viewer login, user/user. |
| SEED_EDITOR_USERNAME / SEED_EDITOR_PASSWORD | Initial editor login, admin/admin. |
| frontend/.env VITE_ROOT_API | Backend URL, http://localhost:3000. Vite reads it at build time. |

## Initialization and existing data

`npm run db:init` creates/upserts one organization, two hashed accounts, 18 sample clients/services/events, and one initial registration. It creates indexes and prints a summary. It is safe to rerun: existing records, passwords, and edits are preserved. Invalid configuration is rejected before connecting/writing. There is no automatic reset operation. Changing seed password env variables does not overwrite an existing password.

The application keeps the legacy client orgs[] array and scalar event/service/user org fields. Authentication signs a trusted orgId claim. The shared withOrg(filter, req, kind) helper maps that claim to the correct legacy field for every domain query. No schema migration that silently assigns existing data to another organization is performed. Use a dedicated empty course database for grading; existing legacy users need bcrypt-compatible hashes, supported viewer/editor roles, and an organization. Existing tokens without orgId must be replaced by logging in again.

## API and security

- Public endpoints: POST /users/login, GET /org (configured public organization name only), GET /health.
- Every client/event/service endpoint requires a verified JWT. Mutations additionally require editor role.
- All failures use JSON `{ "error": "Readable message" }`. Invalid input is 400, unauthorized 401, forbidden 403, missing/cross-organization records 404, integrity conflicts 409, unexpected errors 500.
- Register: PUT /events/register?event=ID&client=ID. Deregister uses /events/deregister with the same query keys.
- First registration/removal returns the updated event. Repeat requests return `{ "message": "Already registered" }` or `{ "message": "Not registered" }` with 200.
- Registration lives only in events.attendees[]. Atomic conditional $addToSet/$pull prevents duplicate entries.
- Ownership fields cannot be changed through request bodies. Forms send only allowlisted business fields.
- Dashboard queries, related-record lookups, and aggregates are authenticated and scoped.
- JWT decoding on the frontend checks claims/expiry for UX. Only the server verifies signatures; a server 401 clears session and returns to login.
- Health is 200 when connected and 503 when disconnected, without authentication.

## Tests

```sh
npm test
```

This runs backend and frontend suites. Backend tests launch an isolated temporary MongoDB; they never use the normal grading database. First run may download a binary. Tests cover seeded accounts and idempotency, viewer denials, two-organization isolation, CRUD/integrity rules, concurrent registration, safe error envelopes, CORS, table paging/sorting/rendering, session restoration, role guards, and async state.

## Static hosting and production setup

The local production setup above is the hosting environment actually exercised. No public cloud URL is included or claimed.

For later remote hosting:
1. Deploy Express using node app.js and a dedicated MongoDB URL accessible to that server.
2. Set CORS_ORIGIN to the exact HTTPS frontend origin and a dedicated JWT_SECRET.
3. Set frontend VITE_ROOT_API to the HTTPS backend URL BEFORE npm run build.
4. Upload frontend/dist to your static host. Configure SPA history fallback to index.html. `_redirects` is included for compatible hosts; web.config is included for IIS with URL Rewrite. For Nginx use `try_files $uri $uri/ /index.html;` in location /.
5. Confirm /health, both role logins, direct nested-route refresh, assets, and API requests from the deployed origin.
6. Rebuild after changing VITE_ROOT_API; editing .env next to an existing bundle does not reconfigure it.

## Known limits and remaining deliverables

See IMPLEMENTATION_STATUS.md. Important: the local-demo launcher is for development/grading, not unattended public hosting. Vite preview is a local production-bundle check, not a hardened public web server. There is no login rate limiter, refresh-token rotation, password-reset flow, or distributed transaction for concurrent delete/register races. Do not use this demo for real health/client data.

## Repository workflow and AI assistance

This ZIP is one AI-assisted implementation package. It does not create or claim individual teammate commits, PR reviews, meetings, presentation work, or instructor acceptance. Each teammate should review, understand, test, and accurately document their actual contributions. Keep source, lockfiles, and course configuration in Git; exclude node_modules, .local-db and dist. Submit the repository link, not the ZIP, unless Canvas specifically asks otherwise.

## Template credits

The supplied template credits Jeremy Griffith and Edwin Charly (Spring 2023), and Elliot Farmer Garcia, Agatha Molski, and Chris Blanco (Fall 2022). Their original application is the basis of this course project.
