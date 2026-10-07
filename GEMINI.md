# AI Agent Directives & Project Rules

This document outlines the mandatory rules and guidelines for AI agents working on the **Tea Cottage & Multi-Site CMS Portal** project.

---

## 1. Spec-Driven Development & SSOT
1. **Functional Spec is Single Source of Truth (SSOT)**: All business requirements, user roles, permissions, user flows, and acceptance criteria MUST originate in `Functional spec/`.
2. **Matching Filenames**: Every functional spec MUST have a corresponding technical spec with identical naming:
   - `Functional spec/<spec-name>.md`
   - `Technical spec/<spec-name>.md`
3. **No Unspec'd Features**: Never implement features in code or Technical Specs without updating the Functional Spec first.

---

## 2. Technology Stack Standards
* **Framework**: Next.js 14+ (App Router, TypeScript, React Server Components).
* **Database**: MySQL 8.0+ (InnoDB, UTF8mb4, UUID keys).
* **Styling & UI**: Modern CSS / Tailwind CSS with custom design tokens.
* **Security**: Argon2id password hashing, Next.js Middleware route guards, SameSite HTTP-Only cookies.

---

## 3. UI/UX Design System Rules
* **Aesthetics**: Premium, modern admin portal interface with curated color palettes, clear contrast, and smooth micro-interactions.
* **Component Architecture**: Modular, accessible React components (`/components/ui/`, `/components/admin/`).
* **No Placeholders**: Use clear, realistic content or generated assets rather than dummy lorem ipsum where possible.
