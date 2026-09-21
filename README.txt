2LO V5 — COMPLETE UI RESTRUCTURE
=================================

Brand
-----
Name: 2LO
Visual identity: Ocean Night
Petroleum Blue: #245A68
Aqua: #74C9D4
Coral: #FF8A76
Ice White: #F5FAFB

What changed in V5
------------------
- Complete replacement of the old GATER visible branding with 2LO.
- New Today screen centred on the animated water gauge.
- Gauge fills with the amount drunk and keeps a full state above 100%.
- Goal reached / goal exceeded feedback.
- Quick add 150 / 250 / 330 / 500 ml plus custom amount and time.
- New Progress screen with vertical bars, quantity-based Aqua intensity and Coral goal line.
- Daily average, goals reached, current streak, week comparison and best day.
- New History screen with hydration-intensity calendar and selectable day details.
- New Settings screen: daily goal, reminders, FR/UK language, data controls, account and About.
- No Appearance section in V5 yet.
- Supabase tables and existing cloud data structure remain unchanged.
- Existing GASSIEN_CONFIG variable and gassienLocal key are intentionally preserved for compatibility.
- PWA name, service worker and push-notification branding updated to 2LO.

Deployment
----------
Upload/replace the files in the GitHub Pages repository with the files in this package.
The service worker version is 2lo-v5.0.0 and the main assets use ?v=5000 to force a cache refresh.

If Chrome still shows an old version after GitHub Pages deploys, use Command + Shift + R or clear the site data once.
