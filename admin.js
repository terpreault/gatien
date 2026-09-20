
const C=window.GASSIEN_CONFIG||{},configured=C.SUPABASE_URL&&!C.SUPABASE_URL.includes("PASTE_");
const sb=configured?window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY):null;
const $=id=>document.getElementById(id), toast=m=>{$("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1800)};
let subject=null,chan=null;
async function resolve(){
 const {data:{session}}=await sb.auth.getSession();if(!session)return;
 const {data:links,error}=await sb.from("admin_links").select("subject_user_id").eq("admin_user_id",session.user.id).limit(1);
 if(error||!links?.length){toast("Aucun accès admin lié à ce compte.");return}
 subject=links[0].subject_user_id;$("adminLogin").classList.add("hidden");$("adminPanel").classList.remove("hidden");await load();subscribe();
}
async function load(){
 const [{data:s,error:se},{data:l,error:le}]=await Promise.all([sb.from("hydration_settings").select("*").eq("user_id",subject).single(),sb.from("hydration_logs").select("amount_ml,consumed_at").eq("user_id",subject).gte("consumed_at",new Date(new Date().setHours(0,0,0,0)).toISOString())]);
 if(se||le){console.error(se||le);return}
 $("ag").value=s.goal_ml;$("ai").value=String(s.interval_minutes);$("aw").value=s.wake_time.slice(0,5);$("as").value=s.sleep_time.slice(0,5);$("currentGoal").textContent=s.goal_ml+" ml";$("todayTotal").textContent=(l||[]).reduce((a,b)=>a+b.amount_ml,0)+" ml";
}
function subscribe(){chan=sb.channel("admin-gassien").on("postgres_changes",{event:"*",schema:"public",table:"hydration_settings",filter:`user_id=eq.${subject}`},load).on("postgres_changes",{event:"*",schema:"public",table:"hydration_logs",filter:`user_id=eq.${subject}`},load).subscribe()}
$("alogin").onclick=async()=>{if(!sb)return toast("Configure Supabase dans config.js");const {error}=await sb.auth.signInWithPassword({email:$("ae").value.trim(),password:$("ap").value});if(error)toast(error.message);else resolve()};
$("adminSave").onclick=async()=>{const {error}=await sb.from("hydration_settings").update({goal_ml:Number($("ag").value),interval_minutes:Number($("ai").value),wake_time:$("aw").value,sleep_time:$("as").value}).eq("user_id",subject);if(error)toast(error.message);else toast("Mis à jour ✓")};
$("logout").onclick=async()=>{if(sb)await sb.auth.signOut();location.reload()};
if(sb)resolve();
