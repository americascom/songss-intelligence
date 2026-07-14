/**
 * Session IDs for the 4 public "Sample Report" cards on the marketing
 * landing page (Billie Eilish, one per tier). Keep in sync with the
 * `sampleReportPlans` URLs in songss-landing-page/src/routes/index.tsx.
 */
export const SAMPLE_REPORT_SESSION_IDS = new Set<string>([
  "cs_test_a1fGd2OHJfuRZfK9xttHEWeUIVskGfNBgNM3S5ShxFe4aDJdsx14CGcJvQ", // Artist Indie
  "cs_test_a1V7Ojz8OO7i0EiPPCAj25C88sTdQ023JUrsyhYhKusjH7jUJUd2cnQLPI", // Artist Growth
  "cs_test_a1BJXNfYnT4FQq3wkPJYL5mKR3y5ykGbhIN5YoinsD3XamnymuzLLb1lwK", // Artist Pro
  "cs_test_a15WUoorbVTdf4Ho735XucdAdi64oTFNyxJYfkbN5UIqX6xqQFMdyrJemH", // Enterprise
]);

export function isSampleReportSession(sessionId: string | null | undefined): boolean {
  return !!sessionId && SAMPLE_REPORT_SESSION_IDS.has(sessionId);
}
