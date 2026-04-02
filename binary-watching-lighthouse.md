# Ocean One Internal Dashboard — Design & Implementation Plan

## Context

Ocean One is an insurance brokerage in Hong Kong. The director (Eddie Lo) needs an internal admin dashboard for team management. The existing company website is a static marketing site (vanilla HTML/CSS/JS on SiteGround). This dashboard is a separate project hosted free on GitHub Pages, starting with an Org Chart tab and expanding over time.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hosting | GitHub Pages (free) | Static site, no backend needed |
| Auth | Client-side (sessionStorage) | Simple admin/password gate, sufficient for internal tool |
| Layout | Sidebar navigation | Professional admin feel, room for future tabs |
| Org Chart | Classic top-down CSS tree | Supports multi-level hierarchy, no dependencies |
| Tech Stack | Vanilla HTML/CSS/JS | Matches existing site, zero dependencies, maintainable |
| Routing | Hash-based SPA | Works on GitHub Pages, no server config needed |
| Design | Reuse Ocean design tokens | Consistent brand (--ocean-deep, --ocean-mid, etc.) |

## File Structure

```
dashboard/                          # New folder in project root
├── index.html                      # SPA entry point (login + dashboard + detail views)
├── css/
│   └── styles.css                  # Dashboard styles, Ocean design tokens
├── js/
│   ├── app.js                      # Router, auth, sidebar logic
│   ├── orgchart.js                 # Org chart tree rendering
│   └── member-detail.js            # Teammate detail page rendering
├── data/
│   └── team.js                     # Team data exported as JS module (from teammates.json)
└── README.md                       # GitHub Pages setup instructions
```

## Architecture

### 1. Login Page
- Full-screen centered login form with Ocean One branding
- Hardcoded credentials: `admin` / `oceanone168`
- On success: store auth flag in `sessionStorage`, redirect to `#dashboard`
- On fail: shake animation + error message
- All non-login routes redirect to `#login` if not authenticated

### 2. Hash Router
- `#login` → Login page
- `#dashboard` or `#orgchart` → Dashboard with Org Chart tab active
- `#member/{id}` → Teammate detail page
- Future: `#training`, `#schedule`, etc.

### 3. Sidebar Navigation
- Fixed left sidebar (220px width) with Ocean deep blue background
- Logo + company name at top
- Tab items: Org Chart (active), Training (greyed/coming soon), Schedule (greyed/coming soon)
- Logout button at bottom
- Collapsible on mobile (hamburger toggle)

### 4. Org Chart (Main Feature)

**Structure:**
```
Kobo Lam (Lam Cheuk Hang)
├── Ken           (2026-01-19)
├── Lily Li       (2026-01-19)
├── Jarvis        (2026-01-30)
├── Jacky         (2026-01-mid → sorted as 2026-01-15)
├── 阿智           (2026-02-03)
├── Austin        (2026-02-03)
├── Kitty Ma      (2026-02-03)
├── Sarah         (2026-02-03)
├── Vanessa       (2026-02-03)
├── Zenia         (2026-02-03)
├── Rita          (2026-02-06)
├── Sophia        (2026-02-24)
├── Sam           (2026-02-25)
├── Yuki          (2026-02-26)
├── Isaac         (2026-02-27)
├── Eric          (2026-03-03)
├── Matthew       (2026-03-11)
└── Alita         (2026-03-27)
```

**Rendering:**
- CSS Flexbox-based tree layout with `::before`/`::after` pseudo-elements for connector lines
- Root node (Kobo) styled prominently (ocean-deep background, white text)
- Child nodes: ocean-pale background, border, rounded cards
- Horizontal scroll if tree exceeds viewport width
- Responsive: stack vertically on narrow screens

**Node interactions:**
- **Default**: Show `displayName` only
- **Hover**: Tooltip showing training progress (L1-L5 badges), exam status, interview date
- **Click**: Navigate to `#member/{id}` for full detail page

**Multi-level support:**
- Data structure supports `children` array per node
- Recursive rendering function handles arbitrary depth
- Currently flat (1 manager → 18 reports), but ready for sub-teams

### 5. Teammate Detail Page
- Header: name, status badge, contact info
- Training section: L1-L5 progress with status icons (✅ completed, 📅 scheduled, ⬜ pending)
- Exam section: Paper 1, Paper 3 status, licence status
- Availability section: timetable grid or availability type
- Background info
- Accomplishments
- Back button → return to org chart

### 6. Data Layer (`data/team.js`)
- Export `TEAM_DATA` object with:
  - `org` array: hierarchical structure (manager → children)
  - Each node: `{ id, displayName, fullName, role, children: [...] }`
- Export `MEMBERS` map: `{ id: { ...full teammate details } }`
- Generated from `team/teammates.json` (can be scripted or manually maintained)
- Kobo Lam added as manager node with role "Team Manager"

## Implementation Phases

### Phase 1: Scaffold + Login (current scope)
1. Create `dashboard/` folder structure
2. Build `index.html` with SPA shell (sidebar + content area)
3. Implement CSS with Ocean design tokens
4. Build hash router in `app.js`
5. Build login page with auth logic
6. Build sidebar navigation

### Phase 2: Org Chart
1. Create `data/team.js` from `teammates.json` (add Kobo Lam, sort by interview date)
2. Build CSS tree layout with connector lines
3. Render org chart nodes
4. Add hover tooltips
5. Add click navigation to detail page

### Phase 3: Teammate Detail Page
1. Build detail page layout
2. Render training progress
3. Render exam/licence status
4. Render availability/timetable
5. Back navigation

### Phase 4: GitHub Pages Deployment
1. Create GitHub repo `oceanone-dashboard`
2. Push code
3. Enable GitHub Pages (main branch)
4. Provide setup instructions in README

## Key Files to Reference
- `/Users/eddielo/Library/CloudStorage/Dropbox/Ocean One/team/teammates.json` — source data
- `/Users/eddielo/Library/CloudStorage/Dropbox/Ocean One/website/styles.css` — design tokens to reuse
- `/Users/eddielo/Library/CloudStorage/Dropbox/Ocean One/website/index.html` — reference for bilingual patterns

## Verification
1. Open `dashboard/index.html` locally in browser
2. Verify login page appears, incorrect password shows error
3. Login with admin/oceanone168 → dashboard loads
4. Org chart shows Kobo at top, 18 teammates below sorted by interview date
5. Hover any node → tooltip with training/exam info
6. Click any node → detail page with full info
7. Back button returns to org chart
8. Sidebar logout returns to login
9. Refresh page while logged in → stays logged in (sessionStorage)
10. Test responsive: sidebar collapses on mobile
