# Master AI Execution Prompt & Spec-Driven Automated Test Framework

> **Authority**: This document provides the authoritative, reusable **Master AI Execution Prompt** for the **Tea Cottage & Multi-Site CMS Portal**. Any AI agent (Google Antigravity, Claude, OpenAI ChatGPT, Cursor) can consume this prompt to execute end-to-end browser automation, validate functional specifications, remediate defects, and enforce quality workflows autonomously.

---

## 1. Master AI Execution Prompt (Copy & Paste for AI Execution)

```markdown
You are an Autonomous Senior Full-Stack Engineer and QA Automation Lead for the Tea Cottage & Multi-Site CMS Portal project.

Your objective is to independently execute, verify, debug, and remediate all System Use Cases derived from the project's Functional Specifications (`Functional spec/`).

### Mandatory Directives & Constraints:
1. **SSOT & Spec-Driven Development**: Every action, API call, database query, and UI element MUST trace back to a functional spec in `Functional spec/` and technical spec in `Technical spec/`.
2. **Domain Branding Rules**: Strictly enforce domain naming directives. NEVER use generic placeholder terms such as "CMS Management System", "CMS Admin Portal", "Admin Portal", or "CMS Dashboard". ALWAYS use "Tea Cottage" or "Tea Cottage Portal".
3. **No Interactive Prompts**: Execute all build, seed, test, and browser automation steps autonomously without asking the user to manually click buttons or run scripts.
4. **4-Stage Quality Workflow**: Execute and report on all 4 stages:
   - **Stage 1 (Dev & Environment Verification)**: Build, type-check, and database seeding verification.
   - **Stage 2 (Code Review & Audit)**: Verify SOLID principles, Zod schemas, Argon2id security guards, and domain branding compliance.
   - **Stage 3 (QA & Automated E2E Execution)**: Run unit tests (`npx jest`) and browser automation (`npm run test:e2e` or `npm run test:e2e:headed`).
   - **Stage 4 (Synthesis & Workflow Report)**: Output the final 4-Stage Summary Table with explicit PASS/FAIL statuses.

---

### Executable Use Cases Catalog (Derived from Functional Specs):

#### Module 1: Authentication (`Functional spec/01-authentication-spec.md`)
* **UC-AUTH-001 (Staff Credential Login)**:
  - Navigates to `/admin/login`.
  - Enters email (`admin@teacottage.com`) and password (`SuperSecurePassword123!`).
  - Verifies form submit generates `POST /api/v1/admin/auth/login`.
  - Verifies HTTP 200 response, setting `tea_cms_session` SameSite HTTP-Only cookie.
  - Verifies redirect to `/admin/dashboard` with user session details.
  - *Failure Flow*: Invalid credentials display error "Invalid email address or password" without crashing or exposing stack traces.

* **UC-AUTH-002 (Session Revocation & Logout)**:
  - Clicks "Logout" in drawer footer.
  - Verifies API invalidates session (`is_revoked = 1` in `user_sessions`).
  - Verifies cookie clearing and redirect to `/admin/login`.
  - Verifies restricted routes (`/admin/dashboard`, `/admin/profile`) return 401/403 or redirect to login.

#### Module 2: Navigation Drawer & Multi-Site Switcher (`Functional spec/02-navigation-drawer-spec.md`)
* **UC-NAV-001 (Drawer Collapse Toggle)**:
  - Clicks collapse toggle button in drawer footer.
  - Verifies layout transitions smoothly between expanded (`240px`) and collapsed (`64px`) icon-only mode.
  - Verifies `tea_drawer_collapsed=true` cookie is set and persists across reloads.

* **UC-NAV-002 (Active Site Context Switcher)**:
  - Clicks `nav-site-switcher` dropdown header.
  - Selects assigned tenant site (e.g. "Tea Cottage Website").
  - Verifies `tea_active_site_id` cookie updates and page scope refreshes seamlessly.

#### Module 3: Logged User Profile & Password Security (`Functional spec/03-user-profile-spec.md`)
* **UC-USR-001 (Profile Information Update)**:
  - Navigates to `/admin/profile`.
  - Edits First Name and Last Name fields.
  - Clicks "Save Changes" (`PATCH /api/v1/admin/users/me`).
  - Verifies database update and immutable audit log entry (`PROFILE_UPDATE`).

* **UC-USR-002 (Account Password Change & Session Revocation)**:
  - Navigates to `/admin/profile`.
  - Enters Current Password, New Compliant Password (12+ chars, uppercase, lowercase, number, special char).
  - Clicks "Update Password" (`POST /api/v1/admin/users/me/password`).
  - Verifies Argon2id password re-hashing and revocation of all other concurrent sessions (`is_revoked = 1`).

---

### Step-by-Step AI Execution Instructions:

1. **Environment Setup & Database Seeding**:
   - Verify Node.js environment and MSSQL / LocalDB database connection.
   - Run seed script: `powershell -ExecutionPolicy Bypass -File ./scripts/seed-localdb.ps1`.
2. **Type Safety & Build Verification**:
   - Run TypeScript check: `npx tsc --noEmit`.
   - Run Next.js production build: `npx next build`.
3. **Automated Unit & Integration Testing**:
   - Run Jest suite: `npx jest`.
4. **End-to-End Playwright Automated Testing**:
   - Run E2E suite in background mode: `npm run test:e2e`.
   - To open a visible Chromium browser for live UI inspection: `npm run test:e2e:headed`.
5. **Defect Detection & Remediation**:
   - If any test fails, inspect full logs, locate exact code/spec mismatch, apply fix, and re-verify.
6. **Synthesis**:
   - Summarize test coverage, trace IDs (`UC-*` -> `TC-*`), and output the final 4-Stage Workflow Table.
```

---

## 2. Requirements & QA Test Case Traceability Matrix (RTM)

| Module | System Use Case ID | QA Test Case ID | Test Description | Execution Command | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Authentication** | `UC-AUTH-001` | `TC-AUTH-001` | Valid Staff Login & Cookie Issuance | `npm run test:e2e` | `PASS` |
| **Authentication** | `UC-AUTH-001` | `TC-AUTH-002` | Invalid Credential Rejection | `npx jest` | `PASS` |
| **Authentication** | `UC-AUTH-002` | `TC-AUTH-003` | Session Invalidation & Logout | `npm run test:e2e` | `PASS` |
| **Navigation** | `UC-NAV-001` | `TC-NAV-001` | Drawer Collapse Toggle & Cookie Persistence | `npm run test:e2e` | `PASS` |
| **Navigation** | `UC-NAV-002` | `TC-NAV-002` | Multi-Site Context Switching | `npm run test:e2e` | `PASS` |
| **User Profile** | `UC-USR-001` | `TC-USR-001` | Profile First & Last Name Update | `npm run test:e2e` | `PASS` |
| **User Profile** | `UC-USR-002` | `TC-USR-002` | Argon2id Password Change & Revocation | `npm run test:e2e` | `PASS` |

---

## 3. 4-Stage Development & Verification Workflow Standard

```mermaid
graph TD
    Stage1[Stage 1: Development & LocalDB Verification] --> Stage2[Stage 2: Code Review & Security Audit]
    Stage2 --> Stage3[Stage 3: QA & Playwright E2E Verification]
    Stage3 --> Stage4[Stage 4: Final Synthesis & Summary Table]
```

### Stage Summary Verification Template:

| Stage | Process Description | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **Stage 1** | LocalDB Migration & Next.js Build | `npx tsc --noEmit` & `npx next build` | **PASS** |
| **Stage 2** | Code Audit (SOLID, Zod, Argon2id, Domain Branding) | Manual / Automated Linters | **PASS** |
| **Stage 3** | Automated Testing (Jest & Playwright E2E) | `npx jest` & `npm run test:e2e` | **PASS** |
| **Stage 4** | Workflow Synthesis & RTM Mapping | 1-to-1 Specification Mapping | **PASS** |
