# Thank-You Week

Sticky-note riddle cards whose QR code opens one portal. The password is the person's riddle answer, and it unlocks only their player profile.

- `index.html` – the portal everyone's QR opens
- `admin.html` – your editor (open `/admin` on the live site): ratings, GIFs, riddles, and **Print sticky notes**
- `data.json` – every profile, encrypted. Each profile can only be opened with its riddle answer; the full list only with the admin password. Safe to keep in a public repo.
- `lib.js`, `profile.css` – shared code and card styles

## Updating
1. Open `/admin`, unlock with the admin password, make changes.
2. Click **Publish changes**. Either download `data.json` and upload it to this repo on GitHub (Add file → Upload files → Commit), or add a GitHub token in Settings for one-click publishing.
3. Vercel redeploys automatically in about a minute.

## Hosting
Static site, no build step. On Vercel: Add New → Project → import this repo → Framework preset "Other" → Deploy.
