/**
 * Feature Flags Configuration
 *
 * Controls optional and experimental modules across the MedTrace application.
 * All optional modules MUST be isolated behind these flags so toggling them off
 * causes zero breakage to core operational workflows (Stages 1-8).
 */

export const FEATURES = {
  /**
   * Optional AI / Demand Intelligence Module (Stage 9)
   * Controls visibility and access to /admin/intelligence.
   * Environment variable: NEXT_PUBLIC_ENABLE_AI_MODULE ('true' | 'false')
   */
  ENABLE_AI_MODULE:
    process.env.NEXT_PUBLIC_ENABLE_AI_MODULE === 'true' ||
    (typeof window !== 'undefined' && window.localStorage.getItem('FEATURE_AI_MODULE') === 'true'),
};

export function isFeatureEnabled(flag: keyof typeof FEATURES): boolean {
  if (typeof window !== 'undefined') {
    // Check localStorage runtime override (useful for testing/demo toggling)
    const localOverride = window.localStorage.getItem(`FEATURE_${flag}`);
    if (localOverride !== null) {
      return localOverride === 'true';
    }
  }
  return Boolean(FEATURES[flag]);
}
