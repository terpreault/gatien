GATER V4 — OCEAN NIGHT UI + CLOUD + REALTIME + PUSH

WHAT IS READY
- Installable PWA with the approved GATER Ocean Night identity.
- Premium mobile interface inspired by the approved GATER mockups.
- Launch splash screen with GATER branding.
- FR / EN interface.
- Daily hydration ring and quick-add buttons (150 / 250 / 330 / 500 ml).
- Central Add Water sheet with custom amount.
- Progress screen with Week / Month / Year charts, streak and daily completion.
- History screen with monthly calendar and recent logs.
- Settings for daily goal and reminder schedule.
- Supabase email/password authentication.
- Cloud persistence across devices and Supabase Realtime sync.
- Push subscription + test notification controls.
- admin.html remote control page for an authorized admin.
- Service worker auto-update strategy.
- Local demo mode when Supabase is not configured.

BRAND COLORS
- Petroleum Blue: #245A68
- Aqua: #74C9D4
- Coral: #FF8A76
- Ice White: #F5FAFB

DEPLOY
1. Replace the files in your existing GATER GitHub repository with all files from this package.
2. Keep config.js exactly as supplied in this package so your current Supabase configuration remains connected.
3. Commit and push the changes.
4. Your host (for example Netlify) can then redeploy from GitHub.
5. Reopen GATER. The V4 service worker forces the new app files to replace the old cached version.

DATABASE
No Supabase SQL or table change is required for this V4 visual update.
The internal GASSIEN_CONFIG name and gassienLocal localStorage key are intentionally preserved to avoid breaking the current configuration and locally stored data.

IMPORTANT
Never put a Supabase service_role key or VAPID private key in config.js.
