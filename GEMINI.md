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
