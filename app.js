
const C = window.GASSIEN_CONFIG || {};
const configured = C.SUPABASE_URL && !C.SUPABASE_URL.includes("PASTE_") &&
  C.SUPABASE_PUBLISHABLE_KEY && !C.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
const sb = configured ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY) : null;

const T = {
fr:{hello:"Salut Gassien 👋",subtitle:"Un petit verre maintenant, ton corps te remerciera plus tard.",of:"sur",next:"Prochain rappel",drink:"+ Boire 250 ml",quick:"Ajout rapide",glasses:"Verres",remaining:"Restant",history:"Historique",historyLead:"Les dernières prises enregistrées aujourd’hui.",progress:"Progression",progressLead:"Vue simple de ta semaine.",settings:"Réglages",settingsLead:"Adapte l’app au rythme de ta journée.",goal:"Objectif quotidien (ml)",interval:"Rappel toutes les",wake:"Début des rappels",sleep:"Fin des rappels",save:"Enregistrer",saved:"Réglages enregistrés",drank:"Tu as bu",empty:"Aucune prise aujourd’hui.",cloud:"Synchronisé",local:"Local",offline:"Hors ligne"},
en:{hello:"Hi Gassien 👋",subtitle:"A small glass now, your body will thank you later.",of:"of",next:"Next reminder",drink:"+ Drink 250 ml",quick:"Quick add",glasses:"Glasses",remaining:"Remaining",history:"History",historyLead:"Your latest drinks recorded today.",progress:"Progress",progressLead:"A simple view of your week.",settings:"Settings",settingsLead:"Adjust the app to your daily rhythm.",goal:"Daily goal (ml)",interval:"Remind me every",wake:"Start reminders",sleep:"Stop reminders",save:"Save",saved:"Settings saved",drank:"You drank",empty:"No drinks today.",cloud:"Synced",local:"Local",offline:"Offline"}
};

let session=null, userId=null, channel=null;
let state = JSON.parse(localStorage.getItem("gassienLocal")||"null") || {lang:"fr",goal:2000,interval:60,wake:"08:00",sleep:"23:00",logs:[],nextReminderAt:Date.now()+3600000};

const $=id=>document.getElementById(id);
const toast=m=>{ $("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1900); };
const key=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const saveLocal=()=>localStorage.setItem("gassienLocal",JSON.stringify(state));

function setSync(mode){
 const online = mode==="cloud";
 $("syncDot").classList.toggle("online",online);
 $("syncText").textContent = mode==="cloud" ? T[state.lang].cloud : mode==="offline" ? T[state.lang].offline : T[state.lang].local;
 $("cloudState").textContent = mode==="cloud" ? "✓" : "—";
}

async function init(){
 if(!configured){
   $("configWarning").classList.remove("hidden");$("demoBtn").classList.remove("hidden");
   $("loginBtn").classList.add("hidden");$("signupBtn").classList.add("hidden");$("authFields").classList.add("hidden");
   setSync("local"); bind(); render(); return;
 }
 const {data:{session:s}} = await sb.auth.getSession();
 if(s) await enterCloud(s); else $("auth").classList.remove("hidden");
 sb.auth.onAuthStateChange(async (_event,sess)=>{ if(sess && sess.user?.id!==userId) await enterCloud(sess); });
 bind();
}

async function enterCloud(s){
 session=s;userId=s.user.id;$("auth").classList.add("hidden");
 await ensureSettings(); await loadCloud(); subscribeRealtime(); setSync("cloud"); render();
}

async function ensureSettings(){
 const {data,error}=await sb.from("hydration_settings").select("*").eq("user_id",userId).maybeSingle();
 if(error) { console.error(error); return; }
 if(!data){
   await sb.from("hydration_settings").insert({user_id:userId,goal_ml:2000,interval_minutes:60,wake_time:"08:00",sleep_time:"23:00",language:"fr"});
 }
}

async function loadCloud(){
 const [{data:s,error:se},{data:l,error:le}] = await Promise.all([
   sb.from("hydration_settings").select("*").eq("user_id",userId).single(),
   sb.from("hydration_logs").select("*").eq("user_id",userId).order("consumed_at",{ascending:false}).limit(500)
 ]);
 if(se||le){ console.error(se||le);setSync("offline");return; }
 state.lang=s.language||"fr";state.goal=s.goal_ml;state.interval=s.interval_minutes;state.wake=(s.wake_time||"08:00").slice(0,5);state.sleep=(s.sleep_time||"23:00").slice(0,5);
 state.logs=(l||[]).map(x=>({id:x.id,ml:x.amount_ml,ts:new Date(x.consumed_at).getTime(),day:key(new Date(x.consumed_at))}));
 state.nextReminderAt=Date.now()+state.interval*60000; saveLocal();
}

function subscribeRealtime(){
 if(channel) sb.removeChannel(channel);
 channel=sb.channel("gassien-live-"+userId)
  .on("postgres_changes",{event:"*",schema:"public",table:"hydration_settings",filter:`user_id=eq.${userId}`},async()=>{await loadCloud();render();})
  .on("postgres_changes",{event:"*",schema:"public",table:"hydration_logs",filter:`user_id=eq.${userId}`},async()=>{await loadCloud();render();})
  .subscribe(status=>{ if(status==="SUBSCRIBED") setSync("cloud"); });
}

function todays(){return state.logs.filter(x=>x.day===key())}
function totalToday(){return todays().reduce((a,b)=>a+b.ml,0)}

function render(){
 const t=T[state.lang], total=totalToday(), pct=Math.min(100,Math.round(total/state.goal*100));
 $("hello").textContent=t.hello;$("subtitle").textContent=t.subtitle;$("ofText").textContent=t.of;$("nextLabel").textContent=t.next;$("drink250").textContent=t.drink;$("quickLabel").textContent=t.quick;$("glassesLabel").textContent=t.glasses;$("remainingLabel").textContent=t.remaining;
 $("historyTitle").textContent=t.history;$("historyLead").textContent=t.historyLead;$("progressTitle").textContent=t.progress;$("progressLead").textContent=t.progressLead;$("settingsTitle").textContent=t.settings;$("settingsLead").textContent=t.settingsLead;$("goalLabel").textContent=t.goal;$("intervalLabel").textContent=t.interval;$("wakeLabel").textContent=t.wake;$("sleepLabel").textContent=t.sleep;$("saveSettings").textContent=t.save;
 $("langBtn").textContent=state.lang.toUpperCase();$("currentMl").textContent=total;$("goalMl").textContent=state.goal;$("percent").textContent=pct+"%";$("ring").style.setProperty("--progress",pct);$("glassCount").textContent=todays().length;
 $("remaining").textContent=(Math.max(0,state.goal-total)/1000).toLocaleString(state.lang==="fr"?"fr-FR":"en-GB",{maximumFractionDigits:1})+" L";
 $("goalInput").value=state.goal;$("intervalInput").value=String(state.interval);$("wakeInput").value=state.wake;$("sleepInput").value=state.sleep;
 renderHistory();renderWeek();saveLocal();
}

function renderHistory(){
 const list=[...todays()].sort((a,b)=>b.ts-a.ts);const t=T[state.lang];
 $("historyList").innerHTML=list.length?list.map(x=>`<div class="row"><div><strong>${new Date(x.ts).toLocaleTimeString(state.lang==="fr"?"fr-FR":"en-GB",{hour:"2-digit",minute:"2-digit"})}</strong><span>${t.drank}</span></div><div class="pill">+ ${x.ml} ml</div></div>`).join(""):`<div style="padding:24px 0;color:#6B8581;text-align:center">${t.empty}</div>`;
}

function renderWeek(){
 let h="";for(let i=6;i>=0;i--){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-i);const k=key(d), total=state.logs.filter(x=>x.day===k).reduce((a,b)=>a+b.ml,0), pct=Math.min(100,Math.round(total/state.goal*100));h+=`<div class="row"><div><strong>${d.toLocaleDateString(state.lang==="fr"?"fr-FR":"en-GB",{weekday:"short",day:"numeric"})}</strong><span>${total} / ${state.goal} ml</span></div><div class="pill">${pct}%</div></div>`}$("weekList").innerHTML=h;
}

async function addWater(ml){
 const temp={id:"temp-"+Date.now(),ml,ts:Date.now(),day:key()};state.logs.push(temp);render();
 if(sb&&userId){
   const {error}=await sb.from("hydration_logs").insert({user_id:userId,amount_ml:ml,consumed_at:new Date().toISOString()});
   if(error){state.logs=state.logs.filter(x=>x.id!==temp.id);setSync("offline");render();toast("Erreur de synchronisation");return;}
 } else saveLocal();
 toast(`${T[state.lang].drank} ${ml} ml 💧`);
}

async function saveSettings(){
 state.goal=Math.max(500,Number($("goalInput").value)||2000);state.interval=Number($("intervalInput").value)||60;state.wake=$("wakeInput").value||"08:00";state.sleep=$("sleepInput").value||"23:00";state.nextReminderAt=Date.now()+state.interval*60000;render();
 if(sb&&userId){
   const {error}=await sb.from("hydration_settings").update({goal_ml:state.goal,interval_minutes:state.interval,wake_time:state.wake,sleep_time:state.sleep,language:state.lang}).eq("user_id",userId);
   if(error){console.error(error);setSync("offline");}
 }
 toast(T[state.lang].saved);
}

function bind(){
 if(window.__bound)return;window.__bound=true;
 $("demoBtn").onclick=()=>{$("auth").classList.add("hidden");render()};
 $("loginBtn").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)toast(error.message)};
 $("signupBtn").onclick=async()=>{const {error}=await sb.auth.signUp({email:$("email").value.trim(),password:$("password").value});if(error)toast(error.message);else toast("Compte créé. Vérifie l’e-mail si demandé.")};
 $("logoutBtn").onclick=async()=>{if(sb)await sb.auth.signOut();location.reload()};
 $("drink250").onclick=()=>addWater(250);document.querySelectorAll(".quick").forEach(b=>b.onclick=()=>addWater(Number(b.dataset.ml)));
 $("saveSettings").onclick=saveSettings;
 $("langBtn").onclick=async()=>{state.lang=state.lang==="fr"?"en":"fr";render();if(sb&&userId)await sb.from("hydration_settings").update({language:state.lang}).eq("user_id",userId)};
 document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.dataset.screen===b.dataset.target))});
}

setInterval(()=>{const diff=Math.max(0,state.nextReminderAt-Date.now()),m=Math.floor(diff/60000),s=Math.floor(diff%60000/1000);$("countdown").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(diff===0)state.nextReminderAt=Date.now()+state.interval*60000},1000);

window.addEventListener("online",async()=>{if(sb&&userId){await loadCloud();setSync("cloud");render()}});
window.addEventListener("offline",()=>setSync("offline"));

if("serviceWorker" in navigator){
 window.addEventListener("load",async()=>{
   const reg=await navigator.serviceWorker.register("./sw.js");
   reg.update();
   if(reg.waiting) reg.waiting.postMessage({type:"SKIP_WAITING"});
   reg.addEventListener("updatefound",()=>{const nw=reg.installing;if(nw)nw.addEventListener("statechange",()=>{if(nw.state==="installed"&&navigator.serviceWorker.controller)nw.postMessage({type:"SKIP_WAITING"})})});
 });
 let refreshing=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!refreshing){refreshing=true;location.reload()}});
}
init();
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function enablePushReminders() {
  const status = document.getElementById("pushStatus");

  try {
    if (!userId || !sb) {
      status.textContent = "Connecte-toi d’abord.";
      return;
    }

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      status.textContent = "Les notifications ne sont pas supportées sur cet appareil.";
      return;
    }

    if (!C.VAPID_PUBLIC_KEY) {
      status.textContent = "Clé de notification manquante.";
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      status.textContent = "Notifications non autorisées.";
      return;
    }

    status.textContent = "Activation en cours…";

    const registration = await navigator.serviceWorker.ready;

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(C.VAPID_PUBLIC_KEY)
      });
    }

    const data = subscription.toJSON();

    const { error } = await sb
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.keys.p256dh,
          auth: data.keys.auth,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "endpoint"
        }
      );

    if (error) throw error;

    status.textContent = "✓ Rappels activés";
    toast("Notifications activées 💧");

  } catch (error) {
    console.error(error);
    status.textContent = "Impossible d’activer les rappels.";
    toast("Erreur lors de l’activation");
  }
}

const enablePushBtn = document.getElementById("enablePushBtn");

if (enablePushBtn) {
  enablePushBtn.addEventListener(
    "click",
    enablePushReminders
  );
}
const testPushBtn = document.getElementById("testPushBtn");

if (testPushBtn) {
  testPushBtn.addEventListener("click", async () => {
    try {
      if (!sb || !userId) {
        toast("Connecte-toi d’abord.");
        return;
      }

      toast("Envoi du test…");

      const { data, error } = await sb.functions.invoke(
        "send-water-test"
      );

      if (error) {
        console.error("Push test error:", error);
        throw error;
      }

      console.log("Push test:", data);

      if (data?.delivered > 0) {
        toast("Notification envoyée 💧");
      } else {
        toast("Aucune notification envoyée");
      }

    } catch (error) {
      console.error("Push test error:", error);
      toast("Erreur pendant le test");
    }
  });
}