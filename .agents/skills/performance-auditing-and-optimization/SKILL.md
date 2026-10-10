---
name: performance-auditing-and-optimization
description: >-
  Mandatory post-implementation performance auditing, database pool eager warmup,
  and async operation optimization for Tea Cottage Portal APIs and DB queries.
---

# Performance Auditing & Optimization Skill

## Overview
This skill enforces post-implementation performance auditing and optimization for all API endpoints, database queries, and UI components in the **Tea Cottage Portal**. Any functionality created or refactored MUST be audited for latency bottlenecks and optimized before final synthesis.

## Core Rules & Mandates

### 1. Mandatory Post-Implementation Performance Verification
- Every API endpoint or background operation MUST be audited for execution time upon completion of functional code.
- If response latency exceeds 300ms, the root cause MUST be identified and optimized immediately.

### 2. Multi-Environment DB Optimization Standards
- **Eager Connection Pool Warmup**: Pre-warm connection pools (`MSSQL` / `MySQL`) on module load (`getMssqlPool().catch(() => {})`) to eliminate cold-start latency when users execute initial requests.
- **Concurrent Async Operations**: Execute independent DB queries, session revocation, and security audit logging concurrently using `Promise.all([ ... ])` rather than sequential blocking `await` chains.
- **Static Pre-computation**: Avoid dynamic hashing (e.g. Argon2id) inside fallback paths. Use static pre-computed hash constants for static credentials.
- **No Mock Fallbacks in APIs**: Never return hardcoded dummy fallback user/session objects in production API routes. Let the database return exact 401/404 responses.

---

## Performance Verification Workflow

### Step 1: Execute Latency Audit
Check initial response times for target endpoints (e.g. `/api/v1/admin/auth/login`, `/api/v1/admin/auth/logout`, `/api/v1/admin/users/me`).

### Step 2: Apply Optimization Patterns
1. In `lib/db.ts`: Enable eager pool warmup on module load.
2. In API route handlers: Convert sequential `await executeQuery(...)` statements into `Promise.all(...)` where independent.
3. In authentication handlers: Replace dynamic `hashPassword()` fallback calls with static Argon2id pre-computed hashes.

### Step 3: Run Full Verification Suite
```bash
npx tsc --noEmit
npx jest
npx next build
```
