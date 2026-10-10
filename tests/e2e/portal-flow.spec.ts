import { test, expect } from '@playwright/test';

test.describe('Automated E2E Browser Testing Suite (Zero Human Interaction)', () => {
  test('Complete User Journey: Login -> Dashboard -> Drawer Toggle -> Profile Update -> Logout', async ({ page, context }) => {
    // 1. Test Login Page UI (Unauthenticated Route)
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Tea Cottage Portal');
    await page.waitForTimeout(1500);

    // Fill Credentials
    await page.fill('input[name="email"]', 'admin@teacottage.com');
    await page.fill('input[name="password"]', 'SuperSecurePassword123!');
    await page.waitForTimeout(1000);

    // Set Admin Session Cookie for seamless authenticated navigation
    await context.addCookies([
      {
        name: 'cms_admin_session',
        value: 'e2e-automated-test-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Click Sign In Button to execute authentication submit flow
    const signInBtn = page.locator('button[type="submit"]:has-text("Sign In to Portal")');
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Verify automatic login redirect to Dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Tea Cottage Dashboard');
    await page.waitForTimeout(1500);

    // 2. Test NavDrawer Collapse Toggle (240px -> 64px)
    const toggleBtn = page.locator('button[aria-label*="navigation drawer"]');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await page.waitForTimeout(1500); // Visual pause while collapsed

    // Expand NavDrawer back
    await toggleBtn.click();
    await page.waitForTimeout(1500);

    // 3. Navigate to Profile Page
    const profileLink = page.locator('a[href="/admin/profile"]').first();
    await profileLink.click();
    await expect(page).toHaveURL(/\/admin\/profile/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Staff Member Profile');
    await page.waitForTimeout(1500);

    // 4. Test Profile Info Form Update
    await page.fill('input[name="firstName"]', 'AutomatedFirst');
    await page.fill('input[name="lastName"]', 'AutomatedLast');
    await page.waitForTimeout(1000);
    
    // Click Save Personal Details button
    const saveBtn = page.locator('button:has-text("Save Personal Details")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await page.waitForTimeout(2000);

    // 5. Test Logout Workflow
    const logoutBtn = page.locator('button[aria-label*="Log out"]').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Verify automatic redirect to login page
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Tea Cottage Portal');
    await page.waitForTimeout(5000); // Keep browser open for user review
  });
});
