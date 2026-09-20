const C = window.GASSIEN_CONFIG || {};
const configured = C.SUPABASE_URL && !C.SUPABASE_URL.includes("PASTE_") &&
  C.SUPABASE_PUBLISHABLE_KEY && !C.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
const sb = configured ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY) : null;

const T = {
  fr:{
    hello:"Bonjour Gatien,",subtitle:"On s’hydrate !",of:"sur",next:"Prochain rappel",reminderHint:"Un peu d’eau au bon moment.",glasses:"Prises",remaining:"Restant",todayGoal:"Objectif",
    history:"Historique",historyLead:"Retrouve tes prises récentes.",historyKicker:"JOURNAL",recent:"Prises récentes",progress:"Ta progression",progressLead:"Une vue claire de ton rythme.",progressKicker:"HYDRATATION",
    settings:"Réglages",settingsLead:"Adapte GATER à ton rythme.",goal:"Objectif quotidien (ml)",interval:"Rappel toutes les",wake:"Début",sleep:"Fin",save:"Enregistrer",saved:"Réglages enregistrés",
    drank:"Tu as bu",empty:"Aucune prise enregistrée.",cloud:"Cloud",local:"Local",offline:"Hors ligne",week:"Semaine",month:"Mois",year:"Année",chartGoal:"objectif",streak:"jours de série",completion:"objectif du jour",
    encouragementTitle:"Continue comme ça !",encouragementText:"Chaque verre compte dans ta routine.",home:"Accueil",navProgress:"Progrès",navHistory:"Historique",navSettings:"Réglages",water:"Eau",custom:"Quantité personnalisée",add:"Ajouter au journal",
    pushTitle:"Rappels d’hydratation",pushDescription:"Active les notifications pour recevoir un rappel même lorsque l’application est fermée.",enablePush:"Activer les rappels",testPush:"Envoyer une notification test",logout:"Se déconnecter",
    dailyGoalTitle:"Objectif quotidien",today:"Aujourd’hui",authIntro:"Connecte-toi pour retrouver ton suivi d’hydratation sur tous tes appareils."
  },
  en:{
    hello:"Good morning, Gatien,",subtitle:"Let’s hydrate!",of:"of",next:"Next reminder",reminderHint:"A little water at the right time.",glasses:"Drinks",remaining:"Remaining",todayGoal:"Goal",
    history:"History",historyLead:"See your recent water logs.",historyKicker:"JOURNAL",recent:"Recent logs",progress:"Your progress",progressLead:"A clear view of your rhythm.",progressKicker:"HYDRATION",
    settings:"Settings",settingsLead:"Adapt GATER to your daily rhythm.",goal:"Daily goal (ml)",interval:"Remind me every",wake:"Start",sleep:"End",save:"Save",saved:"Settings saved",
    drank:"You drank",empty:"No drinks recorded.",cloud:"Cloud",local:"Local",offline:"Offline",week:"Week",month:"Month",year:"Year",chartGoal:"goal",streak:"day streak",completion:"today’s goal",
    encouragementTitle:"You’re doing great!",encouragementText:"Every glass counts towards your routine.",home:"Home",navProgress:"Progress",navHistory:"History",navSettings:"Settings",water:"Water",custom:"Custom amount",add:"Add to log",
    pushTitle:"Hydration reminders",pushDescription:"Enable notifications to get a reminder even when the app is closed.",enablePush:"Enable reminders",testPush:"Send a test notification",logout:"Sign out",
    dailyGoalTitle:"Daily goal",today:"Today",authIntro:"Sign in to keep your hydration data synced across your devices."
  }
};

let session=null, userId=null, channel=null;
let state = JSON.parse(localStorage.getItem("gassienLocal")||"null") || {lang:"fr",goal:2000,interval:60,wake:"08:00",sleep:"23:00",logs:[],nextReminderAt:Date.now()+3600000};
let progressPeriod="week";
let historyMonthOffset=0;

const $=id=>document.getElementById(id);
const toast=m=>{ const el=$("toast"); if(!el)return; el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1900); };
const key=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const saveLocal=()=>localStorage.setItem("gassienLocal",JSON.stringify(state));
const locale=()=>state.lang==="fr"?"fr-FR":"en-GB";
const formatL=ml=>(ml/1000).toLocaleString(locale(),{minimumFractionDigits:1,maximumFractionDigits:1})+" L";
const dayTotal=d=>state.logs.filter(x=>x.day===key(d)).reduce((a,b)=>a+b.ml,0);

function setSync(mode){
  const online=mode==="cloud";
  $("syncDot")?.classList.toggle("online",online);
  if($("syncText")) $("syncText").textContent=mode==="cloud"?T[state.lang].cloud:mode==="offline"?T[state.lang].offline:T[state.lang].local;
}

async function init(){
  if(!configured){
    $("configWarning").classList.remove("hidden");$("demoBtn").classList.remove("hidden");
    $("loginBtn").classList.add("hidden");$("signupBtn").classList.add("hidden");$("authFields").classList.add("hidden");
    setSync("local");bind();render();return;
  }
  const {data:{session:s}}=await sb.auth.getSession();
  if(s) await enterCloud(s); else $("auth").classList.remove("hidden");
  sb.auth.onAuthStateChange(async(_event,sess)=>{if(sess&&sess.user?.id!==userId)await enterCloud(sess);});
  bind();
}

async function enterCloud(s){
  session=s;userId=s.user.id;$("auth").classList.add("hidden");
  await ensureSettings();await loadCloud();subscribeRealtime();setSync("cloud");render();
}

async function ensureSettings(){
  const {data,error}=await sb.from("hydration_settings").select("*").eq("user_id",userId).maybeSingle();
  if(error){console.error(error);return;}
  if(!data) await sb.from("hydration_settings").insert({user_id:userId,goal_ml:2000,interval_minutes:60,wake_time:"08:00",sleep_time:"23:00",language:"fr"});
}

async function loadCloud(){
  const [{data:s,error:se},{data:l,error:le}]=await Promise.all([
    sb.from("hydration_settings").select("*").eq("user_id",userId).single(),
    sb.from("hydration_logs").select("*").eq("user_id",userId).order("consumed_at",{ascending:false}).limit(500)
  ]);
  if(se||le){console.error(se||le);setSync("offline");return;}
  state.lang=s.language||"fr";state.goal=s.goal_ml;state.interval=s.interval_minutes;state.wake=(s.wake_time||"08:00").slice(0,5);state.sleep=(s.sleep_time||"23:00").slice(0,5);
  state.logs=(l||[]).map(x=>({id:x.id,ml:x.amount_ml,ts:new Date(x.consumed_at).getTime(),day:key(new Date(x.consumed_at))}));
  state.nextReminderAt=Date.now()+state.interval*60000;saveLocal();
}

function subscribeRealtime(){
  if(channel)sb.removeChannel(channel);
  channel=sb.channel("gater-live-"+userId)
    .on("postgres_changes",{event:"*",schema:"public",table:"hydration_settings",filter:`user_id=eq.${userId}`},async()=>{await loadCloud();render();})
    .on("postgres_changes",{event:"*",schema:"public",table:"hydration_logs",filter:`user_id=eq.${userId}`},async()=>{await loadCloud();render();})
    .subscribe(status=>{if(status==="SUBSCRIBED")setSync("cloud");});
}

function todays(){return state.logs.filter(x=>x.day===key());}
function totalToday(){return todays().reduce((a,b)=>a+b.ml,0);}

function render(){
  const t=T[state.lang],total=totalToday(),pct=Math.min(100,Math.round(total/state.goal*100));
  document.documentElement.lang=state.lang;
  $("hello").textContent=t.hello;$("subtitle").textContent=t.subtitle;$("ofText").textContent=t.of;$("nextLabel").textContent=t.next;$("reminderHint").textContent=t.reminderHint;
  $("glassesLabel").textContent=t.glasses;$("remainingLabel").textContent=t.remaining;$("todayGoalLabel").textContent=t.todayGoal;
  $("historyKicker").textContent=t.historyKicker;$("historyTitle").textContent=t.history;$("historyLead").textContent=t.historyLead;$("recentLogsTitle").textContent=t.recent;
  $("progressKicker").textContent=t.progressKicker;$("progressTitle").textContent=t.progress;$("progressLead").textContent=t.progressLead;
  $("settingsTitle").textContent=t.settings;$("settingsLead").textContent=t.settingsLead;$("dailyGoalTitle").textContent=t.dailyGoalTitle;$("goalLabel").textContent=t.goal;$("intervalLabel").textContent=t.interval;$("wakeLabel").textContent=t.wake;$("sleepLabel").textContent=t.sleep;$("saveSettings").textContent=t.save;
  $("periodWeek").textContent=t.week;$("periodMonth").textContent=t.month;$("periodYear").textContent=t.year;$("chartGoalLabel").textContent=t.chartGoal;$("streakLabel").textContent=t.streak;$("completionLabel").textContent=t.completion;$("encouragementTitle").textContent=t.encouragementTitle;$("encouragementText").textContent=t.encouragementText;
  $("navHome").textContent=t.home;$("navProgress").textContent=t.navProgress;$("navHistory").textContent=t.navHistory;$("navSettings").textContent=t.navSettings;
  $("waterChip").textContent=t.water;$("customLabel").textContent=t.custom;$("addCustomBtn").textContent=t.add;
  $("pushTitle").textContent=t.pushTitle;$("pushDescription").textContent=t.pushDescription;$("enablePushBtn").textContent=t.enablePush;$("testPushBtn").textContent=t.testPush;$("logoutBtn").textContent=t.logout;$("authIntro").textContent=t.authIntro;
  $("langBtn").textContent=state.lang.toUpperCase();$("currentMl").textContent=total;$("goalMl").textContent=state.goal;$("percent").textContent=pct+"%";$("ring").style.setProperty("--progress",pct);$("glassCount").textContent=todays().length;
  $("remaining").textContent=formatL(Math.max(0,state.goal-total));$("goalSummary").textContent=formatL(state.goal);
  $("goalInput").value=state.goal;$("intervalInput").value=String(state.interval);$("wakeInput").value=state.wake;$("sleepInput").value=state.sleep;
  renderProgress();renderHistory();saveLocal();
}

function getPeriodData(period){
  const now=new Date();now.setHours(12,0,0,0);
  if(period==="week"){
    return Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(now.getDate()-(6-i));return{label:d.toLocaleDateString(locale(),{weekday:"short"}).replace(".",""),value:dayTotal(d),target:state.goal,today:key(d)===key()};});
  }
  if(period==="month"){
    return Array.from({length:6},(_,i)=>{
      let sum=0,count=0;for(let j=0;j<5;j++){const d=new Date(now);d.setDate(now.getDate()-(29-(i*5+j)));sum+=dayTotal(d);count++;}
      return{label:`${i*5+1}–${i*5+5}`,value:Math.round(sum/count),target:state.goal,today:i===5};
    });
  }
  return Array.from({length:12},(_,i)=>{
    const d=new Date(now.getFullYear(),i,1,12);const days=new Date(now.getFullYear(),i+1,0).getDate();let sum=0;
    for(let day=1;day<=days;day++)sum+=dayTotal(new Date(now.getFullYear(),i,day,12));
    return{label:d.toLocaleDateString(locale(),{month:"short"}).replace(".",""),value:Math.round(sum/days),target:state.goal,today:i===now.getMonth()};
  });
}

function currentStreak(){
  let streak=0;const d=new Date();d.setHours(12,0,0,0);
  for(let i=0;i<365;i++){const check=new Date(d);check.setDate(d.getDate()-i);if(dayTotal(check)>0)streak++;else if(i===0)continue;else break;}
  return streak;
}

function renderProgress(){
  const data=getPeriodData(progressPeriod);
  $("progressChart").innerHTML=data.map(item=>{
    const pct=Math.min(100,Math.round((item.value/item.target)*100));
    return `<div class="bar-item ${item.today?"is-today":""} ${pct>=100?"is-goal":""}" title="${item.value} ml"><div class="bar-track"><div class="bar" style="--bar:${pct}"></div></div><div class="bar-label">${item.label}</div></div>`;
  }).join("");
  const pct=Math.min(100,Math.round(totalToday()/state.goal*100));
  $("streakValue").textContent=currentStreak();$("completionValue").textContent=pct+"%";$("miniRingIcon").style.setProperty("--mini",pct);
}

function renderHistory(){
  const t=T[state.lang];const base=new Date();base.setDate(1);base.setMonth(base.getMonth()+historyMonthOffset);base.setHours(12,0,0,0);
  $("historyMonthLabel").textContent=base.toLocaleDateString(locale(),{month:"long",year:"numeric"});
  const weekdayNames=state.lang==="fr"?["L","M","M","J","V","S","D"]:["M","T","W","T","F","S","S"];
  $("weekdayRow").innerHTML=weekdayNames.map(x=>`<span>${x}</span>`).join("");
  const firstOffset=(new Date(base.getFullYear(),base.getMonth(),1).getDay()+6)%7;const days=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();let cells="";
  for(let i=0;i<firstOffset;i++)cells+='<span class="calendar-day empty"></span>';
  for(let day=1;day<=days;day++){
    const d=new Date(base.getFullYear(),base.getMonth(),day,12);const total=dayTotal(d);const classes=["calendar-day"];
    if(total>0)classes.push("logged");if(total>=state.goal)classes.push("goal");if(key(d)===key())classes.push("today");
    cells+=`<span class="${classes.join(" ")}" title="${total} ml">${day}</span>`;
  }
  $("calendarGrid").innerHTML=cells;
  const list=[...state.logs].sort((a,b)=>b.ts-a.ts).slice(0,20);
  $("historyTotal").textContent=list.length?`${Math.min(20,state.logs.length)} / ${state.logs.length}`:"";
  $("historyList").innerHTML=list.length?list.map(x=>{
    const d=new Date(x.ts);const date=d.toLocaleDateString(locale(),{day:"numeric",month:"short"});const time=d.toLocaleTimeString(locale(),{hour:"2-digit",minute:"2-digit"});
    return `<div class="log-row"><div class="log-cup"><span class="cup-svg"><svg viewBox="0 0 24 28"><path d="M4 3h16l-1.5 22h-13L4 3Z"/></svg></span></div><div><strong>${x.ml} ml</strong><small>${date}, ${time}</small></div><span class="log-day-total">${x.day===key()?t.today:""}</span><span class="chevron">›</span></div>`;
  }).join(""):`<div class="empty-state">${t.empty}</div>`;
}

async function addWater(ml){
  const amount=Math.round(Number(ml));if(!amount||amount<=0)return;
  const temp={id:"temp-"+Date.now(),ml:amount,ts:Date.now(),day:key()};state.logs.push(temp);render();closeAddSheet();
  if(sb&&userId){
    const {error}=await sb.from("hydration_logs").insert({user_id:userId,amount_ml:amount,consumed_at:new Date().toISOString()});
    if(error){state.logs=state.logs.filter(x=>x.id!==temp.id);setSync("offline");render();toast("Erreur de synchronisation");return;}
  } else saveLocal();
  toast(`${T[state.lang].drank} ${amount} ml 💧`);
}

async function saveSettings(){
  state.goal=Math.max(500,Number($("goalInput").value)||2000);state.interval=Number($("intervalInput").value)||60;state.wake=$("wakeInput").value||"08:00";state.sleep=$("sleepInput").value||"23:00";state.nextReminderAt=Date.now()+state.interval*60000;render();
  if(sb&&userId){const {error}=await sb.from("hydration_settings").update({goal_ml:state.goal,interval_minutes:state.interval,wake_time:state.wake,sleep_time:state.sleep,language:state.lang}).eq("user_id",userId);if(error){console.error(error);setSync("offline");}}
  toast(T[state.lang].saved);
}

function showScreen(target){
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active",s.dataset.screen===target));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.target===target));
  window.scrollTo({top:0,behavior:"smooth"});
}
function openAddSheet(){$("addSheet").classList.remove("hidden");$("addSheet").setAttribute("aria-hidden","false");setTimeout(()=>$("customMl").blur(),10);}
function closeAddSheet(){$("addSheet").classList.add("hidden");$("addSheet").setAttribute("aria-hidden","true");$("customMl").value="";}

function bind(){
  if(window.__bound)return;window.__bound=true;
  $("demoBtn").onclick=()=>{$("auth").classList.add("hidden");render();};
  $("loginBtn").onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)toast(error.message);};
  $("signupBtn").onclick=async()=>{const {error}=await sb.auth.signUp({email:$("email").value.trim(),password:$("password").value});if(error)toast(error.message);else toast("Compte créé. Vérifie l’e-mail si demandé.");};
  $("logoutBtn").onclick=async()=>{if(sb)await sb.auth.signOut();location.reload();};
  document.querySelectorAll(".quick").forEach(b=>b.onclick=()=>addWater(Number(b.dataset.ml)));
  document.querySelectorAll("[data-add-ml]").forEach(b=>b.onclick=()=>addWater(Number(b.dataset.addMl)));
  $("addCustomBtn").onclick=()=>{const amount=Number($("customMl").value);if(amount>0)addWater(amount);else toast(state.lang==="fr"?"Entre une quantité en ml":"Enter an amount in ml");};
  $("openAdd").onclick=openAddSheet;$("closeAdd").onclick=closeAddSheet;$("addSheet").addEventListener("click",e=>{if(e.target===$("addSheet"))closeAddSheet();});
  $("saveSettings").onclick=saveSettings;
  $("langBtn").onclick=async()=>{state.lang=state.lang==="fr"?"en":"fr";render();if(sb&&userId)await sb.from("hydration_settings").update({language:state.lang}).eq("user_id",userId);};
  document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showScreen(b.dataset.target));
  document.querySelectorAll("[data-go-home]").forEach(b=>b.onclick=()=>showScreen("today"));
  document.querySelectorAll("[data-target-settings]").forEach(b=>b.onclick=()=>showScreen("settings"));
  document.querySelectorAll(".segment").forEach(b=>b.onclick=()=>{progressPeriod=b.dataset.period;document.querySelectorAll(".segment").forEach(x=>x.classList.toggle("active",x===b));renderProgress();});
  $("prevMonth").onclick=()=>{historyMonthOffset--;renderHistory();};$("nextMonth").onclick=()=>{historyMonthOffset++;renderHistory();};
}

setInterval(()=>{
  const diff=Math.max(0,state.nextReminderAt-Date.now()),m=Math.floor(diff/60000),s=Math.floor(diff%60000/1000);if($("countdown"))$("countdown").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;if(diff===0)state.nextReminderAt=Date.now()+state.interval*60000;
},1000);

window.addEventListener("online",async()=>{if(sb&&userId){await loadCloud();setSync("cloud");render();}});window.addEventListener("offline",()=>setSync("offline"));

if("serviceWorker" in navigator){
  window.addEventListener("load",async()=>{const reg=await navigator.serviceWorker.register("./sw.js");reg.update();if(reg.waiting)reg.waiting.postMessage({type:"SKIP_WAITING"});reg.addEventListener("updatefound",()=>{const nw=reg.installing;if(nw)nw.addEventListener("statechange",()=>{if(nw.state==="installed"&&navigator.serviceWorker.controller)nw.postMessage({type:"SKIP_WAITING"});});});});
  let refreshing=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!refreshing){refreshing=true;location.reload();}});
}

function urlBase64ToUint8Array(base64String){const padding="=".repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");const rawData=window.atob(base64);return Uint8Array.from([...rawData].map(char=>char.charCodeAt(0)));}

async function enablePushReminders(){
  const status=$("pushStatus");
  try{
    if(!userId||!sb){status.textContent=state.lang==="fr"?"Connecte-toi d’abord.":"Sign in first.";return;}
    if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window)){status.textContent=state.lang==="fr"?"Notifications non supportées sur cet appareil.":"Notifications are not supported on this device.";return;}
    if(!C.VAPID_PUBLIC_KEY){status.textContent=state.lang==="fr"?"Clé de notification manquante.":"Notification key is missing.";return;}
    const permission=await Notification.requestPermission();if(permission!=="granted"){status.textContent=state.lang==="fr"?"Notifications non autorisées.":"Notifications not allowed.";return;}
    status.textContent=state.lang==="fr"?"Activation en cours…":"Enabling…";const registration=await navigator.serviceWorker.ready;let subscription=await registration.pushManager.getSubscription();
    if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(C.VAPID_PUBLIC_KEY)});
    const data=subscription.toJSON();const {error}=await sb.from("push_subscriptions").upsert({user_id:userId,endpoint:data.endpoint,p256dh:data.keys.p256dh,auth:data.keys.auth,updated_at:new Date().toISOString()},{onConflict:"endpoint"});if(error)throw error;
    status.textContent=state.lang==="fr"?"✓ Rappels activés":"✓ Reminders enabled";toast(state.lang==="fr"?"Notifications activées 💧":"Notifications enabled 💧");
  }catch(error){console.error(error);status.textContent=state.lang==="fr"?"Impossible d’activer les rappels.":"Could not enable reminders.";toast(state.lang==="fr"?"Erreur lors de l’activation":"Activation error");}
}

$("enablePushBtn")?.addEventListener("click",enablePushReminders);
$("testPushBtn")?.addEventListener("click",async()=>{
  try{
    if(!sb||!userId){toast(state.lang==="fr"?"Connecte-toi d’abord.":"Sign in first.");return;}
    toast(state.lang==="fr"?"Envoi du test…":"Sending test…");const {data,error}=await sb.functions.invoke("send-water-test");if(error)throw error;
    toast(data?.delivered>0?(state.lang==="fr"?"Notification envoyée 💧":"Notification sent 💧"):(state.lang==="fr"?"Aucune notification envoyée":"No notification sent"));
  }catch(error){console.error("Push test error:",error);toast(state.lang==="fr"?"Erreur pendant le test":"Test error");}
});

window.setTimeout(()=>$("launchSplash")?.classList.add("hide"),900);
bind();
init();
