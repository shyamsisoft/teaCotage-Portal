# Functional Specification: Site Settings Module

| Document Metadata | Value |
| :--- | :--- |
| **Document ID** | FS-SS-005 |
| **Authority** | **SINGLE SOURCE OF TRUTH (SSOT)** for Multi-Tenant Property Settings & Configuration |
| **Module Name** | Core Identity, Multi-Tenant Site Settings & Configuration |
| **System Scope** | Multi-Site Management Portal (Tea Cottage & Future Managed Sites) |
| **Target Technology Stack** | **Next.js 14+** (App Router / React) & **MySQL 8.0+** |
| **Status** | Approved |
| **Version** | 1.0.0 |
| **Author** | System Architecture Team |

> [!IMPORTANT]
> **Single Source of Truth (SSOT) Governance**:
> This Functional Specification is the authoritative Single Source of Truth (SSOT) for all business logic, site configuration management rules, domain mapping rules, security audit tracking, and UI layouts for the Site Settings page (`/admin/settings`). Any Technical Specification, database query, or React component MUST strictly conform to this document.

---

## 1. Executive Summary & Scope

### 1.1 Objective
The purpose of this document is to define the functional, security, UX, data, and API specifications for the **Site Settings Module** within the Tea Cottage Portal.

The Site Settings page (`/admin/settings`) enables authorized site administrators and super administrators to view, inspect, and update property settings for managed tenant sites (e.g. Tea Cottage Website), including the site display name, custom domain mapping, and property active status.

### 1.2 User Capabilities
1. **Managed Properties Directory**: View all tenant properties registered in the portal system.
2. **Property Details & Domain Configuration**: Inspect and edit property attributes:
   - **Site Name**: Human-readable title of the website/property.
   - **Site Slug**: Unique immutable system key (`tea-cottage`).
   - **Custom Domain**: Configured domain name (e.g., `teacottage.com`).
   - **Property Status**: Active status toggle (`ACTIVE` / `INACTIVE`).
3. **Audit Trail Logging**: Generate `SITE_UPDATE` records in `admin_audit_logs`.

### 1.3 User Stories

* **US-SS-01 (Site Lookup & Selection)**: As a site administrator, I want to select and inspect the properties of a managed site, so that I can review its current configuration.
* **US-SS-02 (Site Settings Modification)**: As a site administrator, I want to update the site name, domain, and status, so that property details remain up to date.

---

## 2. Security & Validation Rules

### 2.1 Access Requirements
- Requires active authenticated admin session token (`cms_admin_session` cookie).

### 2.2 Validation Rules
- **Site Name**: Required string, 1–255 characters.
- **Custom Domain**: Optional string, valid domain format.
- **Is Active**: Boolean value.

---

## 3. API Interface Specifications

| Method | Route | Purpose | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/sites` | List all managed tenant sites | Authenticated Admin |
| `GET` | `/api/v1/admin/sites/[id]` | Fetch single site details by ID | Authenticated Admin |
| `PATCH` | `/api/v1/admin/sites/[id]` | Update site name, domain & active status | Authenticated Admin |

---

## 4. Requirements Traceability Matrix (RTM)

| Requirement Code | User Story ID | QA Test Case ID | Description |
| :--- | :--- | :--- | :--- |
| `FS-SS-01` | `US-SS-01` | `TC-SS-001` | List and lookup managed site properties |
| `FS-SS-02` | `US-SS-02` | `TC-SS-002` | Update site name, domain, and active status |
| `FS-SS-03` | `US-SS-02` | `TC-SS-003` | Generate audit log (`SITE_UPDATE`) for site changes |
