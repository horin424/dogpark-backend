# Firebase Setup — ここにいるワン MVP

This project uses **Firebase Auth (Anonymous) + Firestore + Cloud Storage**. The frontend is already wired; you only need to provision the project and paste keys into `.env.local`.

Estimated time: **10–15 minutes**.

---

## 1. Create the Firebase project

1. Open https://console.firebase.google.com → **Add project**.
2. Name it (e.g. `dogpark-mvp`). Disable Google Analytics (not needed for MVP).
3. Wait for "Your new project is ready" → **Continue**.

---

## 2. Register a Web App

1. From the project overview, click the **`</>`** (Web) icon to register an app.
2. Nickname it (e.g. `dogpark-web`). Do **NOT** enable Firebase Hosting yet.
3. After registration, Firebase shows a `firebaseConfig` block — keep this tab open, you'll copy values into `.env.local` in step 7.

---

## 3. Enable Anonymous Authentication

The app signs every visitor in anonymously so Firestore/Storage rules accept them. Account-ID + password login is layered on top in app code (passwords are SHA-256 hashed before being written to Firestore).

1. Left sidebar → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Anonymous** → toggle **Enable** → **Save**.

---

## 4. Create the Firestore database

1. Left sidebar → **Build → Firestore Database** → **Create database**.
2. Choose a region closest to your users (e.g. `asia-northeast1` for Japan).
3. Start in **production mode** (we'll paste rules in the next step).

### 4a. Paste security rules

**Rules** tab → replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // MVP: any signed-in client (incl. anonymous) can read/write.
    // Per project spec, granular permissions are intentionally out of scope.
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

### 4b. Composite indexes

Firestore auto-prompts to create indexes the first time a query that needs one runs (you'll see an error in the browser console with a one-click "Create index" link). The queries this app will trigger:

| Collection | Fields | Used by |
|---|---|---|
| `friendRequests` | `fromId` Asc, `status` Asc | `getFriendIds` |
| `friendRequests` | `toId` Asc, `status` Asc | `getFriendIds`, friend requests inbox |
| `notifications` | `userId` Asc, `createdAt` Desc | `/notifications` page |
| `notifications` | `userId` Asc, `isRead` Asc | unread badge |

Other queries (login by `accountIdLower`, friend-code uniqueness check during signup, `events` ordered by `createdAt`) are single-field — Firestore creates those indexes automatically with no setup required.

**Easiest workflow:** open the app, click around, and when you see `FirebaseError: The query requires an index` in DevTools, click the link in the message — it pre-fills the index form. Each takes ~1–2 min to build.

You can also pre-create them under **Indexes → Composite → Create**.

---

## 5. Create the Storage bucket

Used for dog profile photos.

1. Left sidebar → **Build → Storage** → **Get started**.
2. Use the default bucket name. Same region as Firestore.
3. Start in **production mode**.

### 5a. Storage rules

**Rules** tab → replace with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Photos under profiles/** are world-readable; only signed-in users may upload.
    match /profiles/{userId}/{file=**} {
      allow read;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Click **Publish**.

---

## 6. Install npm packages

In the project root:

```
npm install
```

This pulls `firebase` (already added to `package.json`).

---

## 7. Configure environment variables

Create a file named **`.env.local`** in the project root (same folder as `package.json`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey from step 2>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<authDomain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<projectId>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<storageBucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
NEXT_PUBLIC_FIREBASE_APP_ID=<appId>
```

Take these values from the `firebaseConfig` object Firebase showed in step 2. (If you closed that tab: **Project settings → General → Your apps → Web app → SDK setup and configuration**.)

`.env.local` is already in `.gitignore` and will not be committed.

---

## 8. Run the app

```
npm run dev
```

Open http://localhost:3000.

**On the first page load, the app auto-seeds demo data into Firestore:**

| ユーザー | アカウントID | パスワード | 友達コード (auto) |
|---|---|---|---|
| はなこ (モカ) | `hanako` | `demo1234` | `WOOF-1234` |
| けんた (レオ) | `kenta` | `demo5678` | `BARK-5678` |
| さくら (はな) | `sakura` | `demo9012` | `PAW-9012` |

Plus 3 sample plans for today and 2 accepted friend relationships. The seed runs once per project (it checks the `users/user-demo` doc for an `accountIdLower` field). If a project was seeded with the older PIN-only schema, opening the app re-runs the seed automatically to fill the new fields.

If you want to fully re-seed: delete the `users/user-demo` doc in the Firestore console, then reload.

---

## 9. Verify it works

1. Open `/login`, sign in as `hanako / demo1234`.
2. Home page should show today's plans from けんた / さくら.
3. Open a plan → send a chat message → confirm it appears in Firestore under `plans/{planId}/messages`.
4. Click "一緒に行く" on someone else's plan → check the `events` collection for new `plan_join` and `participants_changed` docs.
5. Open `/admin/events` → see the table populated with what you just did.
6. Open `/signup?invite=DOGPARK-MVP-001` → register a new test user → confirm the new user doc appears in `users` with an auto-generated `friendCode`.
7. Profile photo upload (`/me/edit`) → confirm the file appears in Storage under `profiles/{userId}/`.

---

## 9a. Invite tokens (test-user signup)

Self-registration is gated by invite codes. A code is valid if it appears in either:

1. **The built-in list** in `src/data/mockData.ts` — `INVITE_TOKENS`. Useful for the client's own bootstrap signup (`DOGPARK-OWNER-001`) and the seeded test codes (`DOGPARK-MVP-001` … `005`). Editing this list requires a redeploy.
2. **The Firestore `invites` collection** — one doc per code (doc ID = the code). Created and revoked from the in-app `/admin/invites` page; no redeploy needed.

### Client's first signup (owner bootstrap)

Visit `/signup?invite=DOGPARK-OWNER-001` once and register normally. The token isn't burned on use, so you can either leave it in place or remove it from `INVITE_TOKENS` after you have an account.

### Generating invite links (ongoing)

Open `/admin/invites`:

- Click **発行する** to create a new code (auto-generates `WAN-XXXXXX`, or supply your own).
- Click **リンクをコピー** on any row to copy `https://<your-domain>/signup?invite=CODE` to the clipboard.
- Click **無効化** to revoke a dynamic code; **復元** brings it back. Built-in codes (`組込`) cannot be revoked from the UI — edit `INVITE_TOKENS` instead.

Anyone visiting `/signup` without a valid token sees a "招待コードが無効です" message and the submit button stays disabled.

---

## 10. Deploy (optional)

Easiest path is **Vercel**:

1. Push the repo to GitHub.
2. Import on https://vercel.com/new.
3. In Vercel project settings → **Environment Variables**, add the same six `NEXT_PUBLIC_FIREBASE_*` keys.
4. Deploy.

Then in Firebase: **Authentication → Settings → Authorized domains** → add your Vercel domain (e.g. `dogpark-mvp.vercel.app`) so Anonymous Auth works in production.

---

## Notes & gotchas

- **Passwords are hashed** with `SHA-256(password + ":" + accountId_lowercased)` (see `src/lib/hash.ts`). You cannot edit a user's password directly in the Firestore console — re-create the user via `/signup` or compute the hash yourself. (The same helper used to hash the legacy 4-digit PIN; it was renamed conceptually but the code path is identical.)
- **Friend codes are auto-generated** at signup with a random `WOOF`/`BARK`/`PAW` prefix + 4 random digits, and uniqueness is verified against the `users` collection before write. Users no longer enter or remember a friend code to log in.
- **Invite tokens come from two places.** A static list in `src/data/mockData.ts` (`INVITE_TOKENS`) for the owner-bootstrap and seeded test codes, plus the dynamic `invites` Firestore collection managed via `/admin/invites`. Treat both as a low-effort allow-list, not a security boundary — anyone with a valid code can register, and codes don't burn on use.
- **`/admin/events` and `/admin/invites` are currently unguarded.** Any visitor with the URL can view events or mint invite codes. For an MVP this is usually fine; if you want it hidden, gate the routes on a hardcoded admin account ID or add an `?key=` token check.
- **Anonymous Auth UIDs are not the same as app user IDs.** The app stores its own user id (e.g. `user-demo`) in `localStorage` under `wan_currentUserId`. The Firebase anonymous UID exists only so Firestore/Storage rules can require `request.auth != null`.
- **Polling intervals**: notifications + unread badge refresh every 20–30s; plan-detail chat polls every 5s. Adjust in `src/components/Header.tsx`, `src/app/notifications/page.tsx`, and `src/app/plans/[planId]/page.tsx` if you want different cadence.
- **Parks data** is still static in `src/data/mockData.ts`. Per the MVP scope this stays in code; move to Firestore later if/when you want non-engineers to edit park metadata.
- **Events logging is fire-and-forget.** `logEvent()` swallows errors so a Firestore hiccup never breaks the user flow — if events are missing in `/admin/events`, check the browser console for `logEvent failed` warnings.
- **Quotas**: Firestore Spark (free) tier gives 50K reads / 20K writes / 1 GiB stored per day — comfortably above POC traffic. Anonymous Auth has no quota. Storage Spark gives 5 GB / 1 GB egress per day.

---

## Notifications — current and future

- **Current (MVP):** in-app notifications only. Records live in the `notifications` Firestore collection and surface via the `/notifications` page and the unread badge in `Header.tsx` (polled every 20–30s).
- **Future (post-MVP):** device-level push notifications via **Firebase Cloud Messaging (FCM)**, so users get pinged even when the app isn't open. High-level wiring when we pick this up:
  1. Enable **Cloud Messaging** in Firebase console → generate a Web Push (VAPID) key under **Project settings → Cloud Messaging**.
  2. Add a service worker (`public/firebase-messaging-sw.js`) and call `getToken(messaging, { vapidKey })` on the client after the user grants notification permission.
  3. Store the resulting FCM token per user (e.g. `users/{userId}.fcmTokens[]`) so a single user can be reached on multiple devices.
  4. Mirror every `addNotification()` write with a server-side push (Cloud Function trigger on `notifications/*` create, or a direct call to the FCM HTTP v1 API) so in-app and push stay in sync.
  5. iOS Safari needs the user to "Add to Home Screen" before web push works — call this out in onboarding when we ship.
- **Why deferred:** push requires a service worker, a Cloud Function (or other backend caller) for the FCM send step, and platform-specific UX (permission prompt timing, iOS PWA install gate). Out of scope for the current MVP per client direction; the in-app system is sufficient for now.
