# Ocean One Internal Dashboard

Static single-page app (vanilla HTML/CSS/JS): login, org chart, teammate detail pages. Data lives in `data/team.js`.

## Run locally

From this folder:

```bash
python3 -m http.server 8765
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/) (use a local server so scripts load reliably).

Smoke checks: login (see `admin_dashboard.md` for credentials reference), `#orgchart`, open a member from the chart, use browser devtools responsive mode for the mobile sidebar.

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `oceanone-dashboard`).
2. Push **the contents of this `dashboard/` folder** as the repository root (not the parent monorepo), or use a subtree/export copy.
3. Repository **Settings → Pages**: build from branch `main` (or `gh-pages`), folder `/ (root)`.
4. After the first deploy, confirm `index.html`, `css/styles.css`, `js/*.js`, and `data/team.js` return HTTP 200 (browser devtools Network tab).

Live URL shape: `https://<username>.github.io/<repo-name>/`

**Security:** Login is client-side only and credentials are in `js/app.js`. Use a **private** repository if the dashboard should not be publicly discoverable.

## Regenerate `data/team.js` from `teammates.json`

From the **Ocean One** workspace root (parent of `dashboard/`):

```bash
python3 scripts/build_dashboard_team_js.py
```

Only teammates with `status` not equal to `inactive` are included. Ensure `team/teammates.json` matches who should appear on the org chart before regenerating.
