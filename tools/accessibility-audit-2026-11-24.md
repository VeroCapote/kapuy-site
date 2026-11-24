# Accessibility review · 2026-11-24

Technical review of kapuymarketing.com, not an ADA certification or a claim of full WCAG conformance.

## Scope and findings

Reviewed the Spanish home, about, community and privacy pages, their four generated English equivalents, /hello, and /diagnostico (intro, all 13 questions, result and mocked successful contact submission).

Fixed:
- Popup focus indicators invisible against its purple background. It is now correctly identified as a non-modal region; it does not steal focus on appearance, returns focus when closed from inside, and closes if it would cover another focused control.
- Diagnostic question replacement losing keyboard focus. Each new question/result receives focus, question progress is described, previous choices expose their pressed state, and successful contact submission focuses the calendar link.
- Form errors not identifying/focusing the affected field. Home, community, diagnostic and /hello now connect error text to invalid controls. Community success and /hello calendar handoff also preserve a useful focus location.
- Insufficient text contrast: the home credit (4.49:1 before) and eight text elements on /hello (3.39–3.54:1 before). Secondary gray and field outlines were adjusted.
- English home button overflowing at 320 CSS pixels. Buttons now wrap; the popup can scroll within short viewports.
- Missing skip links; added main landmark on /hello; Escape closes the mobile menu and returns focus to its button.
- Instagram embed lacked an accessible frame title. The generated frame receives a descriptive title in each language. Media content itself was not audited.

## Verification

- axe-core 4.10.3, Chromium, WCAG 2 A/AA + 2.1 AA + 2.2 AA tagged checks: 66 page/state/viewport scans, zero reported violations in the final run.
- Page widths: 320, 375, 640 and 1280 CSS pixels. No detected offscreen layout elements after fixes. This is responsive reflow testing, not a completed browser zoom/text-spacing assessment.
- Keyboard: 13 diagnostic questions using Tab/Enter, question/result focus, invalid form focus, diagnostic restart, mobile-menu Escape and popup Escape.
- Mocked diagnostic contact responses: failure leaves the form usable; success exposes and focuses the calendar link. Requests to Supabase and analytics were blocked/intercepted; no real leads, research records, emails or bookings were created.
- Real Google font downloads enabled in final run. Other third-party content blocked in the local scan. Reduced-motion preference enabled for deterministic final scans; the preceding interaction run also exercised default motion.
- Existing diagnostic scoring suite: 13 tests passed.
- English rebuilt from Spanish sources using tools/build-en.py.
- Public calendar link followed separately: resolves to the expected 30-minute Vero/Kapüy schedule, displays appointment times, and has labeled day/time controls. No slot selected and no booking submitted.

Regression runner: tools/test-accessibility.cjs. Uses an already-installed playwright-core, local axe.min.js and Chrome; see its header for environment variables. This audit did not install packages.

## Still unverified

- Actual VoiceOver/NVDA announcements and usability with disabled users; focus/ARIA checks are not a substitute.
- Full browser zoom at 200%/400%, user text-spacing overrides, all media queries and all form error/success combinations.
- Captions, audio descriptions and controls inside Instagram; its cross-origin contents were excluded from automated local testing.
- Google Calendar's final booking form and all external service states.
- Real database insertion/email delivery: intentionally outside this accessibility check.
- Other subdomains, the internal dashboard and historical sitio-completo pages.

Reference: https://www.ada.gov/resources/web-guidance/ explains that automated reports alone do not establish accessibility. A legal assessment of ADA applicability is separate from this technical work.
