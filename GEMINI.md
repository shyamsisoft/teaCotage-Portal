# AI Agent Directives & Project Rules

This document outlines the mandatory rules and software engineering principles for AI agents working on the **Tea Cottage & Multi-Site CMS Portal** project.

---

## 1. Spec-Driven Development & SSOT
1. **Functional Spec is Single Source of Truth (SSOT)**: All business requirements, user roles, permissions, user flows, and acceptance criteria MUST originate in `Functional spec/`.
2. **Matching Filenames**: Every functional spec MUST have a corresponding technical spec with identical naming:
   - `Functional spec/<spec-name>.md`
   - `Technical spec/<spec-name>.md`
3. **No Unspec'd Features**: Never implement features in code or Technical Specs without updating the Functional Spec first.
4. **Strict Scope Enforcement & Out of Scope Blocking**: Any requested feature, component, API endpoint, or database schema change NOT explicitly documented in a `Functional spec/` file MUST be **BLOCKED as Out of Scope**. The AI agent MUST stop execution, inform the user that the feature is Out of Scope, and update the Functional Spec (SSOT) first before implementing any technical code.

---

## 2. Core Software Engineering & Code Principles
* **SOLID Principles**:
  - **Single Responsibility (SRP)**: Keep components, API handlers, and helpers focused on a single responsibility.
  - **Open/Closed (OCP)**: Design extensible schemas and UI components without modifying existing core logic.
  - **Dependency Inversion (DIP)**: Depend on abstractions (interfaces, types, helpers) rather than concrete implementations.
* **DRY (Don't Repeat Yourself)**: Extract reusable UI primitives into `/components/ui/` and database/auth helpers into `/lib/`.
* **KISS & YAGNI**: Keep implementation simple and focused on specified requirements. Avoid premature over-engineering.
* **Clean Layered Architecture**: Clear separation between UI Layer (React Components), API Gateway Layer (Next.js Route Handlers / Server Actions), Business Logic Layer (`/lib`), and Data Layer (MySQL queries).
* **Strict Type Safety**: Full TypeScript strict mode. Use **Zod** schemas for runtime API & form validation.
* **Security by Default**: Parameterized MySQL queries (prevent SQLi), input sanitization (prevent XSS), SameSite HTTP-Only cookies, and strict RBAC permission guards.

---

## 3. Technology Stack Standards
* **Framework**: Next.js 14+ (App Router, TypeScript, React Server Components).
* **Database**: MySQL 8.0+ (InnoDB, UTF8mb4, UUID keys).
* **Styling & UI**: Modern CSS / Tailwind CSS with custom design tokens.
* **Security**: Argon2id password hashing, Next.js Middleware route guards, SameSite HTTP-Only cookies.

---

## 4. UI/UX Design System Rules
* **Aesthetics**: Premium, modern admin portal interface with curated color palettes, clear contrast, and smooth micro-interactions.
* **Component Architecture**: Modular, accessible React components (`/components/ui/`, `/components/admin/`).
* **No Placeholders**: Use clear, realistic content or generated assets rather than dummy lorem ipsum where possible.

---

## 5. Semantic Naming Conventions (Database, Files & Code)
1. **Meaningful Domain Naming**:
   - All table names, column names, file names, and code symbols MUST be self-describing and semantically accurate to their domain scope.
   - Avoid misleading names (e.g. use `cms_sessions` or `user_sessions` rather than `admin_sessions` when serving all CMS portal users).
2. **Database Schemas**:
   - Use plural `snake_case` for tables (`users`, `sites`, `user_site_roles`, `cms_sessions`).
   - Use explicit foreign keys (`user_id`, `site_id`, `role_id`) and standard timestamp fields (`created_at`, `updated_at`, `expires_at`).
3. **Files & Directories**:
   - Use `kebab-case` for TypeScript files, components, tests, and directories (`site-context.ts`, `admin-login-flow.test.ts`).
4. **Code & Variables**:
   - Use PascalCase for React components and Zod schemas (`LoginSchema`, `SiteSelector`).
   - Use camelCase for functions and variables (`verifyPassword`, `generateSessionToken`).
   - Never use cryptic abbreviations (`usr`, `p0`, `dbSess`); use full, meaningful domain names.

---

## 6. Prohibited Terminology & Product Naming Directives
1. **Strict Prohibition of Generic Terms**:
   - Do NOT use generic placeholder terms or phrases such as `"CMS Management System"`, `"CMS Admin Portal"`, `"Admin Portal"`, `"CMS Portal"`, or `"CMS Admin Dashboard"` in UI copy, page headers, button labels, logs, or new specifications.
2. **Mandatory Domain Branding**:
   - Always use explicit, domain-accurate names such as **"Tea Cottage"** or **"Tea Cottage Portal"** (or specific tenant site names).

---

## 7. Mandatory 4-Stage Development & Quality Workflow
All feature implementations, refactors, and bug fixes MUST execute through a mandatory 4-stage workflow pipeline:

1. **Stage 1: Development Process (including Dev Testing)**:
   - Implement features derived from SSOT specifications (`Functional spec/` & `Technical spec/`).
   - Run automated unit and integration tests (`npx jest`) and TypeScript verification (`npx tsc --noEmit`).
2. **Stage 2: Code Review Process**:
   - Audit code for adherence to SOLID principles, Zod runtime validation, DRY rules, security guards, and Section 6 branding compliance.
3. **Stage 3: QA & Build Verification Process**:
   - Execute production build validation (`npx next build`), verify boundary error handling, 401/403 security gates, and responsive UI layout.
4. **Stage 4: Final Review & Synthesis**:
   - Synthesize all findings and display a visible 4-Stage Workflow Verification Summary Table.

### Workflow Approval Configuration Flag
* **`REQUIRE_STAGE_APPROVAL_GATES`**: `false` *(Default)*
  - When `false`, the AI agent automatically executes Stages 1 through 4 in sequence and provides the complete synthesis summary upon completion.
  - When `true`, the AI agent MUST pause after completing each stage and request explicit approval from the responsible party before proceeding to the next stage.

---

## 8. Requirements Traceability Matrix (RTM) & QA Test Case Standard
For Stage 3 (QA Process), every functional requirement in `Functional spec/` MUST map 1-to-1 to a structured QA Test Case matrix:

1. **Traceability Identifier (RTM)**:
   - Each functional requirement code (`FS-<MODULE>-<ID>`) maps directly to a QA Test Case ID (`TC-<MODULE>-<ID>`).
2. **QA Test Case Matrix Structure**:
   - **Test Case ID**: Unique identifier (`TC-NAV-001`).
   - **Requirement Reference**: Reference code from SSOT (`FS-NAV-02`).
   - **Test Description & Scope**: Clear objective of the test.
   - **Preconditions**: Required session state, cookies, or database records.
   - **Execution Steps**: Step-by-step user or API actions.
   - **Expected Result**: Explicit functional outcome and HTTP status code.
   - **Verification Method**: Automated Jest Integration Test or Build Validation.
   - **Status**: `PASS` | `FAIL` | `BLOCKED`.

---

## 9. Modular CMS & Portal Architecture Directive
1. **CMS Core Engine Primacy (`@/modules/cms`)**: The CMS Core Engine is the primary domain focus of the system. It MUST be modular, headless, and standalone (Pages, Catalog, Blog, Media, Publishing Pipeline, Headless Delivery API).
2. **Admin Portal Shell Client (`@/modules/portal`)**: The Admin Portal ("Tea Cottage Portal") is the management UI shell that consumes the CMS API.
3. **Strict Decoupling Standard**: The Backend API Gateway (`/api/v1/...`) MUST remain framework-agnostic and headless. Backend APIs MUST NEVER depend on React UI components, CSS styling, or Next.js page layouts.

---

## 10. Zero-Developer Content & Page Management Standard
1. **No-Code Staff Self-Service**: Creating new pages, updating menu catalog items, uploading media assets, and building page layouts using pre-designed UI blocks MUST be 100% self-service in the Admin Portal for non-technical staff.
2. **Zero Code Dependency for Content**: Adding a new page or updating existing content MUST NEVER require a developer to write code, modify files, or deploy new builds.

---

## 11. Externalized Configuration & Multi-Environment Database Directive
1. **100% Configurable Environment Settings**: Database connection parameters (`DB_PROVIDER`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`) MUST be 100% externalized in environment files (`.env.local`).
2. **No Hardcoded Credentials**: NEVER hardcode database hostnames, credentials, or connection strings in source code.
3. **Zod Startup Validation**: All machine configurations MUST be validated at application startup using Zod schemas to output human-readable diagnostic messages on misconfigured machines.

---

## 12. Prompt Storage & Organization Standard
1. **Mandatory Prompts Directory**: All prompt specifications, master prompts, and AI execution guides MUST be created and stored inside the `Prompts/` directory (e.g. `Prompts/MASTER_PROMPT.md`). Never create prompt files in the project root directory.

---

## 13. Mandatory Performance Auditing & Optimization Directive
1. **Mandatory Post-Implementation Performance Verification**: After completing the functional implementation of any feature, API endpoint, or UI component, performance MUST be explicitly audited.
2. **Identification & Elimination of Slow Execution Bottlenecks**: If any API handler, query execution, or UI transition exhibits latency (e.g. >300ms for API handlers, blocking database queries, or un-cached connection initialization), the AI agent MUST diagnose the root cause and optimize it immediately before final verification.
3. **Mandatory Optimization Standards**:
   - **Eager Connection Warmup**: Database connection pools MUST be pre-warmed on module load to eliminate cold-start latency.
   - **Concurrent Async Operations**: Independent database queries, security audit logging, and site role lookups MUST run concurrently using `Promise.all` rather than in sequential blocking await chains.
   - **Static Hashing & Pre-computation**: Computationally expensive hashing operations (e.g. Argon2id) MUST be optimized or pre-computed in fallback paths to avoid redundant CPU cycles.

---

## 14. Spec-Drift Detection & Approval Gate

This rule governs what happens when any code change — whether made by a developer or an AI agent — results in a divergence between the implemented code and the existing `Functional spec/` or `Technical spec/` files.

1. **Mandatory Spec-Drift Check After Every Code Change**:
   - After completing any implementation, refactor, or bug fix, the AI agent MUST compare the resulting code against all relevant `Functional spec/` and `Technical spec/` files.
   - If a divergence is detected (i.e. the code does something the spec does not describe, or the spec describes something the code no longer does), the agent MUST **STOP** and report the drift clearly.

2. **Mandatory User Approval Before Any Spec Update**:
   - The AI agent MUST explicitly ask the user:
     > *"The implementation now differs from the spec. Do you want to update the spec to reflect this change?"*
   - The agent MUST present a clear summary of **what changed** and **which spec sections are affected**.
   - The agent MUST **wait for explicit user approval** (`yes` / `approve`) before making any spec update.
   - If the user says **no** or does not approve, the agent MUST NOT modify any spec file, and MUST NOT proceed with further code changes that depend on the unresolved drift.

3. **No Silent Spec Updates**:
   - The AI agent is **strictly prohibited** from autonomously updating any `Functional spec/` or `Technical spec/` file without first detecting a drift, reporting it, and receiving explicit user approval.
   - This applies even when the spec update seems obvious or minor.

4. **No Code Rollback Without Approval**:
   - If the user rejects the spec update, the agent MUST ask whether to:
     a. Revert the code change to match the existing spec, or
     b. Leave the code as-is and flag the drift as a known deviation for future resolution.
   - The agent MUST NOT make this decision autonomously.

5. **Spec Update Scope**:
   - When a spec update is approved, the agent MUST update **both** the matching `Functional spec/<name>.md` AND `Technical spec/<name>.md` files.
   - The functional spec MUST always be updated first (it is the SSOT), followed by the technical spec.
