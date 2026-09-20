/**
 * Feature flags for SkillSwap.
 *
 * OAU_EMAIL_ONLY: restricts registration to @oauife.edu.ng only.
 * Keep false in development so Playwright @skillswap.test accounts work.
 * Set to true for production deployment.
 */
export const FEATURES = {
  OAU_EMAIL_ONLY: process.env.OAU_EMAIL_ONLY === 'true',
} as const

export function isValidRegistrationEmail(email: string): boolean {
  if (!FEATURES.OAU_EMAIL_ONLY) return true
  return email.toLowerCase().endsWith('@oauife.edu.ng')
}
