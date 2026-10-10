---
name: spec-driven-development
description: >-
  Use this skill when planning, creating, or updating functional specifications,
  technical specifications, and spec-driven workflows for the CMS project.
---

# Spec-Driven Development Workflow

This skill guides the agent through maintaining and updating the specification-driven development workflow for the CMS Management System.

## Principles

1. **Functional Spec is Single Source of Truth (SSOT)**:
   - Always update `Functional spec/<number>-<module>-spec.md` first before changing technical specs or writing code.
2. **Matching Pair Structure**:
   - For every functional spec file in `Functional spec/`, ensure a matching technical spec exists in `Technical spec/` with the exact same filename.
3. **Strict Out-of-Scope Blocking**:
   - Any requested feature, component, API route, or database schema modification NOT documented in `Functional spec/` MUST be **BLOCKED as Out of Scope**.
   - The agent MUST stop execution, declare the request Out of Scope, and update the Functional Spec first before writing code.

---

## Step-by-Step Procedure

### 1. Functional Specification Creation / Modification
* Check if `Functional spec/<number>-<module>-spec.md` exists.
* **Mandatory Functional Spec Structure**:
  1. **SSOT Governance Header & Metadata**: Document ID (`FS-<MODULE>-001`), Version, Authority.
  2. **Executive Summary & System Boundary**: Scope, objectives, architecture.
  3. **User Personas & User Stories**:
     - Standard format: `As a <Role>, I want <Goal>, so that <Benefit>`.
  4. **Detailed Use Cases (`UC-<MODULE>-<ID>`)**:
     - Unique Use Case Identifier (e.g. `UC-AUTH-001: Staff Member Login`).
     - Primary Actor, Preconditions, Main Success Scenario (Step-by-step), Alternative/Error Flows, and Postconditions.
  5. **Workflow Diagrams (Mermaid)**: Visual state transitions and sequence diagrams.
  6. **Permission Matrix & RBAC Rules**: Role-based action definitions.
  7. **Conceptual Data Model (ERD)**: Entities, attributes, and relationships.
  8. **API Endpoint Specifications**: Request/response contracts and status codes.
  9. **Acceptance Criteria & QA Test Case Traceability**: Mapping `FS-<MODULE>-<ID>` $\rightarrow$ `UC-<MODULE>-<ID>` $\rightarrow$ `TC-<MODULE>-<ID>`.

### 2. Technical Specification Alignment
* Create or update `Technical spec/<number>-<module>-spec.md`.
* Include SSOT Traceability Reference, Physical MySQL 8.0+ DDL Scripts (`CREATE TABLE`, foreign keys, indexes), Next.js App Router code patterns, and Traceability Matrix.

### 3. Verification
* Ensure all database columns in the DDL map 1-to-1 to the conceptual fields defined in the Functional Spec.
* Confirm that no unexpected business logic was added to the Technical Spec that is absent from the Functional Spec.

---

### 4. Semantic Naming Conventions Rule
* **Meaningful Domain Names**: Never use ambiguous names (e.g. use `cms_sessions` or `user_sessions` instead of `admin_sessions` when tracking sessions for all CMS portal users).
* **Database Tables**: Plural `snake_case` (`users`, `sites`, `cms_sessions`, `user_site_roles`).
* **Files & Folders**: `kebab-case` (`site-context.ts`, `admin-login-flow.test.ts`).
* **Code & Variables**: `PascalCase` for Components/Schemas (`LoginSchema`, `SiteSelector`), `camelCase` for functions/variables (`verifyPassword`, `generateSessionToken`). Avoid vague abbreviations (`paramIndex` instead of `p0`).

---

### 5. Prompt Directory Standard
* **Mandatory Prompts Folder**: Whenever a prompt specification, master prompt, or execution prompt file is created, it MUST be saved inside the `Prompts/` directory (e.g. `Prompts/MASTER_PROMPT.md` or `Prompts/<prompt-name>.md`). Never save prompt files in the project root directory.

