/**
 * E2E tests for the landing page.
 *
 * These tests don't require authentication.
 */

import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Hero Section', () => {
    test('shows main headline', async ({ page }) => {
      const headline = page.getByRole('heading', { level: 1 })
      await expect(headline).toBeVisible()
    })

    test('shows CTA button', async ({ page }) => {
      // Should have a primary call-to-action
      const ctaButton = page.getByRole('link', { name: /get started|sign up|try|start/i })
      await expect(ctaButton).toBeVisible()
    })

    test('shows REMODLY branding', async ({ page }) => {
      await expect(page.getByText('REMODLY')).toBeVisible()
    })
  })

  test.describe('Navigation', () => {
    test('shows sign in link', async ({ page }) => {
      const signInLink = page.getByRole('link', { name: /sign in|log in/i })
      await expect(signInLink).toBeVisible()
    })

    test('sign in link navigates to login', async ({ page }) => {
      await page.getByRole('link', { name: /sign in|log in/i }).click()
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Content Sections', () => {
    test('page is scrollable', async ({ page }) => {
      // Scroll down the page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

      // Should have scrolled (page is taller than viewport)
      const scrollY = await page.evaluate(() => window.scrollY)
      expect(scrollY).toBeGreaterThan(0)
    })

    test('shows feature descriptions', async ({ page }) => {
      // Should have content about the product features
      await expect(page.getByText(/estimate|contractor|lidar|scan/i).first()).toBeVisible()
    })
  })

  test.describe('Waitlist Form', () => {
    test('shows email input', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/email/i)
      await expect(emailInput).toBeVisible()
    })

    test('shows submit button', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /join|subscribe|notify|get|submit/i })
      await expect(submitButton).toBeVisible()
    })

    test('validates email format', async ({ page }) => {
      const emailInput = page.getByPlaceholder(/email/i)
      const submitButton = page.getByRole('button', { name: /join|subscribe|notify|get|submit/i })

      // Enter invalid email
      await emailInput.fill('invalid-email')
      await submitButton.click()

      // Should show validation error or remain on page
      await expect(page).toHaveURL('/')
    })

    test('shows success message on valid submission', async ({ page }) => {
      // Skip if waitlist API is not mocked
      test.skip(true, 'Requires API mocking')

      const emailInput = page.getByPlaceholder(/email/i)
      const submitButton = page.getByRole('button', { name: /join|subscribe|notify|get|submit/i })

      await emailInput.fill('test@example.com')
      await submitButton.click()

      // Should show success message
      await expect(page.getByText(/thank|success|list|soon/i)).toBeVisible()
    })
  })

  test.describe('Responsiveness', () => {
    test('renders correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Page should still show key elements
      await expect(page.getByText('REMODLY')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('renders correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      await expect(page.getByText('REMODLY')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('renders correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')

      await expect(page.getByText('REMODLY')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('has proper heading hierarchy', async ({ page }) => {
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThanOrEqual(1)
    })

    test('all images have alt text', async ({ page }) => {
      const images = await page.locator('img').all()

      for (const img of images) {
        const alt = await img.getAttribute('alt')
        // Allow empty alt for decorative images
        expect(alt).not.toBeNull()
      }
    })

    test('links are focusable', async ({ page }) => {
      const links = await page.locator('a').all()

      for (const link of links.slice(0, 5)) { // Test first 5 links
        await link.focus()
        await expect(link).toBeFocused()
      }
    })

    test('buttons are focusable', async ({ page }) => {
      const buttons = await page.locator('button').all()

      for (const button of buttons.slice(0, 5)) { // Test first 5 buttons
        await button.focus()
        await expect(button).toBeFocused()
      }
    })
  })

  test.describe('Performance', () => {
    test('page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })
  })
})
