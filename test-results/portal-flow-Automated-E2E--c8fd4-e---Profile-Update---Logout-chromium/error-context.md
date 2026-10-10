# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: portal-flow.spec.ts >> Automated E2E Browser Testing Suite (Zero Human Interaction) >> Complete User Journey: Login -> Dashboard -> Drawer Toggle -> Profile Update -> Logout
- Location: tests\e2e\portal-flow.spec.ts:4:7

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 120000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Tea Cottage Portal" [level=1] [ref=e10]
    - paragraph [ref=e11]: Management Portal for Tea Cottage & Managed Properties
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - heading "Staff Authentication" [level=2] [ref=e15]
        - paragraph [ref=e16]: Sign in with your authorized credentials
      - generic [ref=e17]: Secure SSO
    - generic [ref=e20]:
      - generic [ref=e21]:
        - text: Email Address
        - textbox "admin@teacottage.com" [ref=e27]
      - generic [ref=e28]:
        - generic [ref=e29]: Password
        - generic [ref=e30]:
          - textbox "••••••••••••" [ref=e35]
          - button [ref=e36]
      - button "Sign In to Portal" [ref=e40]
  - paragraph [ref=e41]: Strictly for authorized staff. Tea Cottage Portal v1.0
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Automated E2E Browser Testing Suite (Zero Human Interaction)', () => {
  4  |   test('Complete User Journey: Login -> Dashboard -> Drawer Toggle -> Profile Update -> Logout', async ({ page, context }) => {
  5  |     // 1. Test Login Page UI (Unauthenticated Route)
  6  |     await page.goto('/admin/login');
  7  |     await expect(page).toHaveURL(/\/admin\/login/);
  8  |     await expect(page.locator('h1')).toContainText('Tea Cottage Portal');
> 9  |     await page.waitForTimeout(1500);
     |                ^ Error: page.waitForTimeout: Test timeout of 120000ms exceeded.
  10 | 
  11 |     // Fill Credentials
  12 |     await page.fill('input[name="email"]', 'admin@teacottage.com');
  13 |     await page.fill('input[name="password"]', 'SuperSecurePassword123!');
  14 |     await page.waitForTimeout(1000);
  15 | 
  16 |     // Set Admin Session Cookie for seamless authenticated navigation
  17 |     await context.addCookies([
  18 |       {
  19 |         name: 'cms_admin_session',
  20 |         value: 'e2e-automated-test-session-token',
  21 |         domain: 'localhost',
  22 |         path: '/',
  23 |         httpOnly: true,
  24 |         secure: false,
  25 |         sameSite: 'Lax',
  26 |       },
  27 |     ]);
  28 | 
  29 |     // Click Sign In Button to execute authentication submit flow
  30 |     const signInBtn = page.locator('button[type="submit"]:has-text("Sign In to Portal")');
  31 |     await expect(signInBtn).toBeVisible();
  32 |     await signInBtn.click();
  33 | 
  34 |     // Verify automatic login redirect to Dashboard
  35 |     await page.goto('/admin/dashboard');
  36 |     await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
  37 |     await expect(page.locator('h1')).toContainText('Tea Cottage Dashboard');
  38 |     await page.waitForTimeout(1500);
  39 | 
  40 |     // 2. Test NavDrawer Collapse Toggle (240px -> 64px)
  41 |     const toggleBtn = page.locator('button[aria-label*="navigation drawer"]');
  42 |     await expect(toggleBtn).toBeVisible();
  43 |     await toggleBtn.click();
  44 |     await page.waitForTimeout(1500); // Visual pause while collapsed
  45 | 
  46 |     // Expand NavDrawer back
  47 |     await toggleBtn.click();
  48 |     await page.waitForTimeout(1500);
  49 | 
  50 |     // 3. Navigate to Profile Page
  51 |     const profileLink = page.locator('a[href="/admin/profile"]').first();
  52 |     await profileLink.click();
  53 |     await expect(page).toHaveURL(/\/admin\/profile/, { timeout: 10000 });
  54 |     await expect(page.locator('h1')).toContainText('Staff Member Profile');
  55 |     await page.waitForTimeout(1500);
  56 | 
  57 |     // 4. Test Profile Info Form Update
  58 |     await page.fill('input[name="firstName"]', 'AutomatedFirst');
  59 |     await page.fill('input[name="lastName"]', 'AutomatedLast');
  60 |     await page.waitForTimeout(1000);
  61 |     
  62 |     // Click Save Personal Details button
  63 |     const saveBtn = page.locator('button:has-text("Save Personal Details")');
  64 |     await expect(saveBtn).toBeVisible();
  65 |     await saveBtn.click();
  66 |     await page.waitForTimeout(2000);
  67 | 
  68 |     // 5. Test Logout Workflow
  69 |     const logoutBtn = page.locator('button[aria-label*="Log out"]').first();
  70 |     await expect(logoutBtn).toBeVisible();
  71 |     await logoutBtn.click();
  72 | 
  73 |     // Verify automatic redirect to login page
  74 |     await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  75 |     await expect(page.locator('h1')).toContainText('Tea Cottage Portal');
  76 |     await page.waitForTimeout(5000); // Keep browser open for user review
  77 |   });
  78 | });
  79 | 
```