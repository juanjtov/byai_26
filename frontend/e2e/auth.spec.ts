/**
 * E2E tests for authentication flows.
 *
 * Tests:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Signup flow
 * - Logout
 * - Protected route redirection
 * - Session persistence
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('shows login form', async ({ page }) => {
      await page.goto('/login')

      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/login')

      await page.getByLabel(/email/i).fill('invalid@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()

      // Should show error message
      await expect(page.getByText(/invalid|error|failed/i)).toBeVisible({ timeout: 10000 })
    })

    test('shows validation for empty fields', async ({ page }) => {
      await page.goto('/login')

      // Try to submit without filling fields
      await page.getByRole('button', { name: /sign in/i }).click()

      // HTML5 validation should prevent submission
      await expect(page.getByLabel(/email/i)).toBeFocused()
    })

    test('has link to signup page', async ({ page }) => {
      await page.goto('/login')

      const signupLink = page.getByRole('link', { name: /sign up|create account|register/i })
      await expect(signupLink).toBeVisible()

      await signupLink.click()
      await expect(page).toHaveURL(/\/signup/)
    })
  })

  test.describe('Signup', () => {
    test('shows signup form', async ({ page }) => {
      await page.goto('/signup')

      await expect(page.getByRole('heading', { name: /sign up|create|register/i })).toBeVisible()
      await expect(page.getByLabel(/company|organization/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
    })

    test('has link to login page', async ({ page }) => {
      await page.goto('/signup')

      const loginLink = page.getByRole('link', { name: /sign in|log in|already have/i })
      await expect(loginLink).toBeVisible()

      await loginLink.click()
      await expect(page).toHaveURL(/\/login/)
    })

    test('shows validation for weak password', async ({ page }) => {
      await page.goto('/signup')

      await page.getByLabel(/company|organization/i).fill('Test Company')
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('123')  // Too weak

      await page.getByRole('button', { name: /sign up|create|register/i }).click()

      // Should show password error or stay on page
      await expect(page).toHaveURL(/\/signup/)
    })
  })

  test.describe('Protected Routes', () => {
    test('redirects to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('redirects to login when accessing profile without auth', async ({ page }) => {
      await page.goto('/dashboard/profile')

      await expect(page).toHaveURL(/\/login/)
    })

    test('redirects to login when accessing documents without auth', async ({ page }) => {
      await page.goto('/dashboard/documents')

      await expect(page).toHaveURL(/\/login/)
    })

    test('redirects to login when accessing pricing without auth', async ({ page }) => {
      await page.goto('/dashboard/pricing')

      await expect(page).toHaveURL(/\/login/)
    })

    test('redirects to login when accessing chat without auth', async ({ page }) => {
      await page.goto('/dashboard/chat')

      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Landing Page', () => {
    test('shows landing page without auth', async ({ page }) => {
      await page.goto('/')

      // Should show landing page content
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Should have navigation to login/signup
      await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible()
    })

    test('can navigate to login from landing', async ({ page }) => {
      await page.goto('/')

      await page.getByRole('link', { name: /sign in|log in/i }).click()

      await expect(page).toHaveURL(/\/login/)
    })
  })
})

// Authenticated tests would require test fixtures with mock auth
// These are skipped by default and can be enabled with proper setup
test.describe('Authenticated User', () => {
  test.skip('can access dashboard after login', async ({ page }) => {
    // This test requires setting up authentication state
    // Either through Supabase test accounts or mocked auth
  })

  test.skip('logout clears session and redirects', async ({ page }) => {
    // This test requires authenticated state first
  })

  test.skip('session persists across page refresh', async ({ page }) => {
    // This test requires authenticated state
  })
})
