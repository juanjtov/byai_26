/**
 * E2E tests for dashboard functionality.
 *
 * Note: These tests require authenticated state.
 * They are skipped by default and can be enabled with proper auth setup.
 */

import { test, expect } from '@playwright/test'

// Helper to setup authenticated state
// In real implementation, this would set up Supabase session
async function setupAuth(page: import('@playwright/test').Page) {
  // This is a placeholder for auth setup
  // Options:
  // 1. Use Supabase test account and login via UI
  // 2. Set localStorage/cookies with valid session
  // 3. Use API to get token and inject into storage
  return false // Return false to skip tests
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const isAuthenticated = await setupAuth(page)
    if (!isAuthenticated) {
      test.skip()
    }
  })

  test.describe('Navigation', () => {
    test('shows sidebar with all menu items', async ({ page }) => {
      await page.goto('/dashboard')

      // Check sidebar items exist
      await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /company profile/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /documents/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /pricing/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /ai estimator/i })).toBeVisible()
    })

    test('highlights active menu item', async ({ page }) => {
      await page.goto('/dashboard')

      const dashboardLink = page.getByRole('link', { name: /dashboard/i })
      await expect(dashboardLink).toHaveClass(/active|copper|selected/)
    })

    test('navigates to profile page', async ({ page }) => {
      await page.goto('/dashboard')

      await page.getByRole('link', { name: /company profile/i }).click()

      await expect(page).toHaveURL(/\/dashboard\/profile/)
    })

    test('navigates to documents page', async ({ page }) => {
      await page.goto('/dashboard')

      await page.getByRole('link', { name: /documents/i }).click()

      await expect(page).toHaveURL(/\/dashboard\/documents/)
    })

    test('navigates to pricing page', async ({ page }) => {
      await page.goto('/dashboard')

      await page.getByRole('link', { name: /pricing/i }).click()

      await expect(page).toHaveURL(/\/dashboard\/pricing/)
    })

    test('navigates to chat page', async ({ page }) => {
      await page.goto('/dashboard')

      await page.getByRole('link', { name: /ai estimator/i }).click()

      await expect(page).toHaveURL(/\/dashboard\/chat/)
    })
  })

  test.describe('Dashboard Page', () => {
    test('shows onboarding checklist', async ({ page }) => {
      await page.goto('/dashboard')

      // Should have onboarding steps
      await expect(page.getByText(/profile|company/i)).toBeVisible()
      await expect(page.getByText(/document|upload/i)).toBeVisible()
      await expect(page.getByText(/pricing|rate/i)).toBeVisible()
    })

    test('shows user/org name in header', async ({ page }) => {
      await page.goto('/dashboard')

      // Header should show org name or user email
      const header = page.locator('header')
      await expect(header).toBeVisible()
    })

    test('has sign out button', async ({ page }) => {
      await page.goto('/dashboard')

      await expect(page.getByRole('button', { name: /sign out|logout/i })).toBeVisible()
    })
  })

  test.describe('Profile Page', () => {
    test('shows company profile form', async ({ page }) => {
      await page.goto('/dashboard/profile')

      await expect(page.getByLabel(/company name/i)).toBeVisible()
      await expect(page.getByLabel(/address/i)).toBeVisible()
      await expect(page.getByLabel(/phone/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })

    test('shows brand color pickers', async ({ page }) => {
      await page.goto('/dashboard/profile')

      await expect(page.getByLabel(/primary color/i)).toBeVisible()
      await expect(page.getByLabel(/secondary color/i)).toBeVisible()
    })

    test('has save button', async ({ page }) => {
      await page.goto('/dashboard/profile')

      await expect(page.getByRole('button', { name: /save/i })).toBeVisible()
    })
  })

  test.describe('Documents Page', () => {
    test('shows upload section', async ({ page }) => {
      await page.goto('/dashboard/documents')

      // Should have upload button or dropzone
      await expect(page.getByText(/upload|drag|drop/i)).toBeVisible()
    })

    test('shows document list', async ({ page }) => {
      await page.goto('/dashboard/documents')

      // Should have a documents list area (even if empty)
      await expect(page.locator('[data-testid="documents-list"], .documents-list, section')).toBeVisible()
    })
  })

  test.describe('Pricing Page', () => {
    test('shows pricing configuration', async ({ page }) => {
      await page.goto('/dashboard/pricing')

      await expect(page.getByLabel(/labor rate|hourly/i)).toBeVisible()
      await expect(page.getByLabel(/overhead|markup/i)).toBeVisible()
      await expect(page.getByLabel(/profit/i)).toBeVisible()
    })

    test('shows labor items section', async ({ page }) => {
      await page.goto('/dashboard/pricing')

      await expect(page.getByText(/labor items/i)).toBeVisible()
    })

    test('shows AI readiness indicator', async ({ page }) => {
      await page.goto('/dashboard/pricing')

      await expect(page.getByText(/ai ready|readiness/i)).toBeVisible()
    })
  })

  test.describe('Chat Page', () => {
    test('shows chat interface', async ({ page }) => {
      await page.goto('/dashboard/chat')

      // Should have message input
      await expect(page.getByPlaceholder(/message|estimate|type/i)).toBeVisible()
    })

    test('shows send button', async ({ page }) => {
      await page.goto('/dashboard/chat')

      await expect(page.getByRole('button', { name: /send/i })).toBeVisible()
    })

    test('shows saved conversations list', async ({ page }) => {
      await page.goto('/dashboard/chat')

      // Should have conversations sidebar or section
      await expect(page.getByText(/saved|conversations|history/i)).toBeVisible()
    })
  })
})
