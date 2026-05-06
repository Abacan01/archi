## Vercel deployment checklist

This file lists the exact steps to deploy this Next.js + Firebase site to Vercel.

1) Repo & Vercel setup
- Push your repo to GitHub (or use existing remote).
- In Vercel: Add New Project -> Import the repo.

2) Vercel build settings
- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: leave default (Vercel handles Next output)
- Node: 20+

3) Required environment variables (set in Vercel Project → Settings → Environment Variables)

Public (client SDK):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Server (Admin SDK):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

4) Firebase security rules
- Apply the rules in `firestore.rules` and `storage.rules`.
- Add the first admin user to `admins/{uid}` in Firestore.

5) Local verification (recommended before deploying)
```bash
# install exact deps
npm ci

# run a production build locally
npm run build

# (optional) run the built app
npm run start
```

6) After deploy
- Visit `/admin` and sign in.
- Click "Seed Defaults" to populate initial content.
- Verify public pages render Firestore content and uploaded images.

If you want, I can run `npm ci` and `npm run build` locally to verify the build - reply with `run build` to continue.
