
GATER V3 — CLOUD + REALTIME + AUTO UPDATE

WHAT IS READY
- Installable PWA.
- FR / EN interface.
- Water intake + daily target + history + 7-day view.
- Supabase email/password authentication.
- Cloud persistence across devices.
- Supabase Realtime subscriptions for settings and water logs.
- admin.html remote control page for an authorized admin.
- Service worker update strategy: new deployments replace old cached app files automatically.
- Local demo mode if Supabase has not yet been configured.

SETUP
1. Create a Supabase project.
2. Open SQL Editor and run supabase-setup.sql.
3. In Authentication settings, enable Email/Password.
4. Copy Project URL + browser publishable key into config.js.
5. Deploy the complete folder to GitHub / Netlify.
6. Open the main app and create Gassien's account.
7. Open admin.html and create/sign in to your admin account.
8. In Supabase Authentication > Users, copy both user UUIDs.
9. Run in SQL Editor:
   insert into public.admin_links(admin_user_id, subject_user_id)
   values ('YOUR_ADMIN_USER_UUID','GASSIEN_USER_UUID');
10. Reload admin.html. You can now change Gassien's target/reminder settings remotely.

IMPORTANT
- Never put a Supabase service_role key in config.js.
- Background push notifications are a separate next step. This V2 solves cloud data,
  realtime sync and app-code auto-updates.
