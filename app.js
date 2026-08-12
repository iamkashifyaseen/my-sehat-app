// ============ STATE ============
const STORAGE_KEY = "sehat_state_v1";

function defaultState() {
  return {
    profile: {
      name: "", age: null, gender: "male", height: null, weight: null,
      targetWeight: null, activityLevel: "moderate",
      calorieGoal: 2000, waterGoalMl: 2500,
      appPin: "", privatePin: "", onboarded: false,
    },
    meals: [], water: [], bp: [], exercise: [], sleep: [], mood: [],
    meditation: [], screenTime: [], intimacy: [], appUsage: [],
    customFoods: [],
    grooming: Object.fromEntries(GROOMING_DEFAULTS.map(g => [g.key, { lastDone: null }])),
    settings: {
      notificationsEnabled: false,
      reminders: {
        breakfast: "08:00", breakfastEnabled: true,
        lunch: "13:30", lunchEnabled: true,
        dinner: "20:00", dinnerEnabled: true,
        water: true, waterIntervalMin: 60, waterStart: "08:00", waterEnd: "22:00",
        sleep: "22:30", sleepEnabled: true,
        mood: "21:00", moodEnabled: true,
        hairoil: "19:00", hairoilEnabled: false,
        exercise: "18:00", exerciseEnabled: false,
        prayersEnabled: false,
        prayers: Object.fromEntries(PRAYER_DEFAULTS.map(p => [p.key, p.time])),
        custom: [], // [{id, label, time, enabled}]
      },
      firedToday: {},
    },
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return mergeWithDefaults(parsed);
  } catch (e) {
    return defaultState();
  }
}
function mergeWithDefaults(parsed) {
  const d = defaultState();
  return {
    ...d, ...parsed,
    profile: { ...d.profile, ...(parsed.profile || {}) },
    grooming: { ...d.grooming, ...(parsed.grooming || {}) },
    settings: {
      ...d.settings, ...(parsed.settings || {}),
      reminders: {
        ...d.settings.reminders, ...((parsed.settings || {}).reminders || {}),
        prayers: { ...d.settings.reminders.prayers, ...(((parsed.settings || {}).reminders || {}).prayers || {}) },
        custom: ((parsed.settings || {}).reminders || {}).custom || [],
      },
      firedToday: (parsed.settings || {}).firedToday || {},
    },
  };
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ============ NAV / VIEW ============
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === id));
  window.scrollTo(0, 0);
  if (id === "view-dashboard") renderDashboard();
  if (id === "view-track") renderTrack();
  if (id === "view-reports") renderReports();
  if (id === "view-private") renderPrivate();
  if (id === "view-settings") renderSettings();
}

function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ============ SHEET (bottom modal) ============
function openSheet(html) {
  const overlay = document.getElementById("sheet-overlay");
  overlay.innerHTML = `<div class="sheet">
    <button class="sheet-close" onclick="closeSheet()">✕</button>
    <div class="sheet-handle"></div>
    ${html}
  </div>`;
  overlay.classList.add("open");
}
function closeSheet() {
  document.getElementById("sheet-overlay").classList.remove("open");
}

// ============ DASHBOARD ============
function renderDashboard() {
  const p = state.profile;
  document.getElementById("greetingName").textContent = p.name ? `Assalam-o-Alaikum, ${p.name}` : "Assalam-o-Alaikum";
  document.getElementById("todayDate").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("avatarInitial").textContent = (p.name || "S")[0].toUpperCase();

  const calToday = sumToday(state.meals, "cal");
  const waterToday = sumToday(state.water, "ml");
  const stepsToday = sumToday(state.exercise, "steps");
  const calGoal = p.calorieGoal || 2000;
  const waterGoal = p.waterGoalMl || 2500;
  const stepGoal = 8000;

  drawRings(
    Math.min(1, calToday / calGoal),
    Math.min(1, waterToday / waterGoal),
    Math.min(1, stepsToday / stepGoal)
  );
  document.getElementById("statCal").innerHTML = `<b>${calToday}</b> / ${calGoal} kcal`;
  document.getElementById("statWater").innerHTML = `<b>${(waterToday / 1000).toFixed(1)}L</b> / ${(waterGoal / 1000).toFixed(1)}L`;
  document.getElementById("statSteps").innerHTML = `<b>${stepsToday}</b> / ${stepGoal} steps`;

  renderDayStrip();
  renderStatRow(calToday, calGoal, stepsToday, stepGoal);
  drawScoreRing(computeSehatScore(state));
  const streakEl = document.getElementById("streakPill");
  if (streakEl) streakEl.textContent = `🔥 ${computeStreak(state)} din`;

  const tipsWrap = document.getElementById("tipsWrap");
  tipsWrap.innerHTML = generateTips(state).slice(0, 3).map(t =>
    `<div class="tip-card"><div class="ico">💡</div><div class="txt">${t.text}</div></div>`
  ).join("");

  renderHomeGrid();
}

// ---- Modern rectangular tracker cards on the home screen ----
function homeCardValue(key) {
  const t = todayKey();
  switch (key) {
    case "meal": { const n = state.meals.filter(m => m.date === t).length; return n ? `${n} logged` : "Add meal"; }
    case "water": { const ml = sumToday(state.water, "ml"); return ml ? `${(ml/1000).toFixed(1)} L` : "Add water"; }
    case "bp": { const b = state.bp.find(x => x.date === t); return b ? `${b.systolic}/${b.diastolic}` : "No reading"; }
    case "exercise": { const m = state.exercise.filter(e=>e.date===t).reduce((s,e)=>s+(e.duration||0),0); return m ? `${m} min` : "Log activity"; }
    case "sleep": { const s = state.sleep.find(x => x.date === t); return s ? `${s.hours} hrs` : "Not logged"; }
    case "mood": { const m = state.mood.find(x => x.date === t); return m ? m.mood : "Check in"; }
    case "meditation": { const m = state.meditation.filter(x=>x.date===t).reduce((s,x)=>s+(x.duration||0),0); return m ? `${m} min` : "Start"; }
    case "grooming": { const due = Object.entries(state.grooming||{}).filter(([k,g])=>{const def=GROOMING_DEFAULTS.find(d=>d.key===k); if(!def) return false; const days=g.lastDone?(Date.now()-new Date(g.lastDone).getTime())/86400000:999; return days>=def.frequencyDays;}).length; return due ? `${due} due` : "All done"; }
    case "screentime": { const m = Math.round(getTodayAppUsageMinutes()); return `${m} min (app)`; }
    default: return "";
  }
}
function renderHomeGrid() {
  const wrap = document.getElementById("homeGrid");
  if (!wrap) return;
  const items = TRACK_ITEMS.filter(i => i.key !== "breathing");
  wrap.innerHTML = items.map(i => `
    <button class="rect-card" onclick="openTrackForm('${i.key}')">
      <div class="rect-ico ${i.cls}">${i.ico}</div>
      <div class="rect-body">
        <div class="rect-title">${i.label}</div>
        <div class="rect-val">${homeCardValue(i.key)}</div>
      </div>
    </button>`).join("");
}

// ---- Day strip (week view, today highlighted) ----
function renderDayStrip() {
  const wrap = document.getElementById("dayStrip");
  if (!wrap) return;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  let html = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    html += `<div class="day-pill${isToday ? " today" : ""}">
      <span>${days[i]}</span><span class="dnum">${d.getDate()}</span>
    </div>`;
  }
  wrap.innerHTML = html;
}

// ---- Stat row (quick glance cards) ----
function renderStatRow(calToday, calGoal, stepsToday, stepGoal) {
  const wrap = document.getElementById("statRow");
  if (!wrap) return;
  wrap.innerHTML = `
    <div class="stat-card">
      <div class="stico ico-amber">🔥</div>
      <div class="stlabel">Calories</div>
      <div class="stval">${calToday}<span class="stunit"> / ${calGoal}</span></div>
    </div>
    <div class="stat-card">
      <div class="stico ico-blue">👣</div>
      <div class="stlabel">Steps</div>
      <div class="stval">${stepsToday}<span class="stunit"> / ${stepGoal}</span></div>
    </div>`;
}

function drawRings(calPct, waterPct, stepPct) {
  const svg = document.getElementById("ringsSvg");
  const rings = [
    { r: 54, pct: calPct, color: "#E8A33D" },
    { r: 40, pct: waterPct, color: "#7ED0C0" },
    { r: 26, pct: stepPct, color: "#F2C6BE" },
  ];
  svg.innerHTML = rings.map(ring => {
    const c = 2 * Math.PI * ring.r;
    const offset = c * (1 - ring.pct);
    return `<circle cx="64" cy="64" r="${ring.r}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="9"/>
      <circle cx="64" cy="64" r="${ring.r}" fill="none" stroke="${ring.color}" stroke-width="9"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 64 64)"/>`;
  }).join("");
}

// ---- Sehat Score: composite 0-100 "AI" health score for today ----
function computeSehatScore(state) {
  const p = state.profile;
  const t = todayKey();
  let points = 0;

  const waterGoal = p.waterGoalMl || 2500;
  const waterToday = sumToday(state.water, "ml");
  points += Math.min(20, (waterToday / waterGoal) * 20);

  const calGoal = p.calorieGoal || 2000;
  const calToday = sumToday(state.meals, "cal");
  if (calToday > 0) {
    const ratio = calToday / calGoal;
    points += (ratio >= 0.85 && ratio <= 1.15) ? 20 : 10;
  }

  const stepsToday = sumToday(state.exercise, "steps");
  points += Math.min(20, (stepsToday / 8000) * 20);

  const lastSleep = state.sleep[state.sleep.length - 1];
  if (lastSleep && lastSleep.date === t) {
    points += (lastSleep.hours >= 6 && lastSleep.hours <= 9.5) ? 15 : 7;
  }

  if (state.mood.find(m => m.date === t)) points += 10;

  const exMin = state.exercise.filter(e => e.date === t).reduce((s, e) => s + (e.duration || 0), 0);
  points += Math.min(15, (exMin / 30) * 15);

  return Math.round(Math.min(100, points));
}
function drawScoreRing(pct) {
  const svg = document.getElementById("scoreRingSvg");
  const label = document.getElementById("scoreVal");
  if (!svg || !label) return;
  const r = 19, c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  const color = pct >= 70 ? "#C6FF3A" : pct >= 40 ? "#FFC24B" : "#FF6E6E";
  svg.innerHTML = `<circle cx="22" cy="22" r="${r}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="4"/>
    <circle cx="22" cy="22" r="${r}" fill="none" stroke="${color}" stroke-width="4"
      stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>`;
  label.textContent = pct;
}

// ---- Streak: consecutive days with at least one log ----
function computeStreak(state) {
  const hasLogOn = (key) =>
    state.meals.some(x => x.date === key) || state.water.some(x => x.date === key) ||
    state.exercise.some(x => x.date === key) || state.sleep.some(x => x.date === key) ||
    state.mood.some(x => x.date === key) || state.bp.some(x => x.date === key);
  let streak = 0;
  const d = new Date();
  if (!hasLogOn(todayKey(d))) d.setDate(d.getDate() - 1);
  while (hasLogOn(todayKey(d))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function sumToday(arr, field) { return sumTodayGlobal(arr, field); }
function sumTodayGlobal(arr, field) {
  const t = todayKey();
  return arr.filter(x => x.date === t).reduce((s, x) => s + (x[field] || 0), 0);
}

// ============ TRACK HUB ============
const TRACK_ITEMS = [
  { key: "meal", ico: "🍽️", label: "Meal", cls: "ico-amber" },
  { key: "water", ico: "💧", label: "Water", cls: "ico-teal" },
  { key: "bp", ico: "❤️", label: "Blood Pressure", cls: "ico-coral" },
  { key: "exercise", ico: "🏃", label: "Exercise / Walk", cls: "ico-blue" },
  { key: "breathing", ico: "🌬️", label: "Deep Breathing", cls: "ico-teal" },
  { key: "sleep", ico: "😴", label: "Sleep", cls: "ico-plum" },
  { key: "mood", ico: "🙂", label: "Mood", cls: "ico-lime" },
  { key: "meditation", ico: "🧘", label: "Meditation", cls: "ico-plum" },
  { key: "grooming", ico: "✂️", label: "Grooming", cls: "ico-amber" },
  { key: "screentime", ico: "📱", label: "Screen Time", cls: "ico-blue" },
];

function renderTrack() {
  const grid = document.getElementById("trackGrid");
  grid.innerHTML = TRACK_ITEMS.map(i => `
    <button class="rect-card" onclick="openTrackForm('${i.key}')">
      <div class="rect-ico ${i.cls}">${i.ico}</div>
      <div class="rect-body">
        <div class="rect-title">${i.label}</div>
        <div class="rect-val">${homeCardValue(i.key) || "Tap to log"}</div>
      </div>
    </button>`
  ).join("");
}

function openTrackForm(key) {
  const forms = {
    meal: formMeal, water: formWater, bp: formBp, exercise: formExercise,
    breathing: formBreathing, sleep: formSleep, mood: formMood,
    meditation: formMeditation, grooming: formGrooming, screentime: formScreenTime,
  };
  openSheet(forms[key]());
}

// ---- Meal form ----
function allFoods() { return [...FOOD_DB, ...state.customFoods]; }
function formMeal() {
  const options = allFoods().map((f, i) => `<option value="${i}">${f.name} (${f.serving})</option>`).join("");
  return `<div class="sheet-title">Meal Add Karein</div>
  <div class="field"><label>Meal Type</label>
    <select id="mMealType"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select>
  </div>
  <div class="field"><label>Khana Chunein</label><select id="mFood">${options}</select></div>
  <div class="field"><label>Portion (multiplier, e.g. 1 = 1 serving)</label><input id="mPortion" type="number" step="0.5" value="1"/></div>
  <button class="btn ghost sm" style="width:100%;margin-bottom:14px;" onclick="openSheet(formCustomFood())">+ Apna Khana Add Karein (custom)</button>
  <button class="btn" onclick="saveMeal()">Save</button>`;
}
function saveMeal() {
  const idx = +document.getElementById("mFood").value;
  const portion = +document.getElementById("mPortion").value || 1;
  const f = allFoods()[idx];
  const mealType = document.getElementById("mMealType").value;
  state.meals.push({ id: uid(), date: todayKey(), mealType, name: f.name, cal: Math.round(f.cal * portion), p: Math.round(f.p * portion), c: Math.round(f.c * portion), fat: Math.round(f.f * portion) });
  saveState(); closeSheet(); toast(`${f.name} add ho gaya ✓`); refreshCurrentView();
}
// ---- Custom food ----
function formCustomFood() {
  return `<div class="sheet-title">Apna Khana Add Karein</div>
  <div class="field"><label>Naam</label><input id="cfName" type="text" placeholder="e.g. Ammi ka special daal"/></div>
  <div class="field"><label>Serving Size</label><input id="cfServing" type="text" placeholder="e.g. 1 plate" value="1 serving"/></div>
  <div class="row-2">
    <div class="field"><label>Calories</label><input id="cfCal" type="number" placeholder="300"/></div>
    <div class="field"><label>Protein (g)</label><input id="cfP" type="number" placeholder="10"/></div>
  </div>
  <div class="row-2">
    <div class="field"><label>Carbs (g)</label><input id="cfC" type="number" placeholder="30"/></div>
    <div class="field"><label>Fat (g)</label><input id="cfF" type="number" placeholder="10"/></div>
  </div>
  <button class="btn" onclick="saveCustomFood()">Food Save Karein aur Use Karein</button>`;
}
function saveCustomFood() {
  const name = document.getElementById("cfName").value.trim();
  const cal = +document.getElementById("cfCal").value;
  if (!name || !cal) return toast("Naam aur Calories zaroori hain");
  const food = {
    name, serving: document.getElementById("cfServing").value || "1 serving",
    cal, p: +document.getElementById("cfP").value || 0,
    c: +document.getElementById("cfC").value || 0, f: +document.getElementById("cfF").value || 0,
  };
  state.customFoods.push(food);
  saveState(); toast(`${name} save ho gaya ✓`);
  openSheet(formMeal());
}

// ---- Water form ----
function formWater() {
  return `<div class="sheet-title">Pani Add Karein</div>
  <div class="chip-row">
    ${[250,500,750,1000].map(v=>`<button class="chip" onclick="quickWater(${v})">${v}ml</button>`).join("")}
  </div>
  <div class="field"><label>Custom Amount (ml)</label><input id="wCustom" type="number" placeholder="e.g. 300"/></div>
  <button class="btn" onclick="saveCustomWater()">Add</button>`;
}
function quickWater(ml) { state.water.push({ date: todayKey(), ml }); saveState(); closeSheet(); toast(`${ml}ml pani add ho gaya ✓`); refreshCurrentView(); }
function saveCustomWater() {
  const v = +document.getElementById("wCustom").value;
  if (!v) return toast("Amount likhein");
  quickWater(v);
}

// ---- BP form ----
function formBp() {
  return `<div class="sheet-title">Blood Pressure</div>
  <div class="row-2">
    <div class="field"><label>Systolic</label><input id="bpSys" type="number" placeholder="120"/></div>
    <div class="field"><label>Diastolic</label><input id="bpDia" type="number" placeholder="80"/></div>
  </div>
  <div class="field"><label>Pulse (bpm)</label><input id="bpPulse" type="number" placeholder="72"/></div>
  <button class="btn" onclick="saveBp()">Save Reading</button>`;
}
function saveBp() {
  const systolic = +document.getElementById("bpSys").value;
  const diastolic = +document.getElementById("bpDia").value;
  const pulse = +document.getElementById("bpPulse").value || null;
  if (!systolic || !diastolic) return toast("Systolic/Diastolic zaroori hai");
  state.bp.push({ date: todayKey(), time: Date.now(), systolic, diastolic, pulse });
  saveState(); closeSheet(); toast("BP reading save ho gayi ✓"); refreshCurrentView();
}

// ---- Exercise form ----
function formExercise() {
  return `<div class="sheet-title">Exercise / Walk</div>
  <div class="field"><label>Type</label>
    <select id="exType"><option>Walking</option><option>Running</option><option>Gym</option><option>Cycling</option><option>Other</option></select>
  </div>
  <div class="row-2">
    <div class="field"><label>Duration (min)</label><input id="exDur" type="number" placeholder="30"/></div>
    <div class="field"><label>Steps (optional)</label><input id="exSteps" type="number" placeholder="4000"/></div>
  </div>
  <button class="btn" onclick="saveExercise()">Save</button>`;
}
function saveExercise() {
  const type = document.getElementById("exType").value;
  const duration = +document.getElementById("exDur").value || 0;
  const steps = +document.getElementById("exSteps").value || 0;
  state.exercise.push({ date: todayKey(), type, duration, steps });
  saveState(); closeSheet(); toast("Exercise log ho gayi ✓"); refreshCurrentView();
}

// ---- Deep breathing ----
function formBreathing() {
  return `<div class="sheet-title">Deep Breathing</div>
  <p class="sub">4 second saans andar, 4 second rokein, 4 second bahar. Button dabayein aur follow karein.</p>
  <div style="text-align:center; margin:20px 0;">
    <div id="breathCircle" style="width:140px;height:140px;border-radius:50%;background:var(--pine-tint);margin:0 auto;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--pine);transition: transform 4s ease;">Start</div>
  </div>
  <button class="btn" onclick="startBreathing()">Start 1 Minute Session</button>`;
}
function startBreathing() {
  const el = document.getElementById("breathCircle");
  let phase = 0;
  const phases = ["Saans Andar...", "Rokein...", "Saans Bahar..."];
  el.textContent = phases[0]; el.style.transform = "scale(1.35)";
  const timer = setInterval(() => {
    phase = (phase + 1) % 3;
    el.textContent = phases[phase];
    el.style.transform = phase === 2 ? "scale(1)" : "scale(1.35)";
  }, 4000);
  setTimeout(() => {
    clearInterval(timer);
    state.meditation.push({ date: todayKey(), duration: 1, type: "breathing" });
    saveState(); toast("Breathing session complete ✓"); closeSheet(); refreshCurrentView();
  }, 60000);
}

// ---- Sleep form ----
function formSleep() {
  return `<div class="sheet-title">Sleep Log</div>
  <div class="row-2">
    <div class="field"><label>Bed Time</label><input id="slBed" type="time" value="23:00"/></div>
    <div class="field"><label>Wake Time</label><input id="slWake" type="time" value="07:00"/></div>
  </div>
  <div class="field"><label>Quality</label>
    <select id="slQuality"><option>Achi</option><option>Theek</option><option>Kharab</option></select>
  </div>
  <button class="btn" onclick="saveSleep()">Save</button>`;
}
function saveSleep() {
  const bed = document.getElementById("slBed").value;
  const wake = document.getElementById("slWake").value;
  const quality = document.getElementById("slQuality").value;
  let [bh, bm] = bed.split(":").map(Number);
  let [wh, wm] = wake.split(":").map(Number);
  let hours = (wh + wm / 60) - (bh + bm / 60);
  if (hours < 0) hours += 24;
  state.sleep.push({ date: todayKey(), bedtime: bed, waketime: wake, hours: +hours.toFixed(1), quality });
  saveState(); closeSheet(); toast("Sleep log ho gaya ✓"); refreshCurrentView();
}

// ---- Mood form ----
function formMood() {
  const moods = ["😢","😕","😐","🙂","😄"];
  return `<div class="sheet-title">Aaj Mood Kaisa Hai?</div>
  <div class="mood-grid">${moods.map(m=>`<button class="mood-opt" onclick="pickMood('${m}',this)">${m}</button>`).join("")}</div>
  <div class="field"><label>Note (optional)</label><textarea id="moodNote" rows="3" placeholder="Kuch likhna chahain..."></textarea></div>
  <button class="btn" onclick="saveMood()">Save</button>`;
}
let selectedMood = null;
function pickMood(m, el) {
  selectedMood = m;
  document.querySelectorAll(".mood-opt").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
}
function saveMood() {
  if (!selectedMood) return toast("Mood chunein");
  const note = document.getElementById("moodNote").value;
  state.mood.push({ date: todayKey(), mood: selectedMood, note });
  saveState(); closeSheet(); toast("Mood save ho gaya ✓"); selectedMood = null; refreshCurrentView();
}

// ---- Meditation ----
function formMeditation() {
  return `<div class="sheet-title">Meditation</div>
  <div class="chip-row">${[5,10,15,20].map(v=>`<button class="chip" onclick="startMeditation(${v})">${v} min</button>`).join("")}</div>
  <p class="sub">Aankhein band karein, aaram se baithein, aur normal saans lete rahein.</p>`;
}
function startMeditation(mins) {
  toast(`${mins} min meditation shuru — aaram se baithein 🧘`);
  closeSheet();
  setTimeout(() => {
    state.meditation.push({ date: todayKey(), duration: mins, type: "meditation" });
    saveState(); toast("Meditation complete ✓"); refreshCurrentView();
  }, mins * 60000);
}

// ---- Grooming ----
function formGrooming() {
  const rows = GROOMING_DEFAULTS.map(g => {
    const last = state.grooming[g.key]?.lastDone;
    const daysSince = last ? Math.floor((Date.now() - new Date(last).getTime())/86400000) : null;
    return `<div class="list-row">
      <div class="l-main"><div class="l-ico">${g.icon}</div>
        <div><div class="l-title">${g.label}</div><div class="l-sub">${last ? daysSince+" din pehle" : "Kabhi nahi"}</div></div>
      </div>
      <button class="btn sm" onclick="markGroomingDone('${g.key}')">Done</button>
    </div>`;
  }).join("");
  return `<div class="sheet-title">Grooming</div>${rows}`;
}
function markGroomingDone(key) {
  state.grooming[key] = { lastDone: new Date().toISOString() };
  saveState(); toast("Mark ho gaya ✓"); openTrackForm("grooming"); refreshCurrentView();
}

// ---- Screen time ----
function formScreenTime() {
  const appMin = Math.round(getTodayAppUsageMinutes());
  return `<div class="sheet-title">Screen Time</div>
  <div class="tip-card" style="background:var(--surface-2);">
    <div class="ico">📱</div>
    <div class="txt">Browsers is app ko total phone screen time dekhne ki ijazat nahi detay (security restriction) — is liye ye number sirf <b>is app mein guzara waqt</b> hai (${appMin} min aaj), poore phone ka nahi. Poora phone screen time apni Settings &gt; Screen Time / Digital Wellbeing se dekh kar neeche likhein.</div>
  </div>
  <div class="field"><label>Aaj Poore Phone Ka Screen Time (minutes)</label><input id="stMin" type="number" placeholder="e.g. 240" value="${(state.screenTime.find(s=>s.date===todayKey())||{}).minutes||""}"/></div>
  <button class="btn" onclick="saveScreenTime()">Save</button>`;
}
function saveScreenTime() {
  const min = +document.getElementById("stMin").value;
  if (!min) return toast("Minutes likhein");
  const existing = state.screenTime.find(s => s.date === todayKey());
  if (existing) existing.minutes = min; else state.screenTime.push({ date: todayKey(), minutes: min });
  saveState(); closeSheet(); toast("Screen time save ho gaya ✓"); refreshCurrentView();
}

// ---- Auto in-app usage tracking (Page Visibility API — cannot see outside this app) ----
let appUsageSessionStart = document.visibilityState === "visible" ? Date.now() : null;
function getTodayAppUsageMinutes() {
  const today = state.appUsage.find(a => a.date === todayKey());
  let mins = today ? today.minutes : 0;
  if (appUsageSessionStart) mins += (Date.now() - appUsageSessionStart) / 60000;
  return mins;
}
function flushAppUsage() {
  if (!appUsageSessionStart) return;
  const mins = (Date.now() - appUsageSessionStart) / 60000;
  appUsageSessionStart = null;
  if (mins < 0.05) return;
  const k = todayKey();
  let entry = state.appUsage.find(a => a.date === k);
  if (!entry) { entry = { date: k, minutes: 0 }; state.appUsage.push(entry); }
  entry.minutes += mins;
  if (state.appUsage.length > 120) state.appUsage = state.appUsage.slice(-120);
  saveState();
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushAppUsage();
  else appUsageSessionStart = Date.now();
});
window.addEventListener("beforeunload", flushAppUsage);
setInterval(flushAppUsage, 60000);

function refreshCurrentView() {
  const active = document.querySelector(".view.active");
  if (active) showView(active.id);
}

// ============ REPORTS ============
let reportChart = null;
let reportMetric = "cal";
let reportRange = "week";

function renderReports() {
  document.querySelectorAll("#reportMetricTabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.metric === reportMetric));
  document.querySelectorAll("#reportRangeTabs .tab-btn").forEach(b => b.classList.toggle("active", b.dataset.range === reportRange));
  drawReportChart();
}
function setReportMetric(m) { reportMetric = m; renderReports(); }
function setReportRange(r) { reportRange = r; renderReports(); }

function drawReportChart() {
  const days = reportRange === "week" ? 7 : reportRange === "month" ? 30 : reportRange === "year" ? 365 : 7;
  const labels = [];
  const values = [];
  const map = {
    cal: () => aggregateByDay(state.meals, "cal", days),
    water: () => aggregateByDay(state.water, "ml", days),
    steps: () => aggregateByDay(state.exercise, "steps", days),
    sleep: () => aggregateByDay(state.sleep, "hours", days),
    bp: () => null,
    mood: () => null,
  };
  const ctx = document.getElementById("reportCanvas").getContext("2d");
  if (reportChart) reportChart.destroy();

  if (reportMetric === "bp") {
    const rows = state.bp.slice(-days);
    reportChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: rows.map(r => r.date.slice(5)),
        datasets: [
          { label: "Systolic", data: rows.map(r => r.systolic), borderColor: "#D9695F", tension: .3 },
          { label: "Diastolic", data: rows.map(r => r.diastolic), borderColor: "#146356", tension: .3 },
        ]
      },
      options: chartOpts()
    });
    return;
  }
  if (reportMetric === "mood") {
    const counts = {};
    state.mood.slice(-days).forEach(m => counts[m.mood] = (counts[m.mood]||0)+1);
    reportChart = new Chart(ctx, {
      type: "bar",
      data: { labels: Object.keys(counts), datasets: [{ label: "Mood count", data: Object.values(counts), backgroundColor: "#E8A33D" }] },
      options: chartOpts()
    });
    return;
  }

  const agg = map[reportMetric]();
  reportChart = new Chart(ctx, {
    type: "line",
    data: { labels: agg.labels, datasets: [{ label: reportMetric, data: agg.values, borderColor: "#146356", backgroundColor: "rgba(20,99,86,0.1)", fill: true, tension: .3 }] },
    options: chartOpts()
  });
}
function chartOpts() {
  return { responsive: true, plugins: { legend: { display: true, labels: { font: { family: "Manrope" } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: "#EEF3F1" } } } };
}
function aggregateByDay(arr, field, days) {
  const labels = []; const values = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = todayKey(d);
    labels.push(key.slice(5));
    const dayVals = arr.filter(x => x.date === key);
    const sum = dayVals.reduce((s,x)=>s+(x[field]||0),0);
    values.push(field === "hours" ? (dayVals[0]?.hours || 0) : sum);
  }
  return { labels, values };
}

// ============ PRIVATE / INTIMACY SECTION ============
let pinBuffer = "";
let pinMode = "unlock"; // unlock | setup1 | setup2
let pinFirstEntry = "";

function renderPrivate() {
  if (!state.profile.privatePin) {
    pinMode = "setup1"; pinBuffer = "";
    showPrivateLock("Private space set up karein", "Ek 4-digit PIN banayein");
  } else {
    pinMode = "unlock"; pinBuffer = "";
    showPrivateLock("Private Space", "PIN daalein");
  }
}
function showPrivateLock(title, sub) {
  document.getElementById("privateContent").style.display = "none";
  document.getElementById("privateLock").style.display = "block";
  document.getElementById("lockTitle").textContent = title;
  document.getElementById("lockSub").textContent = sub;
  updatePinDots();
}
function pinPress(d) {
  if (pinBuffer.length >= 4) return;
  pinBuffer += d;
  updatePinDots();
  if (pinBuffer.length === 4) setTimeout(handlePinComplete, 150);
}
function pinBackspace() { pinBuffer = pinBuffer.slice(0, -1); updatePinDots(); }
function updatePinDots() {
  document.querySelectorAll(".pin-dot").forEach((el, i) => el.classList.toggle("filled", i < pinBuffer.length));
}
function handlePinComplete() {
  if (pinMode === "setup1") {
    pinFirstEntry = pinBuffer; pinBuffer = ""; pinMode = "setup2";
    document.getElementById("lockTitle").textContent = "PIN Dobara Likhein";
    document.getElementById("lockSub").textContent = "Confirm karein";
    updatePinDots();
  } else if (pinMode === "setup2") {
    if (pinBuffer === pinFirstEntry) {
      state.profile.privatePin = pinBuffer; saveState();
      toast("Private PIN set ho gaya ✓");
      unlockPrivate();
    } else {
      toast("PIN match nahi hua, dobara try karein");
      pinMode = "setup1"; pinBuffer = "";
      document.getElementById("lockTitle").textContent = "Ek 4-digit PIN banayein";
      updatePinDots();
    }
  } else {
    if (pinBuffer === state.profile.privatePin) {
      unlockPrivate();
    } else {
      toast("Galat PIN");
      pinBuffer = ""; updatePinDots();
    }
  }
}
function unlockPrivate() {
  document.getElementById("privateLock").style.display = "none";
  document.getElementById("privateContent").style.display = "block";
  renderPrivateContent();
}
function renderPrivateContent() {
  const entries = state.intimacy.slice().reverse().slice(0, 20);
  document.getElementById("privateList").innerHTML = entries.length ? entries.map(e =>
    `<div class="list-row"><div class="l-main"><div class="l-ico">💜</div>
      <div><div class="l-title">${new Date(e.date).toLocaleDateString("en-GB")}</div><div class="l-sub">${e.note||""}</div></div>
    </div></div>`
  ).join("") : `<div class="empty">Abhi koi entry nahi hai</div>`;

  const thisMonth = state.intimacy.filter(e => e.date.slice(0,7) === todayKey().slice(0,7)).length;
  document.getElementById("privateMonthCount").textContent = thisMonth;
  document.getElementById("privateTip").textContent = getIntimacyTip(thisMonth);
}
function getIntimacyTip(count) {
  const generalTips = [
    "Health experts ke mutabiq har couple ki zarurat mukhtalif hoti hai — comfortable communication zaroori hai.",
    "Regular open baat cheet (communication) rishtay ki health ke liye sab se zaroori cheez hai.",
    "Quality time aur ek dusray ki appreciation daily basis par karein — ye rishtay ko mazboot karta hai.",
    "Agar koi concern ho to doctor ya marriage counselor se mashwara karna behtareen qadam hai.",
  ];
  return generalTips[count % generalTips.length];
}
function quickIntimacyLog() {
  state.intimacy.push({ date: todayKey(), note: "" });
  saveState(); toast("Log ho gaya ✓"); renderPrivateContent();
}
function formPrivateAdd() {
  return `<div class="sheet-title">Entry Add Karein</div>
  <div class="field"><label>Date</label><input id="privDate" type="date" value="${todayKey()}"/></div>
  <div class="field"><label>Note (optional)</label><textarea id="privNote" rows="3" placeholder="Kuch bhi note karna chahain..."></textarea></div>
  <button class="btn plum" onclick="savePrivateEntry()">Save</button>`;
}
function savePrivateEntry() {
  const date = document.getElementById("privDate").value || todayKey();
  const note = document.getElementById("privNote").value;
  state.intimacy.push({ date, note });
  saveState(); closeSheet(); toast("Save ho gaya ✓"); renderPrivateContent();
}
function marriageTips() {
  return [
    "Roz kam az kam 10 minute bina phone ke apne partner se baat karein.",
    "Chhoti chhoti cheezon par shukriya ada karna na bhoolein.",
    "Ek dusray ki baat ghor se sunein, jawab dene ki jaldi na karein.",
    "Hafte mein ek baar koi activity mil kar karein jo dono ko pasand ho.",
    "Ikhtilaf ke waqt tone soft rakhein, blame se bachein.",
    "Apne partner ki koshishon ko notice karein aur tareef karein, chahe wo chhoti hi ho.",
    "Ghussay mein bade faislay na karein — pehle thanda ho kar baat karein.",
    "Ghar ke masail (paise, family) par khul kar baat karein, chhupayein nahi.",
    "Ek dusray ko surprise dene ki aadat dalein — chhota tohfa ya note bhi kaafi hai.",
    "Roz kam az kam ek baar mil kar hansi mazaq karein — humour rishtay ko halka rakhta hai.",
    "Partner ki family aur dosto ka bhi ihtiram karein.",
    "Galti hone par khule dil se maafi maangein, ego beech mein na aane dein.",
    "Ek dusray ke personal space aur waqt ka khayal rakhein.",
    "Mahine mein kam az kam ek 'date' rakhein — chahe ghar par hi ho.",
    "Namaz aur dua mil kar karne ki koshish karein, isse rishtay mein sukoon aata hai.",
    "Partner ki koi baat buri lage to foran judge na karein, pehle wajah samjhein.",
    "Roz raat sonay se pehle din ki achi baat share karein.",
    "Ek dusray ke health aur neend ka khayal rakhein — poochte rahein 'theek ho?'",
    "Mushkil waqt mein partner ka sath dein, tanqeed se pehle sahara banein.",
    "Long-term goals (bachon ki tarbiyat, ghar, saving) par mil kar planning karein.",
    "Chhoti si mohabbat bhari harkat — hath pakadna, gale lagana — roz ki aadat banayein.",
    "Partner ke pasandeeda khane ya activity ka khayal rakh kar surprise dein.",
    "Ek dusray ki achievements ko celebrate karein, chahe wo kitni bhi choti ho.",
    "Sonay se pehle phone side rakh kar sirf 5 minute aankhon mein dekh kar baat karein.",
  ];
}
function marriageTipIndexOfDay() {
  const tips = marriageTips();
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86400000);
  return dayOfYear % tips.length;
}
let marriageTipOverrideIndex = null;
function renderMarriageTips() {
  const tips = marriageTips();
  const hi = document.getElementById("marriageTipHighlight");
  if (hi) {
    const idx = marriageTipOverrideIndex !== null ? marriageTipOverrideIndex : marriageTipIndexOfDay();
    hi.innerHTML = `<div class="ico">💞</div><div class="lbl">Aaj Ki Tip</div><div class="txt">${tips[idx]}</div>
      <button class="refresh-btn" onclick="shuffleMarriageTip()">🔄 Naya Tip Dekhein</button>`;
  }
  const el = document.getElementById("marriageTipsList");
  if (!el) return;
  el.innerHTML = tips.map(t => `<div class="list-row"><div class="l-main"><div class="l-ico">💞</div><div class="l-title" style="font-weight:600;">${t}</div></div></div>`).join("");
}
function shuffleMarriageTip() {
  const tips = marriageTips();
  if (tips.length <= 1) return;
  let idx;
  do { idx = Math.floor(Math.random() * tips.length); } while (idx === marriageTipOverrideIndex);
  marriageTipOverrideIndex = idx;
  renderMarriageTips();
}

// ============ SETTINGS ============
function renderSettings() {
  const p = state.profile;
  document.getElementById("setName").value = p.name || "";
  document.getElementById("setAge").value = p.age || "";
  document.getElementById("setGender").value = p.gender || "male";
  document.getElementById("setHeight").value = p.height || "";
  document.getElementById("setWeight").value = p.weight || "";
  document.getElementById("setTargetWeight").value = p.targetWeight || "";
  document.getElementById("setActivity").value = p.activityLevel || "moderate";
  document.getElementById("setWaterGoal").value = p.waterGoalMl || 2500;

  const r = state.settings.reminders;
  document.getElementById("notifToggle").checked = state.settings.notificationsEnabled;

  document.getElementById("remWaterToggle").checked = !!r.water;
  document.getElementById("remWaterIntervalHrs").value = String((r.waterIntervalMin || 60) / 60);
  document.getElementById("remWaterStart").value = r.waterStart || "08:00";
  document.getElementById("remWaterEnd").value = r.waterEnd || "22:00";

  renderDailyReminders();
  renderPrayerRows();
  document.getElementById("prayersToggle").checked = !!r.prayersEnabled;
  renderCustomReminders();
  renderBmi();
}

// ---- Daily (once-a-day) reminders: each with its own time + on/off ----
const DAILY_REMINDER_DEFS = [
  { key: "breakfast", ico: "🍳", cls: "ico-amber", label: "Breakfast" },
  { key: "lunch",     ico: "🍛", cls: "ico-amber", label: "Lunch" },
  { key: "dinner",    ico: "🍽️", cls: "ico-amber", label: "Dinner" },
  { key: "exercise",  ico: "🏃", cls: "ico-blue",  label: "Exercise / Walk" },
  { key: "sleep",     ico: "😴", cls: "ico-plum",  label: "Sleep" },
  { key: "mood",      ico: "🙂", cls: "ico-teal",  label: "Mood Check-in" },
  { key: "hairoil",   ico: "🧴", cls: "ico-coral", label: "Hair Oil" },
];
function renderDailyReminders() {
  const wrap = document.getElementById("dailyReminderRows");
  if (!wrap) return;
  const r = state.settings.reminders;
  wrap.innerHTML = DAILY_REMINDER_DEFS.map(d => `
    <div class="rem-row">
      <div class="rem-ico ${d.cls}">${d.ico}</div>
      <div class="rem-info"><div class="rem-label">${d.label}</div></div>
      <input class="rem-time" type="time" value="${r[d.key] || ''}"
        onchange="state.settings.reminders['${d.key}']=this.value;saveState();"/>
      <label class="switch"><input type="checkbox" ${r[d.key + 'Enabled'] ? 'checked' : ''}
        onchange="state.settings.reminders['${d.key}Enabled']=this.checked;saveState();"/></label>
    </div>`).join("");
}
function renderPrayerRows() {
  const r = state.settings.reminders;
  const wrap = document.getElementById("prayerRows");
  wrap.innerHTML = PRAYER_DEFAULTS.map(p => `
    <div class="field" style="margin-bottom:10px;">
      <label>${p.label}</label>
      <input type="time" value="${r.prayers[p.key] || p.time}" onchange="state.settings.reminders.prayers['${p.key}']=this.value;saveState();"/>
    </div>`).join("");
}
function renderCustomReminders() {
  const wrap = document.getElementById("customReminderList");
  const list = state.settings.reminders.custom || [];
  wrap.innerHTML = list.length ? list.map(c => `
    <div class="list-row">
      <div class="l-main"><div class="l-ico">⏰</div>
        <div><div class="l-title">${c.label}</div><div class="l-sub">${c.time}</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <label class="switch"><input type="checkbox" ${c.enabled ? "checked" : ""} onchange="toggleCustomReminder('${c.id}',this.checked)"/></label>
        <button class="btn ghost sm" onclick="removeCustomReminder('${c.id}')">✕</button>
      </div>
    </div>`).join("") : `<div class="empty">Koi custom reminder nahi hai</div>`;
}
function addCustomReminder() {
  const label = document.getElementById("customRemLabel").value.trim();
  const time = document.getElementById("customRemTime").value;
  if (!label || !time) return toast("Naam aur waqt dono zaroori hain");
  state.settings.reminders.custom.push({ id: uid(), label, time, enabled: true });
  document.getElementById("customRemLabel").value = "";
  saveState(); renderCustomReminders(); toast("Reminder add ho gaya ✓");
}
function toggleCustomReminder(id, val) {
  const c = state.settings.reminders.custom.find(x => x.id === id);
  if (c) { c.enabled = val; saveState(); }
}
function removeCustomReminder(id) {
  state.settings.reminders.custom = state.settings.reminders.custom.filter(x => x.id !== id);
  saveState(); renderCustomReminders();
}
function renderBmi() {
  const p = state.profile;
  const el = document.getElementById("bmiResult");
  if (p.height && p.weight) {
    const h = p.height / 100;
    const bmi = p.weight / (h * h);
    let cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
    el.textContent = `BMI: ${bmi.toFixed(1)} (${cat})`;
  } else {
    el.textContent = "";
  }
}
function saveProfile() {
  const p = state.profile;
  p.name = document.getElementById("setName").value;
  p.age = +document.getElementById("setAge").value || null;
  p.gender = document.getElementById("setGender").value;
  p.height = +document.getElementById("setHeight").value || null;
  p.weight = +document.getElementById("setWeight").value || null;
  p.targetWeight = +document.getElementById("setTargetWeight").value || null;
  p.activityLevel = document.getElementById("setActivity").value;
  p.waterGoalMl = +document.getElementById("setWaterGoal").value || 2500;

  if (p.height && p.weight && p.age) {
    const bmr = p.gender === "male"
      ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
      : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
    const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryactive: 1.9 };
    p.calorieGoal = Math.round(bmr * (factors[p.activityLevel] || 1.5));
  }
  p.onboarded = true;
  saveState(); renderBmi(); toast("Profile save ho gaya ✓");
}
function saveReminders() {
  const r = state.settings.reminders;
  r.water = document.getElementById("remWaterToggle").checked;
  r.waterIntervalMin = Math.round(parseFloat(document.getElementById("remWaterIntervalHrs").value) * 60);
  r.waterStart = document.getElementById("remWaterStart").value || "08:00";
  r.waterEnd = document.getElementById("remWaterEnd").value || "22:00";
  r.prayersEnabled = document.getElementById("prayersToggle").checked;
  saveState(); toast("Reminders save ho gaye ✓");
}
async function toggleNotifications(checked) {
  if (checked) {
    if (!("Notification" in window)) { toast("Is browser mein notifications support nahi hain"); return; }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { toast("Notification permission allow karein"); document.getElementById("notifToggle").checked = false; return; }
  }
  state.settings.notificationsEnabled = checked;
  saveState();
}
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `sehat-backup-${todayKey()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast("Backup file download ho gayi ✓");
}
function triggerImport() { document.getElementById("importFileInput").click(); }
function importData(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || typeof parsed !== "object" || !parsed.profile) throw new Error("invalid");
      if (!confirm("Ye maujooda data ko is file ke data se replace kar dega. Confirm karein?")) return;
      state = mergeWithDefaults(parsed);
      saveState();
      toast("Data import ho gaya ✓");
      showView("view-dashboard");
      renderMarriageTips();
    } catch (err) {
      toast("Ye valid Sehat backup file nahi hai");
    } finally {
      input.value = "";
    }
  };
  reader.readAsText(file);
}
function resetAllData() {
  if (!confirm("Sara data delete ho jayega. Confirm karein?")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = defaultState();
  toast("Data reset ho gaya");
  showView("view-dashboard");
}

// ============ PDF REPORT ============
function generatePdfReport() {
  if (!window.jspdf) { toast("PDF library load nahi hui, internet check karein"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const p = state.profile;
  const margin = 14;
  let y = 18;

  doc.setFontSize(18); doc.setTextColor(20, 99, 86);
  doc.text("Sehat — Health Report", margin, y); y += 8;
  doc.setFontSize(10); doc.setTextColor(90, 90, 90);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y); y += 10;

  doc.setFontSize(12); doc.setTextColor(20, 20, 20);
  doc.text(`Name: ${p.name || "-"}   Age: ${p.age || "-"}   Gender: ${p.gender || "-"}`, margin, y); y += 6;
  doc.text(`Height: ${p.height || "-"} cm   Weight: ${p.weight || "-"} kg   Target: ${p.targetWeight || "-"} kg`, margin, y); y += 6;
  const bmi = (p.height && p.weight) ? (p.weight / ((p.height / 100) ** 2)).toFixed(1) : "-";
  doc.text(`BMI: ${bmi}   Daily Calorie Goal: ${p.calorieGoal || "-"} kcal   Water Goal: ${p.waterGoalMl || "-"} ml`, margin, y); y += 10;

  const days = 7;
  const rows = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = todayKey(d);
    rows.push([
      d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      sumTodayForDate(state.meals, "cal", k) || "-",
      (sumTodayForDate(state.water, "ml", k) || 0) + " ml",
      (state.sleep.find(s => s.date === k) || {}).hours || "-",
      formatBpForDate(k),
      (state.exercise.filter(e => e.date === k).reduce((s, e) => s + (e.duration || 0), 0)) || "-",
      (state.mood.find(m => m.date === k) || {}).mood || "-",
    ]);
  }
  doc.autoTable({
    startY: y,
    head: [["Date", "Calories", "Water", "Sleep(h)", "BP", "Exercise(min)", "Mood"]],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: [20, 99, 86] },
    styles: { fontSize: 9, cellPadding: 3 },
  });
  y = doc.lastAutoTable.finalY + 10;

  const grooming = Object.entries(state.grooming || {}).map(([key, g]) => {
    const def = GROOMING_DEFAULTS.find(d => d.key === key);
    return [def ? def.label : key, g.lastDone ? new Date(g.lastDone).toLocaleDateString("en-GB") : "Never"];
  });
  if (y > 250) { doc.addPage(); y = 18; }
  doc.setFontSize(13); doc.setTextColor(20, 99, 86); doc.text("Grooming Status", margin, y); y += 4;
  doc.autoTable({ startY: y, head: [["Item", "Last Done"]], body: grooming, theme: "striped", headStyles: { fillColor: [232, 163, 61] }, styles: { fontSize: 9 } });
  y = doc.lastAutoTable.finalY + 10;

  const tips = generateTips(state);
  if (y > 240) { doc.addPage(); y = 18; }
  doc.setFontSize(13); doc.setTextColor(20, 99, 86); doc.text("Recommendations", margin, y); y += 6;
  doc.setFontSize(10); doc.setTextColor(30, 30, 30);
  tips.forEach(t => {
    const lines = doc.splitTextToSize("• " + t.text, 180);
    doc.text(lines, margin, y); y += lines.length * 5.5;
  });

  doc.save(`sehat-report-${todayKey()}.pdf`);
  toast("PDF report download ho gayi ✓");
}
function sumTodayForDate(arr, field, dateKey) {
  return arr.filter(x => x.date === dateKey).reduce((s, x) => s + (x[field] || 0), 0);
}
function formatBpForDate(dateKey) {
  const b = state.bp.find(x => x.date === dateKey);
  return b ? `${b.systolic}/${b.diastolic}` : "-";
}

// ============ ONBOARDING ============
function checkOnboarding() {
  if (!state.profile.onboarded) {
    document.getElementById("onboardOverlay").classList.add("open");
  }
}
function finishOnboarding() {
  const p = state.profile;
  p.name = document.getElementById("obName").value || "Dost";
  p.age = +document.getElementById("obAge").value || 25;
  p.gender = document.getElementById("obGender").value;
  p.height = +document.getElementById("obHeight").value || 170;
  p.weight = +document.getElementById("obWeight").value || 65;
  p.activityLevel = document.getElementById("obActivity").value;
  const bmr = p.gender === "male"
    ? 10 * p.weight + 6.25 * p.height - 5 * p.age + 5
    : 10 * p.weight + 6.25 * p.height - 5 * p.age - 161;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryactive: 1.9 };
  p.calorieGoal = Math.round(bmr * (factors[p.activityLevel] || 1.5));
  p.onboarded = true;
  saveState();
  document.getElementById("onboardOverlay").classList.remove("open");
  showView("view-dashboard");
}
function skipOnboarding() {
  state.profile.onboarded = true;
  saveState();
  document.getElementById("onboardOverlay").classList.remove("open");
  toast("Profile aap Settings mein kabhi bhi bana sakte hain");
  showView("view-dashboard");
}

// ============ REMINDER ENGINE ============
function toMinutes(hhmm) {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  return h * 60 + m;
}
function checkReminders() {
  if (!state.settings.notificationsEnabled) return;
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);
  const todayStr = todayKey();
  if (state.settings.firedToday.date !== todayStr) {
    state.settings.firedToday = { date: todayStr };
  }
  const r = state.settings.reminders;
  const checks = [];
  if (r.breakfastEnabled) checks.push(["breakfast", r.breakfast, "Nashta karne ka waqt ho gaya 🍳"]);
  if (r.lunchEnabled) checks.push(["lunch", r.lunch, "Lunch karne ka waqt ho gaya 🍛"]);
  if (r.dinnerEnabled) checks.push(["dinner", r.dinner, "Dinner karne ka waqt ho gaya 🍽️"]);
  if (r.sleepEnabled) checks.push(["sleep", r.sleep, "Sone ka waqt ho raha hai, phone rakh dein 😴"]);
  if (r.moodEnabled) checks.push(["mood", r.mood, "Aaj ka mood log karein 🙂"]);
  if (r.hairoilEnabled) checks.push(["hairoil", r.hairoil, "Hair oil lagane ka waqt ho gaya 🧴"]);
  if (r.exerciseEnabled) checks.push(["exercise", r.exercise, "Exercise/walk ka waqt ho gaya 🏃"]);
  if (r.water) {
    // Reminds every waterIntervalMin minutes (default 60 = 1 hour), adjustable, within start/end window
    const mins = now.getHours() * 60 + now.getMinutes();
    const interval = r.waterIntervalMin || 60;
    const startMin = toMinutes(r.waterStart || "08:00");
    const endMin = toMinutes(r.waterEnd || "22:00");
    if (mins >= startMin && mins <= endMin && (mins - startMin) % interval < 1) {
      checks.push([`water-${Math.floor((mins - startMin) / interval)}`, hhmm, "Pani peene ka waqt ho gaya 💧"]);
    }
  }
  if (r.prayersEnabled) {
    PRAYER_DEFAULTS.forEach(p => {
      checks.push([`prayer-${p.key}`, r.prayers[p.key], `${p.label} ka waqt ho gaya 🕌`]);
    });
  }
  (r.custom || []).forEach(c => {
    if (c.enabled) checks.push([`custom-${c.id}`, c.time, `${c.label} ⏰`]);
  });
  checks.forEach(([key, time, msg]) => {
    if (hhmm === time && !state.settings.firedToday[key]) {
      fireNotification("Sehat Reminder", msg);
      state.settings.firedToday[key] = true;
      saveState();
    }
  });
}
function fireNotification(title, body) {
  if (Notification.permission === "granted") {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => reg.showNotification(title, { body, icon: "icons/icon-192.png" }));
    } else {
      new Notification(title, { body, icon: "icons/icon-192.png" });
    }
  }
  toast(body);
}
setInterval(checkReminders, 30000);

// ============ INIT ============
window.addEventListener("DOMContentLoaded", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
  showView("view-dashboard");
  checkOnboarding();
  renderMarriageTips();

  // Handle app-shortcut deep links (e.g. Home Screen long-press -> Log Water)
  const params = new URLSearchParams(location.search);
  const open = params.get("open");
  if (open === "water" || open === "meal") {
    setTimeout(() => openTrackForm(open), 300);
  }
});
