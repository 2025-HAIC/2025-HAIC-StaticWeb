Dots and Boxes (dots-and-boxes)
===============================

Quick dev
---------

cd into the folder and run dev server:

```powershell
cd dots-and-boxes
npm ci
npm run dev
```

Deploy to GitHub Pages (local)
-----------------------------
This project is configured to build static files with Vite. There are two simple ways to publish to GitHub Pages without using Actions:

1) Use the `gh-pages` package (script included)

```powershell
cd dots-and-boxes
npm ci
npm run deploy
```

This will run the build and push `dist` to the `gh-pages` branch.

2) Publish using the `/docs` folder on `main` branch

```powershell
cd dots-and-boxes
npm ci
npm run build
# copy dist into docs
Remove-Item -Recurse -Force .\docs\* -ErrorAction SilentlyContinue
Copy-Item -Path .\dist\* -Destination .\docs -Recurse
git add docs
git commit -m "deploy: update docs"
git push origin main
```

Notes & Troubleshooting
-----------------------
- The `vite.config.js` base is set to `./`, which works for GitHub Pages at `https://<user>.github.io/<repo>/`.
- `npm run deploy` requires git push access from your machine (credentials configured).
- If assets 404, try setting `base: '/<repo-name>/'` in `vite.config.js` and rebuild.

Automated helper
----------------
A tiny PowerShell helper is included at `scripts/deploy-pages.ps1` that runs `npm ci`, `npm run build` and `npm run deploy` for you from the repo root. Run it like:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\dots-and-boxes\scripts\deploy-pages.ps1
```
