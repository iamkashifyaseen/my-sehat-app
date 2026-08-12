// ---------- Pakistani Food Database ----------
// calories/protein(g)/carbs(g)/fat(g) are approximate, per the given typical serving
const FOOD_DB = [
  { name: "Roti (wheat)", serving: "1 piece", cal: 120, p: 3, c: 24, f: 1 },
  { name: "Naan", serving: "1 piece", cal: 260, p: 7, c: 45, f: 5 },
  { name: "Paratha (plain)", serving: "1 piece", cal: 260, p: 5, c: 30, f: 13 },
  { name: "Aloo Paratha", serving: "1 piece", cal: 320, p: 6, c: 40, f: 15 },
  { name: "White Rice (boiled)", serving: "1 cup", cal: 205, p: 4, c: 45, f: 0.5 },
  { name: "Chicken Biryani", serving: "1 plate", cal: 450, p: 22, c: 55, f: 15 },
  { name: "Mutton Biryani", serving: "1 plate", cal: 520, p: 24, c: 55, f: 22 },
  { name: "Chicken Karahi", serving: "1 serving", cal: 400, p: 30, c: 8, f: 27 },
  { name: "Mutton Karahi", serving: "1 serving", cal: 480, p: 32, c: 8, f: 35 },
  { name: "Daal Chawal (lentils+rice)", serving: "1 plate", cal: 350, p: 12, c: 60, f: 6 },
  { name: "Chana Masala", serving: "1 cup", cal: 280, p: 12, c: 40, f: 8 },
  { name: "Aloo Gosht", serving: "1 serving", cal: 380, p: 22, c: 20, f: 22 },
  { name: "Nihari", serving: "1 bowl", cal: 450, p: 26, c: 15, f: 30 },
  { name: "Haleem", serving: "1 bowl", cal: 380, p: 20, c: 35, f: 16 },
  { name: "Seekh Kebab", serving: "1 piece", cal: 150, p: 12, c: 2, f: 10 },
  { name: "Chicken Tikka", serving: "1 piece", cal: 180, p: 22, c: 2, f: 9 },
  { name: "Shami Kebab", serving: "1 piece", cal: 120, p: 8, c: 6, f: 7 },
  { name: "Samosa", serving: "1 piece", cal: 130, p: 3, c: 15, f: 7 },
  { name: "Pakora (mixed veg)", serving: "4 pieces", cal: 220, p: 5, c: 20, f: 14 },
  { name: "Chaat (aloo/chana)", serving: "1 bowl", cal: 250, p: 6, c: 40, f: 8 },
  { name: "Fruit Chaat", serving: "1 bowl", cal: 150, p: 2, c: 35, f: 0.5 },
  { name: "Lassi (sweet)", serving: "1 glass", cal: 260, p: 8, c: 35, f: 9 },
  { name: "Lassi (salted)", serving: "1 glass", cal: 120, p: 6, c: 10, f: 6 },
  { name: "Chai (with milk & sugar)", serving: "1 cup", cal: 90, p: 2, c: 12, f: 3 },
  { name: "Doodh Patti Chai", serving: "1 cup", cal: 130, p: 4, c: 14, f: 6 },
  { name: "Halwa Puri (full)", serving: "1 plate", cal: 650, p: 10, c: 70, f: 35 },
  { name: "Jalebi", serving: "2 pieces", cal: 220, p: 2, c: 40, f: 6 },
  { name: "Gulab Jamun", serving: "2 pieces", cal: 300, p: 4, c: 45, f: 12 },
  { name: "Kheer", serving: "1 bowl", cal: 240, p: 6, c: 35, f: 8 },
  { name: "Sugarcane Juice", serving: "1 glass", cal: 180, p: 0, c: 45, f: 0 },
  { name: "Palak Paneer", serving: "1 serving", cal: 280, p: 12, c: 12, f: 20 },
  { name: "Keema (mince curry)", serving: "1 serving", cal: 350, p: 24, c: 8, f: 24 },
  { name: "Fish Fry", serving: "1 piece", cal: 220, p: 20, c: 8, f: 13 },
  { name: "Boiled Egg", serving: "1 piece", cal: 78, p: 6, c: 0.5, f: 5 },
  { name: "Omelette (2 eggs)", serving: "1 serving", cal: 190, p: 13, c: 2, f: 15 },
  { name: "Yogurt (plain)", serving: "1 cup", cal: 150, p: 8, c: 11, f: 8 },
  { name: "Banana", serving: "1 medium", cal: 105, p: 1, c: 27, f: 0.3 },
  { name: "Apple", serving: "1 medium", cal: 95, p: 0.5, c: 25, f: 0.3 },
  { name: "Mango", serving: "1 cup sliced", cal: 100, p: 1, c: 25, f: 0.5 },
  { name: "Almonds", serving: "10 pieces", cal: 70, p: 3, c: 2, f: 6 },
  { name: "Chapli Kebab", serving: "1 piece", cal: 260, p: 16, c: 6, f: 19 },
];

// ---------- Default prayer times (adjust in Settings for your city/madhab) ----------
const PRAYER_DEFAULTS = [
  { key: "fajr", label: "Fajr", time: "05:15" },
  { key: "zuhr", label: "Zuhr", time: "13:15" },
  { key: "asr", label: "Asr", time: "16:45" },
  { key: "maghrib", label: "Maghrib", time: "18:30" },
  { key: "isha", label: "Isha", time: "20:00" },
];

// ---------- Weekly/monthly healthy-range guidance (general population guidelines,
// not medical advice — always used as ranges, never as a diagnosis) ----------
function getWeeklyTargets(profile) {
  const age = profile.age || 30;
  let sleepRange = "7–9 hours/night";
  if (age < 18) sleepRange = "8–10 hours/night";
  else if (age >= 65) sleepRange = "7–8 hours/night";

  let exerciseMin = 150; // WHO general adult guideline: moderate activity/week
  if (age >= 65) exerciseMin = 150; // still recommended, lower intensity + balance work
  if (age < 18) exerciseMin = 420; // ~60 min/day for children/teens

  return {
    sleepRange,
    exerciseMinPerWeek: exerciseMin,
    exerciseDaysPerWeek: age < 18 ? 7 : 5,
    waterMlPerDay: profile.waterGoalMl || 2500,
    stepsPerDay: age >= 65 ? 6000 : 8000,
    screenRecreationalHours: age < 18 ? 2 : null,
  };
}

// ---------- Grooming reminder defaults ----------
const GROOMING_DEFAULTS = [
  { key: "nails", label: "Nail Cutting", icon: "✂️", frequencyDays: 7 },
  { key: "haircut", label: "Hair Cutting", icon: "💇", frequencyDays: 21 },
  { key: "hairoil", label: "Hair Oil", icon: "🧴", frequencyDays: 1 },
  { key: "shoepolish", label: "Shoe Polish", icon: "👞", frequencyDays: 7 },
  { key: "hairremoval", label: "Hair Removal", icon: "🪒", frequencyDays: 14 },
];

// ---------- Rule based recommendation engine ----------
function generateTips(state) {
  const tips = [];
  const today = todayKey();

  const waterToday = sumToday(state.water, "ml");
  const waterGoal = state.profile.waterGoalMl || 2500;
  if (waterToday < waterGoal * 0.5) {
    tips.push({ type: "water", text: "Aaj aap ne bohat kam pani piya hai — abhi 1-2 glass pani piyein." });
  }

  const calToday = sumToday(state.meals, "cal");
  const calGoal = state.profile.calorieGoal || 2000;
  if (calToday > calGoal * 1.15) {
    tips.push({ type: "meal", text: "Aaj calorie intake goal se zyada ho gaya hai — kal halka khana rakhein." });
  } else if (calToday === 0 && new Date().getHours() > 14) {
    tips.push({ type: "meal", text: "Aaj tak koi meal log nahi hui — khana time par lena health ke liye zaroori hai." });
  }

  const lastSleep = state.sleep[state.sleep.length - 1];
  if (lastSleep && lastSleep.hours < 6) {
    tips.push({ type: "sleep", text: "Neend kam ho rahi hai — aaj koshish karein 10-11 baje tak so jayein." });
  }

  const lastBp = state.bp[state.bp.length - 1];
  if (lastBp && (lastBp.systolic > 140 || lastBp.diastolic > 90)) {
    tips.push({ type: "bp", text: "Aapka last BP reading high range mein hai — namak kam karein aur doctor se mashwara karein." });
  }
  if (lastBp && (lastBp.systolic < 90 || lastBp.diastolic < 60)) {
    tips.push({ type: "bp", text: "Aapka BP low range mein hai — pani aur namak ka khayal rakhein, agar chakkar aayein to doctor dikhayein." });
  }

  const stepsToday = sumToday(state.exercise, "steps");
  if (stepsToday < 3000 && new Date().getHours() > 17) {
    tips.push({ type: "exercise", text: "Aaj walk kam hui hai — dinner ke baad 15-20 min walk kar lein." });
  }

  const screenToday = (state.screenTime.find((s) => s.date === today) || {}).minutes;
  if (screenToday && screenToday > 360) {
    tips.push({ type: "screen", text: `Aaj screen time ${(screenToday/60).toFixed(1)} ghante ho chuka hai — ye kaafi zyada hai, thora break lein aur phone door rakhein.` });
  } else if (screenToday && screenToday > 240) {
    tips.push({ type: "screen", text: "Aaj screen time 4 ghante se zyada ho gaya — aankhon aur neend ke liye break lena behtar hai." });
  }

  const targets = getWeeklyTargets(state.profile);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const exerciseDaysThisWeek = new Set(state.exercise.filter(e => new Date(e.date) >= weekStart).map(e => e.date)).size;
  if (new Date().getDay() >= 4 && exerciseDaysThisWeek < targets.exerciseDaysPerWeek - 2) {
    tips.push({ type: "exercise", text: `Is hafte sirf ${exerciseDaysThisWeek} din exercise hui hai — healthy range ke liye hafte mein ${targets.exerciseDaysPerWeek} din, total ${targets.exerciseMinPerWeek} minutes ka target rakhein.` });
  }

  Object.entries(state.grooming || {}).forEach(([key, g]) => {
    const def = GROOMING_DEFAULTS.find((d) => d.key === key);
    if (!def) return;
    const last = g.lastDone ? new Date(g.lastDone) : null;
    const daysSince = last ? (Date.now() - last.getTime()) / 86400000 : 999;
    if (daysSince >= def.frequencyDays) {
      tips.push({ type: "grooming", text: `${def.label} ka waqt ho gaya hai (${Math.floor(daysSince)} din ho gaye).` });
    }
  });

  if (tips.length === 0) {
    tips.push({ type: "good", text: "Sab kuch achi tarah track ho raha hai — is routine ko barqarar rakhein! 🌿" });
  }
  return tips;
}

function sumToday(arr, field) {
  const t = todayKey();
  return arr.filter((x) => x.date === t).reduce((s, x) => s + (x[field] || 0), 0);
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
