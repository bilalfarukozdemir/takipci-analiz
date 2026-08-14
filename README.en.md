<div align="center">

<img src="assets/icon.png" alt="Takipçi Analiz" width="120" />

# Takipçi Analiz

**An Android app that shows who unfollowed you on Instagram and who doesn't follow you back.**
No server, no account, no ads — everything stays on your phone.

[![CI](https://github.com/bilalfarukozdemir/takipci-analiz/actions/workflows/ci.yml/badge.svg)](https://github.com/bilalfarukozdemir/takipci-analiz/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/bilalfarukozdemir/takipci-analiz)](https://github.com/bilalfarukozdemir/takipci-analiz/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%207.0%2B-3ddc84)](https://github.com/bilalfarukozdemir/takipci-analiz/releases/latest)

[**⬇️ Download APK**](https://github.com/bilalfarukozdemir/takipci-analiz/releases/latest) ·
[Türkçe](README.md) ·
[Contributing](CONTRIBUTING.md)

</div>

> The app's interface is in **Turkish**. This document is for developers who want to
> read or contribute to the code.

---

## What it does

Fourteen lists derived from your follower graph: **unfollowers**, **not following
back**, **fans** (they follow you, you don't follow back), **new followers**,
**mutuals**, pending requests you sent, requests you received, accounts you
stopped/started following, close friends, blocked accounts, and the full
follower/following lists.

Every list supports search (username + display name), sorting (A→Z, Z→A, newest,
oldest), copy username on long press, share the list as `.txt`, open the profile in
Instagram on tap, and a ✓ mark to hide accounts you've already handled.

The History tab lets you pick **any two snapshots** to compare.

## Two data sources

|  | ⚡ Live fetch | 📂 Data export |
| --- | --- | --- |
| Speed | a few minutes | wait for Instagram to prepare the file |
| Instagram ToS | **violates** | complies |
| Account risk | temporary action block if overused | none |
| Display name | ✅ | ❌ |
| Profile picture | ✅ | ❌ |
| "Following since" date | ❌ | ✅ |

Both feed the same analysis engine and accumulate into one history.

### Live fetch

The app opens **Instagram's own login page** in a WebView. The password is never
entered into the app, never stored, never transmitted anywhere. After login, an
injected script runs *inside* the Instagram page and calls the endpoints the web
UI itself uses, with the user's own session:

```
GET /api/v1/users/{uid}/info/
GET /api/v1/friendships/{uid}/followers/?count=50&max_id=…
GET /api/v1/friendships/{uid}/following/?count=50&max_id=…
```

Cookies never leave the WebView. Requests are spaced by a random **1.2–2.3 s**
(plus an extra **3–5.5 s** every 8 pages) to reduce the chance of triggering
Instagram's automation detection. `401/403` is handled as a lost session, `429` as
a rate limit, and a 75 s stall as a timeout.

> [!WARNING]
> Live fetch violates Instagram's Terms of Service. Frequent use can get your
> account temporarily action-blocked (usually cleared within hours). Use it at most
> once a day, or stick to the data-export path if you want zero risk.

Bulk unfollowing is **deliberately not implemented** — it is the fastest way to get
an account blocked.

### Data export

Instagram → Settings → Accounts Center → *Your information and permissions* →
*Download your information* → select **only** "Followers and following", format
**JSON**, range *All time*. Selecting only that subset usually takes minutes rather
than days.

Supported formats: modern JSON (including multi-part `followers_1.json`,
`followers_2.json`…), the HTML export, and the pre-2020 `connections.json`. You can
also unzip and pick the individual JSON files.

## Why unfollowers only appear after the second fetch

Instagram does not expose "who unfollowed you" anywhere — not in the export, not in
the UI. The only way to derive it is to diff two follower lists taken at different
times. The first fetch is your baseline.

## Profile pictures

Instagram's image URLs are signed and expire within days, so storing the URL is not
enough. A picture is downloaded to the device the first time its row becomes
visible and kept permanently — it then works offline and never disappears from old
snapshots. Only what you actually scroll past is downloaded (max 4 concurrent,
most-recently-visible first). Roughly 8 MB per 1000 accounts; can be disabled or
cleared from the History tab.

## Development

```bash
git clone https://github.com/bilalfarukozdemir/takipci-analiz.git
cd takipci-analiz
npm install
npm start
```

Requires Node 20+, JDK 17, Android SDK (API 36 / build-tools 36.x).

| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run android` | Development build on device/emulator |
| `npm run typecheck` | TypeScript check |
| `npm test` | Archive parser tests (33 assertions) |
| `npm run apk` | Signed release APK |

### Building the APK on Windows

`npm run apk` runs [`scripts/build-apk.ps1`](scripts/build-apk.ps1), which mirrors
the source to a short path (`C:\rnb\takipci` by default, override with
`TAKIPCI_BUILD_DIR`) before building. This works around the Android NDK's CMake/ninja
failing on long paths or paths containing spaces
(`ninja: error: manifest 'build.ninja' still dirty after 100 tries`). The APK is
copied back to the project root.

Signing is configured through `credentials/` — see
[`credentials/README.md`](credentials/README.md). Without it the build still works,
using Android's debug key.

## Architecture

```
App.tsx                  root component: tabs, routing, import flow
src/lib/parse.ts         data-export parser (zip / json / html / legacy)
src/lib/analyze.ts       set operations + the 14 category definitions
src/lib/igLive.ts        script injected into the WebView for live fetching
src/lib/avatars.ts       profile-picture cache (lazy download + disk)
src/lib/storage.ts       snapshots & settings (expo-sqlite/kv-store)
src/screens/             Home, ListScreen, Connect, History, Help
src/ui/                  shared components
plugins/                 Expo prebuild config plugins
scripts/build-apk.ps1    short-path build wrapper
tests/parse.test.js      parser tests
```

Both sources converge on the same pipeline:
`parse.ts` / `igLive.ts` → `SnapshotData` → `storage.ts` → `analyze.ts` → screens.

## Stack

Expo SDK 56 · React Native 0.85 · React 19 · TypeScript ·
`fflate` (zip) · `react-native-webview` · `expo-sqlite/kv-store` ·
`expo-file-system` · `expo-document-picker`

## Disclaimer

This project is **not affiliated with** Instagram, Meta Platforms Inc., or any of
its subsidiaries. "Instagram" is a trademark of Meta Platforms Inc.

The app is written for personal use. The live-fetch feature violates Instagram's
Terms of Service; the user is responsible for the consequences of using it. The
software is provided under the MIT license **without any warranty**.

## License

[MIT](LICENSE) © 2026 Bilal Faruk Özdemir

---

<div align="center">

Made by [**vitrincim.com**](https://vitrincim.com)

</div>
