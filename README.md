# Mindspace

Local-first personal growth app (tasks, time tracking, wellbeing, reports). All data stays on your phone. Works offline once installed.

Files: `index.html`, `style.css`, `app.js`, `manifest.webmanifest`, `sw.js`, and three PNG icons.

## Put it on GitHub Pages (from your phone)

1. In your phone browser, open github.com, sign in, tap **+** then **New repository**. Name it `mindspace`, set it **Public**, tap **Create repository**.
2. On the empty repo page tap **uploading an existing file** (or **Add file** then **Upload files**). Choose all 8 files from the `mindspace` folder, including the 3 PNG icons. Tap **Commit changes**.
   - If you would rather paste text: **Add file** then **Create new file**, type the file name, paste the content, commit. Do this for the 5 text files. The PNG icons must be uploaded, not pasted.
3. Open **Settings** then **Pages**. Under **Branch** choose `main` and folder `/ (root)`, tap **Save**.
4. Wait 1 to 2 minutes. Your app is at `https://YOUR-USERNAME.github.io/mindspace/`.
5. Open that link in Chrome on your Android phone, tap the three dots menu, then **Install app** (or **Add to Home screen**).

## Updating later

Edit a file on GitHub (pencil icon), commit, and change `CACHE = 'mindspace-v1'` in `sw.js` to `mindspace-v2` so installed phones pick up the new version.

## Your data

Data is stored in the browser storage of that exact address. Use **Export data** in Reports before changing the address, clearing browser data, or uninstalling.
