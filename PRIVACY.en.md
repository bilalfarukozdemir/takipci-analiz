# Privacy Policy

**Effective date: 2026-09-24**

This document is prepared for publishing Follower Analyzer (Turkish name:
Takipçi Analiz) on Google Play.
[Türkçe sürüm](PRIVACY.md).

Short version: **no app server or account.** Android builds configured for ads
may show a banner on the History tab and full-screen ads after a successful
analysis or when opening a specific list; a one-time purchase removes all ads. There is
no separate usage-analytics service. The app is
an independent project, not affiliated with Instagram, Meta Platforms Inc.,
or any of its subsidiaries.

## What data is processed

The app gets your follower/following list one of two ways:

1. **Data export** — you select the `.zip`/`.json`/`.html` file produced by
   Instagram's own "Download your information" feature
   (`src/lib/importer.ts`, `src/lib/parse.ts`).
2. **Live fetch** — see the section below.

Data processed: username, display name, and (in live fetch) the profile
picture URL. The derived list categories (unfollowers, not-following-back,
etc.) are computed on the device.

The app does not request permissions such as **location, contacts, camera,
or microphone**. The only Android-specific entry defined in `app.json` and
`plugins/withInstagramQuery.js` is a package-visibility record (`<queries>`)
needed so an `instagram://` link can open in the Instagram app — this is not
a runtime permission the user is prompted to grant.

## Live fetch — the honest explanation

The live-fetch feature opens a WebView (an in-app browser component) on the
"Connect to Instagram" screen, and that WebView loads **Instagram's own
login page** directly (`https://www.instagram.com/accounts/login/`). You
type your password into Instagram's page; the app's code never accesses
that page's content, never sees, stores, or transmits the password
(`src/screens/Connect.tsx`, `src/lib/igLive.ts`).

After login, a JavaScript script runs **inside** the page
(`src/lib/igLive.ts`). This script:

- Calls the same endpoints Instagram's own web interface uses:
  `GET /api/v1/users/{uid}/info/`,
  `GET /api/v1/friendships/{uid}/followers/`,
  `GET /api/v1/friendships/{uid}/following/`.
- These requests are made with `credentials: 'include'` — i.e. **with your
  own session cookies** — and go **directly to Instagram's own servers**.
  There is no server in between (neither the developer's nor any other
  third party's), because no such server exists.
- The cookies (`ds_user_id`, `csrftoken`) are read only inside this script,
  within the WebView's own context; they never leave the script, never
  reach the React side, and never leave the device. What crosses over to
  the React side via `postMessage` is only the parsed user list
  (`{username, display name, profile picture URL}`) and progress
  information — never raw cookies or session data.
- The session cookie itself stays in the browser engine's own cookie store
  (the Android system WebView); the app's own code (`src/lib/storage.ts`)
  never reads or saves it.

This method uses the endpoints Instagram's own web interface calls, not a
formally documented developer API. Frequent use can lead to a temporary
action block on the account; the app shows an explicit warning about this
before fetching. Users who want zero risk can use the data-export method
instead.

## Where data is stored

- Snapshots (follower/following lists), the hidden-account list, and
  settings are stored **on the device**, using `expo-sqlite/kv-store` (a
  local SQLite-backed store) (`src/lib/storage.ts`).
- Profile pictures are downloaded to the device's file system and kept
  there, since Instagram's signed image URLs expire within days
  (`src/lib/avatars.ts`).
- Follower lists, analysis results, and app records are not uploaded to the
  developer's server or shared with the developer. Android system backup is
  enabled; depending on the device's backup settings, eligible app data may be
  backed up to the user's Google account. The developer cannot access those
  backups. Google Mobile Ads data is described separately below.

## Google ads and ad privacy

An Android build configured with real AdMob IDs can show banner ads on the
History tab and full-screen ads after a successful analysis or when opening
the "Not following back" list through the Google Mobile Ads SDK. At least two
user interactions occur between full-screen ads. Development builds use
Google's test ads. For ad serving, measurement, fraud prevention, and privacy choices,
the SDK may automatically collect or process IP address, ad-view/interaction
information, diagnostics, and identifiers such as the Android Advertising ID
or App Set ID. Google handles this data; the app does not pass follower lists,
Instagram session cookies, or analysis results to the ads SDK.

When Google's consent system requires it, the app shows the Google UMP consent
form before requesting an ad. The in-app **Ad privacy options** button opens
Google's additional preference form when available. See Google's
[Mobile Ads data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)
and [Privacy Policy](https://policies.google.com/privacy) for details.

The app has no separate usage-analytics or crash-reporting service. Google
Mobile Ads is the only ad network used in the app.

## No account required

The app does not run its own account system and does not ask for an email
address or credentials. The only "login" used for live fetch is the
Instagram account you already have.

## Removing ads (Google Play Billing)

The one-time, non-consumable `remove_ads` Play purchase removes the app's
banner and full-screen ads. The app checks ownership through Google Play
Billing; if that status cannot be confirmed, ads remain hidden. Payment
details do not reach the app.

## Deleting your data

- The **"Delete all data"** option on the History tab removes all
  snapshots, the hidden-account list, and the profile-picture cache from
  the device (`wipe()` in `App.tsx`, calling `clearEverything()` and
  `clearAvatarCache()`).
- Uninstalling the app has the same effect; all local data is removed by
  Android.
- Some settings, such as the language preference, are separate from this
  "delete all" action but are likewise device-only and non-personal.

## Contact

For questions, bug reports, or concerns about this policy:
[GitHub Issues](https://github.com/bilalfarukozdemir/takipci-analiz/issues).

## Changes

When this policy changes, this file is updated and the effective date above
is revised. See [CHANGELOG.md](CHANGELOG.md) for notable app changes.
