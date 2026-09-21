const C = window.GASSIEN_CONFIG || {};
const configured = C.SUPABASE_URL && !C.SUPABASE_URL.includes("PASTE_") &&
  C.SUPABASE_PUBLISHABLE_KEY && !C.SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");
const sb = configured ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY) : null;

const T = {
  fr: {
    hello: "Bonjour Gatien", subtitle: "On s’hydrate ?", of: "sur", todayProgress: "Progression du jour",
    remainingToday: n => `Encore ${n} aujourd’hui`, goalReached: "Objectif atteint", goalExceeded: n => `Objectif dépassé de ${n}`,
    nextReminder: "Prochain rappel", lastDrink: "Dernière prise", addWater: "Ajouter de l’eau", custom: "Quantité personnalisée", addLog: "Ajouter au journal",
    progress: "Progression", sevenDays: "7 jours", month: "Mois", year: "Année", goal: n => `Objectif ${n}`,
    avg: "Moyenne quotidienne", goalsReached: "Objectifs atteints", streak: "Série actuelle", days: "jours", thisWeek: "Cette semaine",
    versusPrevious: "par rapport à la semaine précédente", bestDay: "Meilleur jour", noComparison: "Pas encore assez de données",
    history: "Historique", historyLead: "Suivi quotidien", ofGoal: "de l’objectif", takes: "prises", first: "Première", last: "Dernière", noDayLogs: "Aucune prise enregistrée ce jour-là.",
    settings: "Réglages", settingsLead: "Personnalisez votre suivi", dailyGoal: "Objectif quotidien", customGoal: "Personnalisé",
    reminders: "Rappels", wake: "Heure de début", sleep: "Heure de fin", frequency: "Fréquence", saveReminders: "Enregistrer les rappels", testPush: "Envoyer une notification test",
    language: "Langue", data: "Données", sync: "Synchronisation", resetToday: "Réinitialiser les données du jour", deleteHistory: "Supprimer tout l’historique",
    account: "Compte", logout: "Déconnexion", about: "À propos", version: "Version 5.0", today: "Aujourd’hui", navProgress: "Progression", navHistory: "Historique", navSettings: "Réglages",
    cloud: "Cloud", local: "Local", offline: "Hors ligne", saved: "Réglages enregistrés", drank: "Tu as bu", deletedToday: "Données du jour réinitialisées", deletedAll: "Historique supprimé",
    authIntro: "Connecte-toi pour retrouver ton suivi d’hydratation sur tous tes appareils.",
    pushEnabled: "✓ Rappels activés", pushDisabled: "Rappels désactivés", enableFirst: "Connecte-toi d’abord.", unsupported: "Notifications non supportées sur cet appareil.", keyMissing: "Clé de notification manquante.", denied: "Notifications non autorisées.", enabling: "Activation en cours…", pushError: "Impossible d’activer les rappels.", testSending: "Envoi du test…", testSent: "Notification envoyée 💧", testNone: "Aucune notification envoyée", testError: "Erreur pendant le test",
    confirmReset: "Réinitialiser toutes les prises d’aujourd’hui ?", confirmDelete: "Supprimer définitivement tout l’historique d’hydratation ?",
    inMinutes: n => `Dans ${n} min`, inHours: (h,m) => `Dans ${h} h${m ? ` ${m}` : ""}`,
    weekDayCount: (a,b) => `${a} / ${b} jours`, above: n => `+ ${n} %`, below: n => `− ${n} %`,
    syncError: "Erreur de synchronisation", enterAmount: "Entre une quantité en ml"
  },
  en: {
    hello: "Good morning, Gatien", subtitle: "Let’s hydrate!", of: "of", todayProgress: "Today’s progress",
    remainingToday: n => `${n} left today`, goalReached: "Goal reached", goalExceeded: n => `Goal exceeded by ${n}`,
    nextReminder: "Next reminder", lastDrink: "Last drink", addWater: "Add water", custom: "Custom amount", addLog: "Add to log",
    progress: "Progress", sevenDays: "7 days", month: "Month", year: "Year", goal: n => `Goal ${n}`,
    avg: "Daily average", goalsReached: "Goals reached", streak: "Current streak", days: "days", thisWeek: "This week",
    versusPrevious: "compared with the previous week", bestDay: "Best day", noComparison: "Not enough data yet",
    history: "History", historyLead: "Daily tracking", ofGoal: "of goal", takes: "drinks", first: "First", last: "Last", noDayLogs: "No drinks recorded on this day.",
    settings: "Settings", settingsLead: "Personalise your tracking", dailyGoal: "Daily goal", customGoal: "Custom",
    reminders: "Reminders", wake: "Start time", sleep: "End time", frequency: "Frequency", saveReminders: "Save reminders", testPush: "Send a test notification",
    language: "Language", data: "Data", sync: "Sync", resetToday: "Reset today’s data", deleteHistory: "Delete all history",
    account: "Account", logout: "Sign out", about: "About", version: "Version 5.0", today: "Today", navProgress: "Progress", navHistory: "History", navSettings: "Settings",
    cloud: "Cloud", local: "Local", offline: "Offline", saved: "Settings saved", drank: "You drank", deletedToday: "Today’s data reset", deletedAll: "History deleted",
    authIntro: "Sign in to keep your hydration data synced across your devices.",
    pushEnabled: "✓ Reminders enabled", pushDisabled: "Reminders disabled", enableFirst: "Sign in first.", unsupported: "Notifications are not supported on this device.", keyMissing: "Notification key is missing.", denied: "Notifications not allowed.", enabling: "Enabling…", pushError: "Could not enable reminders.", testSending: "Sending test…", testSent: "Notification sent 💧", testNone: "No notification sent", testError: "Test error",
    confirmReset: "Reset all of today’s drinks?", confirmDelete: "Permanently delete all hydration history?",
    inMinutes: n => `In ${n} min`, inHours: (h,m) => `In ${h}h${m ? ` ${m}m` : ""}`,
    weekDayCount: (a,b) => `${a} / ${b} days`, above: n => `+ ${n} %`, below: n => `− ${n} %`,
    syncError: "Sync error", enterAmount: "Enter an amount in ml"
  }
};

let session = null, userId = null, channel = null;
let state = JSON.parse(localStorage.getItem("gassienLocal") || "null") || {
  lang: "fr", goal: 2000, interval: 60, wake: "08:00", sleep: "23:00", logs: [], remindersEnabled: false
};
state.remindersEnabled = !!state.remindersEnabled;
let progressPeriod = "week";
let progressOffset = 0;
let historyMonthOffset = 0;
let selectedHistoryKey = null;
let syncMode = "local";

const $ = id => document.getElementById(id);
const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
const toast = message => { const el = $("toast"); if (!el) return; el.textContent = message; el.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 1900); };
const key = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const saveLocal = () => localStorage.setItem("gassienLocal", JSON.stringify(state));
const locale = () => state.lang === "fr" ? "fr-FR" : "en-GB";
const formatL = (ml, digits = 1) => `${(ml / 1000).toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits })} L`;
const formatTime = ts => new Date(ts).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
const dayTotal = d => state.logs.filter(x => x.day === key(d)).reduce((sum, item) => sum + item.ml, 0);
selectedHistoryKey = key(new Date());
const totalForKey = dayKey => state.logs.filter(x => x.day === dayKey).reduce((sum, item) => sum + item.ml, 0);

function setSync(mode) {
  syncMode = mode;
  setText("settingsSyncText", mode === "cloud" ? T[state.lang].cloud : mode === "offline" ? T[state.lang].offline : T[state.lang].local);
}

async function init() {
  if (!configured) {
    $("configWarning").classList.remove("hidden");
    $("demoBtn").classList.remove("hidden");
    $("loginBtn").classList.add("hidden");
    $("signupBtn").classList.add("hidden");
    $("authFields").classList.add("hidden");
    setSync("local");
    bind(); render(); return;
  }
  const { data: { session: s } } = await sb.auth.getSession();
  if (s) await enterCloud(s); else $("auth").classList.remove("hidden");
  sb.auth.onAuthStateChange(async (_event, sess) => { if (sess && sess.user?.id !== userId) await enterCloud(sess); });
  bind();
}

async function enterCloud(s) {
  session = s; userId = s.user.id; $("auth").classList.add("hidden");
  await ensureSettings(); await loadCloud(); subscribeRealtime(); setSync("cloud"); await refreshPushState(); render();
}

async function ensureSettings() {
  const { data, error } = await sb.from("hydration_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error) { console.error(error); return; }
  if (!data) await sb.from("hydration_settings").insert({ user_id: userId, goal_ml: 2000, interval_minutes: 60, wake_time: "08:00", sleep_time: "23:00", language: "fr" });
}

async function loadCloud() {
  const [{ data: s, error: se }, { data: logs, error: le }] = await Promise.all([
    sb.from("hydration_settings").select("*").eq("user_id", userId).single(),
    sb.from("hydration_logs").select("*").eq("user_id", userId).order("consumed_at", { ascending: false }).limit(1500)
  ]);
  if (se || le) { console.error(se || le); setSync("offline"); return; }
  state.lang = s.language || "fr";
  state.goal = s.goal_ml;
  state.interval = s.interval_minutes;
  state.wake = (s.wake_time || "08:00").slice(0, 5);
  state.sleep = (s.sleep_time || "23:00").slice(0, 5);
  state.logs = (logs || []).map(x => ({ id: x.id, ml: x.amount_ml, ts: new Date(x.consumed_at).getTime(), day: key(new Date(x.consumed_at)) }));
  saveLocal();
}

function subscribeRealtime() {
  if (channel) sb.removeChannel(channel);
  channel = sb.channel("2lo-live-" + userId)
    .on("postgres_changes", { event: "*", schema: "public", table: "hydration_settings", filter: `user_id=eq.${userId}` }, async () => { await loadCloud(); render(); })
    .on("postgres_changes", { event: "*", schema: "public", table: "hydration_logs", filter: `user_id=eq.${userId}` }, async () => { await loadCloud(); render(); })
    .subscribe(status => { if (status === "SUBSCRIBED") setSync("cloud"); });
}

function todays() { return state.logs.filter(x => x.day === key()); }
function totalToday() { return todays().reduce((sum, item) => sum + item.ml, 0); }

function parseClock(clock, base = new Date()) {
  const [h, m] = String(clock || "00:00").split(":").map(Number);
  const d = new Date(base); d.setHours(h || 0, m || 0, 0, 0); return d;
}

function getNextReminderDate(now = new Date()) {
  const interval = Math.max(15, Number(state.interval) || 60);
  let wake = parseClock(state.wake || "08:00", now);
  let sleep = parseClock(state.sleep || "23:00", now);
  if (sleep <= wake) sleep.setDate(sleep.getDate() + 1);
  if (now < wake) return wake;
  if (now >= sleep) { wake.setDate(wake.getDate() + 1); return wake; }
  const elapsed = Math.max(0, now - wake);
  const steps = Math.floor(elapsed / (interval * 60000)) + 1;
  const next = new Date(wake.getTime() + steps * interval * 60000);
  if (next > sleep) { wake.setDate(wake.getDate() + 1); return wake; }
  return next;
}

function relativeReminderText(date) {
  const mins = Math.max(0, Math.round((date.getTime() - Date.now()) / 60000));
  if (mins < 60) return T[state.lang].inMinutes(mins);
  return T[state.lang].inHours(Math.floor(mins / 60), mins % 60);
}

function render() {
  const t = T[state.lang];
  document.documentElement.lang = state.lang;
  setText("hello", t.hello); setText("subtitle", t.subtitle); setText("ofText", t.of); setText("todayProgressLabel", t.todayProgress);
  setText("nextLabel", t.nextReminder); setText("lastDrinkLabel", t.lastDrink); setText("addWaterMainText", t.addWater); setText("addSheetTitle", t.addWater); setText("customLabel", t.custom); setText("addCustomBtn", t.addLog);
  setText("progressTitle", t.progress); setText("periodWeek", t.sevenDays); setText("periodMonth", t.month); setText("periodYear", t.year); setText("avgLabel", t.avg); setText("goalsReachedLabel", t.goalsReached); setText("streakLabel", t.streak); setText("daysLabel", t.days); setText("weekComparisonLabel", t.thisWeek); setText("weekComparisonSub", t.versusPrevious); setText("bestDayLabel", t.bestDay);
  setText("historyTitle", t.history); setText("historyLead", t.historyLead); setText("ofGoalLabel", t.ofGoal); setText("takesLabel", t.takes); setText("firstLabel", t.first); setText("lastLabel", t.last);
  setText("settingsTitle", t.settings); setText("settingsLead", t.settingsLead); setText("dailyGoalTitle", t.dailyGoal); setText("customGoalLabel", t.customGoal); setText("remindersTitle", t.reminders); setText("wakeLabel", t.wake); setText("sleepLabel", t.sleep); setText("intervalLabel", t.frequency); setText("saveSettings", t.saveReminders); setText("testPushBtn", t.testPush); setText("languageTitle", t.language); setText("dataTitle", t.data); setText("syncLabel", t.sync); setText("resetTodayLabel", t.resetToday); setText("deleteHistoryLabel", t.deleteHistory); setText("accountTitle", t.account); setText("logoutLabel", t.logout); setText("aboutTitle", t.about); setText("versionLabel", t.version);
  setText("navHome", t.today); setText("navProgress", t.navProgress); setText("navHistory", t.navHistory); setText("navSettings", t.navSettings); setText("authIntro", t.authIntro);
  setText("settingsSyncText", syncMode === "cloud" ? t.cloud : syncMode === "offline" ? t.offline : t.local);

  $("langFr")?.classList.toggle("active", state.lang === "fr"); $("langEn")?.classList.toggle("active", state.lang === "en");
  $("langChoiceFr")?.parentElement?.classList.toggle("selected", state.lang === "fr"); $("langChoiceEn")?.parentElement?.classList.toggle("selected", state.lang === "en");
  setText("accountEmail", session?.user?.email || (state.lang === "fr" ? "Mode local" : "Local mode"));

  renderToday(); renderProgress(); renderHistory(); renderSettings(); saveLocal();
}

function renderToday() {
  const t = T[state.lang]; const total = totalToday();
  const pctActual = state.goal > 0 ? Math.round(total / state.goal * 100) : 0; const fill = Math.min(100, Math.max(0, pctActual));
  setText("currentLitres", formatL(total)); setText("goalLitres", formatL(state.goal)); setText("percent", `${pctActual} %`);
  const gauge = $("hydrationGauge"); gauge?.style.setProperty("--fill", fill); gauge?.classList.toggle("goal-reached", pctActual === 100); gauge?.classList.toggle("goal-exceeded", pctActual > 100);
  const liquid = $("gaugeLiquid"); liquid?.parentElement?.style.setProperty("--fill", fill); liquid?.style.setProperty("--fill", fill);
  const progress = $("gaugeProgress"); if (progress) progress.style.strokeDashoffset = String(823.1 * (1 - fill / 100));
  if (liquid) liquid.style.height = `${fill}%`;
  const dot = $("gaugeDot");
  if (dot) {
    const angle = (-90 + fill * 3.6) * Math.PI / 180; const r = 131;
    dot.setAttribute("cx", (150 + r * Math.cos(angle)).toFixed(2)); dot.setAttribute("cy", (150 + r * Math.sin(angle)).toFixed(2)); dot.style.opacity = fill <= 1 ? "0" : "1";
  }
  const msg = $("goalMessage"); msg?.classList.remove("reached", "exceeded");
  if (total < state.goal) setText("goalMessage", "");
  if (msg) {
    const text = total < state.goal ? t.remainingToday(formatL(state.goal - total)) : total === state.goal ? t.goalReached : t.goalExceeded(formatL(total - state.goal));
    msg.innerHTML = `<span class="drop-small">●</span><span>${text}</span>`;
    if (total === state.goal) msg.classList.add("reached"); if (total > state.goal) msg.classList.add("exceeded");
  }
  const next = getNextReminderDate(); setText("nextReminderTime", formatTime(next.getTime())); setText("nextReminderRelative", relativeReminderText(next));
  const last = [...state.logs].sort((a, b) => b.ts - a.ts)[0];
  setText("lastDrinkAmount", last ? `${last.ml} ml` : "—"); setText("lastDrinkTime", last ? formatTime(last.ts) : "—");
}

function datesBetween(start, count) { return Array.from({ length: count }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); d.setHours(12, 0, 0, 0); return d; }); }

function getProgressPeriodInfo() {
  const now = new Date(); now.setHours(12, 0, 0, 0);
  if (progressPeriod === "week") {
    const end = new Date(now); end.setDate(end.getDate() + progressOffset * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    const days = datesBetween(start, 7);
    return { days, data: days.map(d => ({ date: d, label: d.toLocaleDateString(locale(), { weekday: "short" }).replace(".", "") + "\n" + d.getDate(), value: dayTotal(d) })), label: `${start.toLocaleDateString(locale(), { day: "numeric", month: "short" })} – ${end.toLocaleDateString(locale(), { day: "numeric", month: "short" })}` };
  }
  if (progressPeriod === "month") {
    const base = new Date(now.getFullYear(), now.getMonth() + progressOffset, 1, 12); const dayCount = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate(); const days = datesBetween(base, dayCount);
    const groups = [];
    for (let i = 0; i < dayCount; i += 5) { const slice = days.slice(i, i + 5); groups.push({ label: `${i + 1}–${Math.min(i + 5, dayCount)}`, value: Math.round(slice.reduce((s, d) => s + dayTotal(d), 0) / slice.length) }); }
    return { days, data: groups, label: base.toLocaleDateString(locale(), { month: "long", year: "numeric" }) };
  }
  const year = now.getFullYear() + progressOffset; const days = []; const data = [];
  for (let month = 0; month < 12; month++) {
    const dayCount = new Date(year, month + 1, 0).getDate(); const mdays = datesBetween(new Date(year, month, 1, 12), dayCount); days.push(...mdays);
    data.push({ label: new Date(year, month, 1).toLocaleDateString(locale(), { month: "short" }).replace(".", ""), value: Math.round(mdays.reduce((s, d) => s + dayTotal(d), 0) / dayCount) });
  }
  return { days, data, label: String(year) };
}

function currentStreak() {
  let streak = 0; const d = new Date(); d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 365; i++) { const check = new Date(d); check.setDate(d.getDate() - i); if (dayTotal(check) > 0) streak++; else if (i === 0) continue; else break; }
  return streak;
}

function weeklyComparison() {
  const now = new Date(); now.setHours(12, 0, 0, 0); let current = 0, previous = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(now); d.setDate(now.getDate() - i); current += dayTotal(d); }
  for (let i = 7; i < 14; i++) { const d = new Date(now); d.setDate(now.getDate() - i); previous += dayTotal(d); }
  if (!previous) return null; return Math.round((current - previous) / previous * 100);
}

function renderProgress() {
  const t = T[state.lang], info = getProgressPeriodInfo(); setText("periodLabel", info.label);
  const maxValue = Math.max(state.goal * 1.5, ...info.data.map(x => x.value), 3000); const maxRounded = Math.ceil(maxValue / 500) * 500;
  setText("chartMaxLabel", formatL(maxRounded)); setText("chartGoalAxisLabel", formatL(state.goal)); setText("chartHalfLabel", formatL(state.goal / 2)); setText("chartGoalLabel", t.goal(formatL(state.goal)));
  const goalTop = 7.5 + (1 - Math.min(1, state.goal / maxRounded)) * 79; if ($("goalThreshold")) $("goalThreshold").style.top = `${goalTop}%`;
  $("progressChart").innerHTML = info.data.map(item => {
    const height = item.value <= 0 ? 0 : Math.max(2, Math.min(100, item.value / maxRounded * 100)); const intensity = (0.20 + 0.80 * Math.min(1, item.value / state.goal)).toFixed(2);
    const isToday = item.date && key(item.date) === key();
    return `<div class="bar-item ${isToday ? "is-today" : ""}" title="${item.value} ml"><div class="bar-track"><div class="bar" style="--bar:${height}%;--intensity:${intensity}"></div></div><div class="bar-label">${item.label}</div></div>`;
  }).join("");

  const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  const totals = info.days.filter(d => d <= todayEnd).map(d => ({ d, value: dayTotal(d) })); const avg = totals.length ? Math.round(totals.reduce((s, x) => s + x.value, 0) / totals.length) : 0;
  const reached = totals.filter(x => x.value >= state.goal).length; setText("avgValue", formatL(avg)); setText("goalsReachedValue", t.weekDayCount(reached, totals.length)); setText("streakValue", currentStreak());
  const compare = weeklyComparison(); setText("weekComparisonValue", compare === null ? "—" : compare >= 0 ? t.above(Math.abs(compare)) : t.below(Math.abs(compare))); setText("weekComparisonSub", compare === null ? t.noComparison : t.versusPrevious);
  const best = totals.reduce((bestItem, item) => item.value > (bestItem?.value ?? -1) ? item : bestItem, null);
  setText("bestDayValue", best && best.value > 0 ? `${formatL(best.value)} · ${best.d.toLocaleDateString(locale(), { weekday: "long" })}` : "—");
  document.querySelectorAll(".segment").forEach(btn => btn.classList.toggle("active", btn.dataset.period === progressPeriod));
  $("periodNext").disabled = progressOffset >= 0; $("periodNext").style.opacity = progressOffset >= 0 ? ".3" : "1";
}

function renderHistory() {
  const t = T[state.lang]; const now = new Date(); const base = new Date(now.getFullYear(), now.getMonth() + historyMonthOffset, 1, 12);
  setText("historyMonthLabel", base.toLocaleDateString(locale(), { month: "long", year: "numeric" }));
  const weekdayNames = state.lang === "fr" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  $("weekdayRow").innerHTML = weekdayNames.map(x => `<span>${x}</span>`).join("");
  const firstOffset = (new Date(base.getFullYear(), base.getMonth(), 1).getDay() + 6) % 7; const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate(); let html = "";
  for (let i = 0; i < firstOffset; i++) html += '<span class="calendar-day empty"></span>';
  for (let day = 1; day <= days; day++) {
    const d = new Date(base.getFullYear(), base.getMonth(), day, 12); const dk = key(d); const total = dayTotal(d); const ratio = state.goal ? Math.min(1, total / state.goal) : 0; const alpha = total ? (0.10 + ratio * 0.64).toFixed(2) : 0;
    const classes = ["calendar-day", total ? "has-log" : "", dk === selectedHistoryKey ? "selected" : "", dk === key() ? "today" : "", total > state.goal ? "exceeded" : ""].filter(Boolean).join(" ");
    html += `<button class="${classes}" style="--alpha:${alpha}" data-day="${dk}" type="button">${day}</button>`;
  }
  $("calendarGrid").innerHTML = html; $("nextMonth").disabled = historyMonthOffset >= 0; $("nextMonth").style.opacity = historyMonthOffset >= 0 ? ".3" : "1"; renderSelectedDay(t);
}

function renderSelectedDay(t = T[state.lang]) {
  const [y, m, d] = selectedHistoryKey.split("-").map(Number); const date = new Date(y, m - 1, d, 12); const logs = state.logs.filter(x => x.day === selectedHistoryKey).sort((a, b) => a.ts - b.ts); const total = logs.reduce((s, x) => s + x.ml, 0); const pct = state.goal ? Math.round(total / state.goal * 100) : 0;
  setText("selectedDateLabel", date.toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })); setText("selectedDayTotal", formatL(total)); setText("selectedDayPercent", `${pct} %`); setText("selectedDrinkCount", logs.length); setText("selectedFirstTime", logs[0] ? formatTime(logs[0].ts) : "—"); setText("selectedLastTime", logs.at(-1) ? formatTime(logs.at(-1).ts) : "—");
  $("dayScoreRing")?.style.setProperty("--score-pct", `${Math.min(100, pct)}%`);
  $("selectedDayLogs").innerHTML = logs.length ? logs.map(x => `<div class="day-log-row"><span>▱</span><time>${formatTime(x.ts)}</time><strong>${x.ml} ml</strong></div>`).join("") : `<div class="empty-day">${t.noDayLogs}</div>`;
}

function renderSettings() {
  setText("goalHeaderValue", formatL(state.goal)); $("goalInput").value = state.goal; $("intervalInput").value = String(state.interval); $("wakeInput").value = state.wake; $("sleepInput").value = state.sleep;
  document.querySelectorAll("[data-goal]").forEach(btn => { btn.classList.toggle("active", Number(btn.dataset.goal) === Number(state.goal)); btn.textContent = formatL(Number(btn.dataset.goal)); });
  const optionLabels = state.lang === "fr" ? {30:"30 min",45:"45 min",60:"Toutes les heures",90:"Toutes les 1 h 30",120:"Toutes les 2 heures"} : {30:"Every 30 min",45:"Every 45 min",60:"Every hour",90:"Every 1h 30",120:"Every 2 hours"};
  Array.from($("intervalInput").options).forEach(opt => { opt.textContent = optionLabels[opt.value] || opt.textContent; });
  $("reminderToggle")?.classList.toggle("on", state.remindersEnabled); $("reminderToggle")?.setAttribute("aria-checked", state.remindersEnabled ? "true" : "false");
  if (state.remindersEnabled && $("pushStatus") && !$("pushStatus").textContent) $("pushStatus").textContent = T[state.lang].pushEnabled;
}

async function addWater(ml, atMs = Date.now()) {
  const amount = Math.round(Number(ml)); if (!amount || amount <= 0) return;
  const temp = { id: "temp-" + Date.now(), ml: amount, ts: atMs, day: key(new Date(atMs)) }; state.logs.push(temp); render(); closeAddSheet();
  if (sb && userId) {
    const { error } = await sb.from("hydration_logs").insert({ user_id: userId, amount_ml: amount, consumed_at: new Date(atMs).toISOString() });
    if (error) { state.logs = state.logs.filter(x => x.id !== temp.id); setSync("offline"); render(); toast(T[state.lang].syncError); return; }
  } else saveLocal();
  toast(`${T[state.lang].drank} ${amount} ml 💧`);
}

async function saveSettings(silent = false) {
  state.goal = Math.max(500, Number($("goalInput").value) || state.goal || 2000); state.interval = Number($("intervalInput").value) || 60; state.wake = $("wakeInput").value || "08:00"; state.sleep = $("sleepInput").value || "23:00"; render();
  if (sb && userId) {
    const { error } = await sb.from("hydration_settings").update({ goal_ml: state.goal, interval_minutes: state.interval, wake_time: state.wake, sleep_time: state.sleep, language: state.lang }).eq("user_id", userId);
    if (error) { console.error(error); setSync("offline"); }
  }
  saveLocal(); if (!silent) toast(T[state.lang].saved);
}

async function setLanguage(lang) {
  state.lang = lang === "en" ? "en" : "fr"; render();
  if (sb && userId) await sb.from("hydration_settings").update({ language: state.lang }).eq("user_id", userId); else saveLocal();
}

function showScreen(target) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.dataset.screen === target));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.target === target));
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (target === "history") renderHistory(); if (target === "progress") renderProgress(); if (target === "settings") renderSettings();
}

function openAddSheet() { $("customTime").value = new Date().toTimeString().slice(0, 5); $("addSheet").classList.remove("hidden"); $("addSheet").setAttribute("aria-hidden", "false"); }
function closeAddSheet() { $("addSheet").classList.add("hidden"); $("addSheet").setAttribute("aria-hidden", "true"); $("customMl").value = ""; }
function customTimestampFromTime(timeValue) { if (!timeValue) return Date.now(); const [h, m] = timeValue.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); }

async function resetToday() {
  const t = T[state.lang]; if (!confirm(t.confirmReset)) return; const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1);
  if (sb && userId) { const { error } = await sb.from("hydration_logs").delete().eq("user_id", userId).gte("consumed_at", start.toISOString()).lt("consumed_at", end.toISOString()); if (error) { toast(t.syncError); return; } }
  state.logs = state.logs.filter(x => x.day !== key()); render(); toast(t.deletedToday);
}

async function deleteAllHistory() {
  const t = T[state.lang]; if (!confirm(t.confirmDelete)) return;
  if (sb && userId) { const { error } = await sb.from("hydration_logs").delete().eq("user_id", userId); if (error) { toast(t.syncError); return; } }
  state.logs = []; render(); toast(t.deletedAll);
}

function urlBase64ToUint8Array(base64String) { const padding = "=".repeat((4 - base64String.length % 4) % 4); const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/"); const rawData = window.atob(base64); return Uint8Array.from([...rawData].map(char => char.charCodeAt(0))); }

async function refreshPushState() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription(); state.remindersEnabled = !!subscription; saveLocal();
  } catch (e) { console.warn(e); }
}

async function enablePushReminders() {
  const t = T[state.lang]; const status = $("pushStatus");
  try {
    if (!userId || !sb) { status.textContent = t.enableFirst; return false; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) { status.textContent = t.unsupported; return false; }
    if (!C.VAPID_PUBLIC_KEY) { status.textContent = t.keyMissing; return false; }
    const permission = await Notification.requestPermission(); if (permission !== "granted") { status.textContent = t.denied; return false; }
    status.textContent = t.enabling; const registration = await navigator.serviceWorker.ready; let subscription = await registration.pushManager.getSubscription();
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(C.VAPID_PUBLIC_KEY) });
    const data = subscription.toJSON(); const { error } = await sb.from("push_subscriptions").upsert({ user_id: userId, endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth, updated_at: new Date().toISOString() }, { onConflict: "endpoint" }); if (error) throw error;
    state.remindersEnabled = true; status.textContent = t.pushEnabled; renderSettings(); saveLocal(); toast(t.pushEnabled); return true;
  } catch (error) { console.error(error); status.textContent = t.pushError; state.remindersEnabled = false; renderSettings(); return false; }
}

async function disablePushReminders() {
  const t = T[state.lang];
  try {
    if ("serviceWorker" in navigator) { const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription(); if (subscription) { const endpoint = subscription.endpoint; if (sb && userId) { try { await sb.from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", endpoint); } catch {} } await subscription.unsubscribe(); } }
  } catch (e) { console.warn(e); }
  state.remindersEnabled = false; setText("pushStatus", t.pushDisabled); renderSettings(); saveLocal(); toast(t.pushDisabled);
}

async function toggleReminderPush() { if (state.remindersEnabled) await disablePushReminders(); else await enablePushReminders(); }

function bind() {
  if (window.__bound) return; window.__bound = true;
  $("demoBtn").onclick = () => { $("auth").classList.add("hidden"); render(); };
  $("loginBtn").onclick = async () => { const { error } = await sb.auth.signInWithPassword({ email: $("email").value.trim(), password: $("password").value }); if (error) toast(error.message); };
  $("signupBtn").onclick = async () => { const { error } = await sb.auth.signUp({ email: $("email").value.trim(), password: $("password").value }); if (error) toast(error.message); else toast("Compte créé. Vérifie l’e-mail si demandé."); };
  $("logoutBtn").onclick = async () => { if (sb) await sb.auth.signOut(); location.reload(); };
  document.querySelectorAll(".quick").forEach(b => b.onclick = () => addWater(Number(b.dataset.ml)));
  document.querySelectorAll("[data-add-ml]").forEach(b => b.onclick = () => addWater(Number(b.dataset.addMl), customTimestampFromTime($("customTime").value)));
  $("addCustomBtn").onclick = () => { const amount = Number($("customMl").value); if (amount > 0) addWater(amount, customTimestampFromTime($("customTime").value)); else toast(T[state.lang].enterAmount); };
  $("openAdd").onclick = openAddSheet; $("closeAdd").onclick = closeAddSheet; $("addSheet").addEventListener("click", e => { if (e.target === $("addSheet")) closeAddSheet(); });
  $("langBtn").onclick = () => setLanguage(state.lang === "fr" ? "en" : "fr"); document.querySelectorAll("[data-language]").forEach(b => b.onclick = () => setLanguage(b.dataset.language));
  document.querySelectorAll(".nav-btn").forEach(b => b.onclick = () => showScreen(b.dataset.target)); document.querySelectorAll("[data-go-home]").forEach(b => b.onclick = () => showScreen("today")); document.querySelectorAll("[data-target-settings]").forEach(b => b.onclick = () => showScreen("settings"));
  $("lastDrinkCard").onclick = () => { selectedHistoryKey = key(); historyMonthOffset = 0; showScreen("history"); };
  document.querySelectorAll(".segment").forEach(b => b.onclick = () => { progressPeriod = b.dataset.period; progressOffset = 0; renderProgress(); });
  $("periodPrev").onclick = () => { progressOffset--; renderProgress(); }; $("periodNext").onclick = () => { if (progressOffset < 0) progressOffset++; renderProgress(); };
  $("prevMonth").onclick = () => { historyMonthOffset--; const base = new Date(); base.setMonth(base.getMonth() + historyMonthOffset, 1); selectedHistoryKey = key(base); renderHistory(); };
  $("nextMonth").onclick = () => { if (historyMonthOffset < 0) { historyMonthOffset++; const base = new Date(); base.setMonth(base.getMonth() + historyMonthOffset, 1); selectedHistoryKey = historyMonthOffset === 0 ? key() : key(base); renderHistory(); } };
  $("calendarGrid").addEventListener("click", e => { const btn = e.target.closest("[data-day]"); if (!btn) return; selectedHistoryKey = btn.dataset.day; renderHistory(); });
  document.querySelectorAll("[data-goal]").forEach(btn => btn.onclick = async () => { $("goalInput").value = btn.dataset.goal; await saveSettings(true); });
  $("goalInput").addEventListener("change", () => saveSettings(true)); $("saveSettings").onclick = () => saveSettings(false); $("reminderToggle").onclick = toggleReminderPush;
  $("resetTodayBtn").onclick = resetToday; $("deleteHistoryBtn").onclick = deleteAllHistory;

  $("testPushBtn").onclick = async () => {
    const t = T[state.lang];
    try { if (!sb || !userId) { toast(t.enableFirst); return; } toast(t.testSending); const { data, error } = await sb.functions.invoke("send-water-test"); if (error) throw error; toast(data?.delivered > 0 ? t.testSent : t.testNone); }
    catch (error) { console.error("Push test error:", error); toast(t.testError); }
  };
}

setInterval(() => { if ($("nextReminderRelative")) { const next = getNextReminderDate(); setText("nextReminderTime", formatTime(next.getTime())); setText("nextReminderRelative", relativeReminderText(next)); } }, 30000);
window.addEventListener("online", async () => { if (sb && userId) { await loadCloud(); setSync("cloud"); render(); } }); window.addEventListener("offline", () => { setSync("offline"); renderSettings(); });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => { const reg = await navigator.serviceWorker.register("./sw.js"); reg.update(); if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" }); reg.addEventListener("updatefound", () => { const nw = reg.installing; if (nw) nw.addEventListener("statechange", () => { if (nw.state === "installed" && navigator.serviceWorker.controller) nw.postMessage({ type: "SKIP_WAITING" }); }); }); });
  let refreshing = false; navigator.serviceWorker.addEventListener("controllerchange", () => { if (!refreshing) { refreshing = true; location.reload(); } });
}

window.setTimeout(() => $("launchSplash")?.classList.add("hide"), 900);
bind();
init();
