/**
 * Session IDs for the 4 public "Sample Report" cards on the marketing
 * landing page (one artist per tier). Keep in sync with the
 * `sampleReportPlans` URLs in songss-landing-page/src/routes/index.tsx.
 */
export const SAMPLE_REPORT_SESSION_IDS = new Set<string>([
  "cs_test_a1bKhXt1YrxVSWsqM3lMtZFim7BsO0fbbytf0AF0VNifjRGSLIkathi2FSgD", // Artist Indie — grentperez
  "cs_test_a11tFiVoZwedOdgxSxEh1lumzSmXx54dDUR5N5uWPlmIyzjuqggqAOm6sLYH", // Artist Growth — Chappell Roan
  "cs_test_a1VtJTdZamlPkQpgWL334n7q2KSIpITs0BDA1WDtiaPTm2jJEZi7bfa418Ch", // Artist Pro — Fred again..
  "cs_test_a15WUoorbVTdf4Ho735XucdAdi64oTFNyxJYfkbN5UIqX6xqQFMdyrJemH", // Enterprise — Billie Eilish
]);

export function isSampleReportSession(sessionId: string | null | undefined): boolean {
  return !!sessionId && SAMPLE_REPORT_SESSION_IDS.has(sessionId);
}
