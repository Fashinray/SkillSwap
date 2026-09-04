import { Page } from '@playwright/test'

export const TEST_PASSWORD = 'SkillSwap2024!'

export async function loginAs(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

export async function logout(page: Page) {
  const signOutBtn = page.getByRole('button', { name: /sign out/i })
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click()
    await page.waitForURL('**/login', { timeout: 5000 })
  }
}
