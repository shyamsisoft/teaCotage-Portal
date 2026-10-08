---
name: app-runner-and-debugger
description: >-
  Use this skill when running pre-flight build checks, validating TypeScript compilation,
  debugging database connection errors, executing Unit & Development Tests, or launching the Next.js CMS Admin Portal dev server.
---

# Application Runner & Automated Debugger Skill

This skill provides copy-pasteable developer commands, AI prompts, and troubleshooting runbooks for pre-flight build checks, database connection errors, and Next.js App Router debugging.

---

## 🔍 TROUBLESHOOTING RUNBOOK: LocalDB & Next.js Database Connection Errors

### Issue: `ConnectionError: [object Object]` or `ETIMEOUT` on `POST /api/v1/admin/auth/login`

#### Symptom:
- Admin Portal Login UI shows: `"Database connection failed. Please ensure local database is running."`
- Terminal log displays:
  ```text
  Database connection error during login: ConnectionError: [object Object]
      at PrivateConnection.callback2 (...\node_modules\mssql\lib\msnodesqlv8\connection-pool.js:46:17)
  ```

#### Root Cause:
1. **Webpack Bundling of Native C++ Addons**:
   - `msnodesqlv8` relies on native Windows C++ binary addons (`sqlserver.node`).
   - Next.js App Router bundles API routes using Webpack/SWC. When Webpack attempts to bundle `msnodesqlv8`, the native binary binding is broken or stripped of context, causing `PrivateConnection.callback2` to fail with `[object Object]`.
2. **Difference Between Standalone Node vs. Next.js App Router**:
   - Standalone Node (`node scripts/test-db-connection.js`) loads native C++ `.node` binaries directly from `node_modules` $\rightarrow$ Works.
   - Next.js API Routes run inside Webpack bundle $\rightarrow$ Fails unless externalized or driven by a pure JS driver/ORM.
3. **Missing `Driver={...}` Attribute in Connection String**:
   - `msnodesqlv8` uses native Windows ODBC. If `.env.local` supplies `MSSQL_CONNECTION_STRING=Server=(localdb)\MSSQLLocalDB;...` without an explicit `Driver={ODBC Driver 17 for SQL Server}` (or 18) attribute, `msnodesqlv8` cannot resolve the ODBC driver on Windows, throwing `ConnectionError: [object Object]`.

#### Remediation Steps:
1. Update `MSSQL_CONNECTION_STRING` in `.env.local` to include `Driver={ODBC Driver 17 for SQL Server};`:
   ```env
   MSSQL_CONNECTION_STRING=Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\MSSQLLocalDB;Database=teacottage_cms;Trusted_Connection=yes;
   ```
2. Externalize native binary packages in `next.config.js`:
   ```javascript
   experimental: {
     serverComponentsExternalPackages: ['msnodesqlv8', 'mssql', 'argon2'],
   }
   ```
3. Or use TCP/IP enabled SQL Server / MySQL pool / Prisma ORM for seamless Next.js App Router bundling.

---

### Issue 2: `RequestError: The variable name '@p1' has already been declared` (SQL Error 134)

#### Symptom:
- Multi-parameter queries (e.g. `UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`) throw 500 error:
  ```text
  RequestError: [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]The variable name '@p1' has already been declared. Variable names must be unique within a query batch or stored procedure.
      at handleError (...\node_modules\mssql\lib\msnodesqlv8\request.js:319:21)
  ```

#### Root Cause:
- `msnodesqlv8` native C++ driver auto-generates internal parameter names starting at `@p1`, `@p2` when preparing query batches.
- Using `@p0`, `@p1` as parameter placeholders causes a direct variable name collision with `msnodesqlv8`'s internal parameter generator.

#### Remediation:
- Prefix parameter inputs with `param0`, `param1` and replace query placeholders with `@param0`, `@param1`:
  ```typescript
  params.forEach((param, index) => {
    request.input(`param${index}`, param);
  });
  let paramIndex = 0;
  const parameterizedQuery = query.replace(/\?/g, () => `@param${paramIndex++}`);
  ```

---

## 🌟 MASTER PROMPT (All-in-One Developer Prompt)

```text
Perform an automated pre-flight build, test, and debug check: First, verify that the Functional Spec (SSOT) and Technical Spec are aligned. Next, run 'npm run validate' to compile TypeScript and check Next.js App Router validity. If any compilation, linting, or prerender errors occur, inspect the exact log stack trace, fix the underlying code following SOLID and Zod validation rules, and re-verify until exit code 0. Next, run 'npm run test:unit' to execute Unit Tests and 'npm run test:dev' to execute Development Integration Tests. Finally, launch 'npm run dev' to serve http://localhost:3000/admin/login and output a visible Verification & Test Summary Table in the chat detailing status for Specs, Build Compilation, Unit Tests, Integration Tests, API Routes, and UI Rendering.
```

---

## Quick Copy-Paste Developer Commands

```bash
# Pre-flight build check, tests & server launch
npm run check

# Standalone build validation check
npm run validate

# Run unit tests
npm run test:unit

# Run dev integration tests
npm run test:dev
```
