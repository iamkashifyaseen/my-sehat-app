# Sehat — AI-Styled Personal Health Companion App

An installable **PWA (Progressive Web App)** with a modern, futuristic health-tech UI —
dark glass cards, neon accents, and rounded icon tiles. No account needed. All your data
is stored **only on your own phone** (browser local storage) — nothing is sent to any
server.

---

## How to Install on Your Phone (Android) — as a PWA

1. Host the folder somewhere public (GitHub Pages, Netlify Drop, etc — see below).
2. Open the link in Chrome on your phone.
3. Tap the Chrome menu (⋮) → **"Add to Home screen" / "Install app"**.
4. The app now sits on your home screen with its own icon, works offline, and can send
   reminder notifications.

### Option 1 — GitHub Pages (free, ~10 minutes)
1. Create a GitHub account if you don't have one.
2. Create a new **Public** repository (e.g. `my-sehat-apps`).
3. Upload every file in this folder (`index.html`, `styles.css`, `app.js`, `data.js`,
   `manifest.json`, `sw.js`, the `icons/` folder, and the `screenshots/` folder).
4. Repository **Settings → Pages → Source: main branch** → Save.
5. You'll get a link like `https://yourusername.github.io/my-sehat-apps/`.

### Option 2 — Netlify Drop (no account needed)
1. On a computer, open `app.netlify.com/drop` and drag this folder in.
2. Open the generated link on your phone → "Add to Home screen".

---

## How to Build a Real .apk (via PWABuilder)

This project's `manifest.json` and icons are now set up to pass PWABuilder's checks
(the "Fix icon links / icon types / icon sizes / add screenshots / add a service worker"
action items from your report are all resolved here: a full icon set incl. maskable
icons, `screenshots`, and `sw.js` are included).

1. Deploy the folder to GitHub Pages / Netlify first (PWABuilder needs a public URL —
   it can't package local files).
2. Go to **pwabuilder.com**, paste your deployed URL, and click **Start**.
3. Once the report shows a healthy manifest score, click **Package for Stores → Android**.
4. PWABuilder (via Bubblewrap/TWA) generates a signed `.apk` / `.aab` you can download,
   side-load, or submit to the Play Store.
5. If any action item still shows up after redeploying, it usually means the old cached
   version is being scanned — hard-refresh / re-run the report.

---

## What's New in This Version

- **Complete visual redesign** — dark, futuristic AI-health theme (glass cards, neon
  lime/teal accents, rounded-radius icon backgrounds on every button), a day-strip and
  quick stat cards on the Home screen, and a floating glass bottom nav.
- **Water reminder** — fires automatically every **X hours (adjustable, default 1 hour)**
  within a start/end time window you set, with its own dedicated **ON/OFF switch**.
- **Every reminder now has its own ON/OFF switch** (breakfast, lunch, dinner, exercise,
  sleep, mood, hair oil) next to its adjustable time, plus prayer times and unlimited
  custom reminders — all independently toggleable.
- **PWA/APK packaging fixed** — full icon set (72–512px incl. maskable, safe-zone padded),
  `screenshots` array, app `shortcuts`, and richer manifest metadata so PWABuilder can
  package this into a real `.apk`.
- Home screen shows every tracker as a tappable rounded-icon card with today's value.
- Custom meals, prayer time reminders, exercise reminder, unlimited custom reminders.
- Onboarding is optional — skip and fill your profile later from Settings.
- Marital Intimacy Log inside the PIN-protected Private space.
- Import / Export — full JSON backup and restore.
- PDF report export with a 7-day summary table and recommendations.

## Features

- Personal profile + auto BMI/calorie calculation (optional at first launch)
- Pakistani food database + your own custom foods, meal & calorie tracking
- Water intake tracking with an adjustable repeating reminder + ON/OFF switch
- Blood pressure & heart health tracking
- Exercise, walking, deep-breathing sessions
- Sleep tracking, daily mood check-in + monthly mood report
- Guided meditation timer
- Grooming reminders: nails, haircut, hair oil, shoe polish, hair removal
- Screen time: automatic in-app usage + manual whole-phone entry
- Private, PIN-locked wellness log incl. a marital intimacy log + marriage tips
- 5 daily prayer reminders (adjustable) + exercise reminder + unlimited custom reminders,
  every single reminder independently switchable ON/OFF
- Daily/weekly/monthly/yearly reports with charts, plus downloadable PDF report
- Personalized daily/weekly health recommendations
- Full JSON backup (Export) and restore (Import)

## Notification Reliability

Turn on Notifications in Settings and allow the browser permission when asked. PWA
notifications fire reliably while the app has been opened/used recently; for guaranteed
exact-to-the-second background alarms even when the app hasn't been opened in days, a
compiled native app (via the PWABuilder `.apk` above, or a native Kotlin/Flutter app) is
the most reliable long-term option.

## Backup, Restore & Moving to a New Phone

Local storage is tied to this specific phone/browser, so **before switching phones or
reinstalling**, go to **Settings → Data → Export** to save a `.json` backup file.
On the new phone/reinstall, go to **Settings → Data → Import** and pick that same file.
