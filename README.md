# Easy JWT

JWT secret generator + JWT decoder/verifier. Plain HTML/CSS/JS. Needs only Node, no npm packages.

## Run locally
```bash
npm start          # → http://localhost:3000
```
`config.js` is rebuilt from `.env` every time you refresh the page.

## Your contact details (About page icons)
Edit `.env`:
```
PHONE=+919876543210
WHATSAPP=919876543210      # country code + number, digits only
INSTAGRAM=your_username     # @name or a full instagram.com link also works
EMAIL=you@example.com
```
If a value is empty, clicking that icon just shows a "coming soon" message.
These values end up on the public site (that's what contact links are for), so put only public info in `.env`.

## Deploy
```bash
npm run build      # → dist/  (upload this folder to any static host)
```
Netlify and Vercel are already set up (`netlify.toml`, `vercel.json`). Add PHONE, WHATSAPP,
INSTAGRAM and EMAIL as environment variables in the dashboard. They override `.env`, which git ignores.

## Files
- index.html: markup, with the design's title lettering embedded as vector paths
- styles.css: layout built on the Figma 1920x1400 frame, plus all animations
- app.js: key generation (unbiased, using crypto.getRandomValues), show/hide, decoder, HS256/384/512 verification, effects
- scripts/: env.js (.env → config.js), serve.js (dev server), build.js (dist/)
- assets/: self-hosted font subsets, illustration, icons
