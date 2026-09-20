import { withSupabase } from "npm:@supabase/server@^1";
import { sendPushNotification } from "npm:@mmmike/web-push@1.3.0/send";

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    try {
      const { data: subscriptions, error } = await ctx.supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth");
      if (error) throw error;
      if (!subscriptions || subscriptions.length === 0) return Response.json({ error: "No push subscription found" }, { status: 404 });

      const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
      const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
      if (!publicKey || !privateKey) throw new Error("VAPID secrets missing");

      const vapid = { publicKey, privateKey, subject: "https://ieqnticbccxogltdyege.supabase.co" };
      const payload = { title: "GATER 💧", body: "Test réussi ! C’est l’heure de boire un peu d’eau.", url: "./", tag: "gater-water-reminder" };
      let delivered = 0;
      for (const sub of subscriptions) {
        const success = await sendPushNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, vapid);
        if (success) delivered++; else await ctx.supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
      return Response.json({ success: true, delivered });
    } catch (error) {
      console.error(error);
      return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
  }),
};
