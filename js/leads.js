/**
 * Ocean One Dashboard — Job Ad to Interview Tab
 *
 * Moovup sheet columns:
 *   A(0)=Date(YYYY-MM-DD)  C(2)=Time  D(3)=Name  E(4)=Phone  F(5)=Source
 *   G(6)=Age  H(7)=Occupation  M(12)=Interview(bool)
 * JIJIS sheet columns:
 *   A(0)=Name  B(1)=Phone  H(7)=InterviewDate  I(8)=Confirmed(bool)  L(11)=Interview(bool)
 *
 * Interview count = interview=true AND date strictly before today (HKT)
 * Future count    = interview=true AND date >= today (HKT), shown as (+x), excluded from %
 * L1              = phone cross-check with Supabase teammates, gated on past interview
 */

const LEADS_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxaBMVcZBFQ7EAZfqie0p1A6tRS22mo-YdH6SkRUnn1PclPA-XRWjnYRGyPe6-8caNm6A/exec",
  TOKEN: "oceanone_leads_2026",
};

const SOURCE_MAP = {
  "Moovup (Topify)":                     "Moovup (Promoter)",
  "Moovup (OceanOne)":                   "Moovup (Promoter)",
  "Moovup (Fortune)":                    "Moovup (GI)",
  "Moovup (Fortune) (GI)":              "Moovup (GI)",
  "Moovup (Fortune) (Insurance Intern)": "Moovup (Insurance Intern)",
};
const SOURCE_ORDER  = ["Moovup (Promoter)", "Moovup (GI)", "Moovup (Insurance Intern)", "JIJIS"];
const MOOVUP_SOURCES = ["Moovup (Promoter)", "Moovup (GI)", "Moovup (Insurance Intern)"];

const FILTER_ROWS = [
  ["All"],
  ["Moovup (All)", "Moovup (Promoter)", "Moovup (GI)", "Moovup (Insurance Intern)"],
  ["JIJIS"],
];

const Leads = {
  _cache: null,
  _activeSource: "All",

  render(container, { members }) {
    container.innerHTML = "";
    container.classList.remove("main-content--fit-org");

    const wrapper = document.createElement("div");
    wrapper.className = "leads-page";

    const header = document.createElement("div");
    header.className = "content-header";
    header.innerHTML = "<h2>Job Ad to Interview 招聘漏斗</h2><p>Lead source dropout analysis · 各渠道轉化率分析</p>";
    wrapper.appendChild(header);

    const loading = document.createElement("div");
    loading.className = "leads-loading";
    loading.textContent = "Loading data…";
    wrapper.appendChild(loading);
    container.appendChild(wrapper);

    this._fetchData().then((raw) => {
      loading.remove();
      if (!raw) {
        const err = document.createElement("p");
        err.style.cssText = "padding:40px;color:var(--text-muted)";
        err.textContent = "Could not load data. Check the Apps Script URL and token.";
        wrapper.appendChild(err);
        return;
      }

      const l1Map  = this._buildL1Map(members);
      const allRows = this._normaliseRows(raw, l1Map);

      this._activeSource = "All";

      const filterWrap = document.createElement("div");
      filterWrap.className = "leads-filters";

      const funnelWrap = document.createElement("div");
      funnelWrap.className = "leads-funnel-wrap";

      const getFiltered = () => allRows.filter(r => {
        if (this._activeSource === "All")          return true;
        if (this._activeSource === "Moovup (All)") return MOOVUP_SOURCES.includes(r.source);
        return r.source === this._activeSource;
      });

      const redraw = () => {
        funnelWrap.innerHTML = "";
        funnelWrap.appendChild(this._renderFunnel(getFiltered()));
      };

      FILTER_ROWS.forEach(rowBtns => {
        const rowEl = document.createElement("div");
        rowEl.className = "leads-filter-row";
        rowBtns.forEach(src => {
          const btn = document.createElement("button");
          btn.className = "leads-filter-btn" + (src === "All" ? " active" : "");
          btn.textContent = src;
          btn.addEventListener("click", () => {
            this._activeSource = src;
            filterWrap.querySelectorAll(".leads-filter-btn").forEach(b =>
              b.classList.toggle("active", b.textContent === src)
            );
            redraw();
          });
          rowEl.appendChild(btn);
        });
        filterWrap.appendChild(rowEl);
      });

      wrapper.appendChild(filterWrap);
      wrapper.appendChild(funnelWrap);
      redraw();
    });
  },

  // ── Data fetching ─────────────────────────────────────────────────────────

  async _fetchData() {
    if (this._cache) return this._cache;
    try {
      const url = `${LEADS_CONFIG.APPS_SCRIPT_URL}?token=${encodeURIComponent(LEADS_CONFIG.TOKEN)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.error) return null;
      this._cache = data;
      return data;
    } catch {
      return null;
    }
  },

  // ── Row normalisation ─────────────────────────────────────────────────────

  _normaliseRows(raw, l1Map) {
    const rows = [];
    const todayStr = this._todayHKT(); // "YYYY-MM-DD"

    for (const r of (raw.moovup || [])) {
      const dateStr        = r.date || "";
      const pastInterview  = !!r.interview && !!dateStr && dateStr < todayStr;
      const futureInterview = !!r.interview && !!dateStr && dateStr >= todayStr;
      const phone          = this._normalisePhone(r.phone);
      const hasL1          = pastInterview && phone ? l1Map[phone] === true : false;
      rows.push({
        source:        SOURCE_MAP[r.source] || r.source || "Moovup",
        rawSource:     r.source || "Moovup",
        pastInterview,
        futureInterview,
        l1:            hasL1,
        // Detail fields for upcoming table
        date:          dateStr,
        time:          r.time || "",
        name:          r.name || "",
        rawPhone:      r.phone || "",
        age:           r.age  || "",
        occupation:    r.occupation || "",
      });
    }

    for (const r of (raw.jijis || [])) {
      const iDate          = this._parseJijisDate(r.interviewDate);
      const iDateStr       = iDate
        ? iDate.toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" })
        : "";
      const pastInterview  = !!r.interview && !!iDateStr && iDateStr < todayStr;
      const futureInterview = !!r.interview && !!iDateStr && iDateStr >= todayStr;
      const phone          = this._normalisePhone(r.phone);
      const hasL1          = pastInterview && phone ? l1Map[phone] === true : false;
      rows.push({
        source:        "JIJIS",
        rawSource:     "JIJIS",
        pastInterview,
        futureInterview,
        l1:            hasL1,
        // Detail fields for upcoming table
        date:          iDateStr,
        time:          this._extractTime(r.interviewDate),
        name:          r.name || "",
        rawPhone:      r.phone || "",
        age:           "N/A",
        occupation:    "學生",
      });
    }

    return rows;
  },

  // ── Date helpers ──────────────────────────────────────────────────────────

  _todayHKT() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
  },

  _parseJijisDate(str) {
    if (!str) return null;
    // "YYYY-MM-DD ..." or "YYYY-MM-DD" (Apps Script formatted Date object)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return new Date(str.substring(0, 10) + "T00:00:00+08:00");
    }
    // "22-1月-2026 14:30:00"
    const m1 = str.match(/^(\d{1,2})-(\d{1,2})月-(\d{4})/);
    if (m1) {
      const [, dd, mm, yyyy] = m1;
      return new Date(`${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T00:00:00+08:00`);
    }
    // "31/3 14:00" — assume current HKT year
    const m2 = str.match(/^(\d{1,2})\/(\d{1,2})/);
    if (m2) {
      const [, dd, mm] = m2;
      const yyyy = this._todayHKT().substring(0, 4);
      return new Date(`${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T00:00:00+08:00`);
    }
    // Fallback: Apps Script Date.toString() — "Wed Jan 28 2026 10:30:00 GMT+0800 (Hong Kong Standard Time)"
    // JavaScript's Date constructor parses this format natively and the GMT offset is respected.
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) return fallback;
    return null;
  },

  // Extract "HH:MM" from a JIJIS interviewDate string
  _extractTime(str) {
    if (!str) return "";
    // "YYYY-MM-DD HH:MM" or "22-1月-2026 14:30:00" or "31/3 14:00"
    const m = String(str).match(/\s(\d{1,2}):(\d{2})/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
    return "";
  },

  // "YYYY-MM-DD" → "Mon" / "Tue" / …
  _dayOfWeek(dateStr) {
    if (!dateStr) return "";
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const d = new Date(dateStr + "T12:00:00+08:00");
    if (isNaN(d.getTime())) return "";
    return days[d.getDay()];
  },

  // ── Phone helpers ─────────────────────────────────────────────────────────

  _buildL1Map(members) {
    const map = {};
    for (const m of Object.values(members || {})) {
      const phone = this._normalisePhone(m.contact);
      if (phone) map[phone] = (m.trainingCompleted || []).includes("L1");
    }
    return map;
  },

  _normalisePhone(val) {
    return String(val || "").replace(/[\s\-]/g, "").replace(/^\+?852/, "");
  },

  // ── Funnel rendering ──────────────────────────────────────────────────────

  _renderFunnel(rows) {
    const leads           = rows.length;
    const pastInterviews  = rows.filter(r => r.pastInterview).length;
    const futureInterviews = rows.filter(r => r.futureInterview).length;
    const l1              = rows.filter(r => r.l1).length;

    const stages = [
      { label: "Lead",         count: leads,          future: null,              prev: null           },
      { label: "Interview",    count: pastInterviews, future: futureInterviews,  prev: leads          },
      { label: "L1 Training",  count: l1,             future: null,              prev: pastInterviews },
    ];

    const wrap = document.createElement("div");
    wrap.className = "leads-funnel-inner";

    // ── Funnel blocks ────────────────────────────────────────────────────────
    const funnelBlocks = document.createElement("div");
    funnelBlocks.className = "training-funnel leads-funnel";

    stages.forEach(({ label, count, future, prev }, i) => {
      const pct = (prev !== null && prev > 0)
        ? Math.round(count / prev * 100) + "%"
        : null;

      const block = document.createElement("div");
      block.className = "funnel-block";
      block.innerHTML =
        `<div class="funnel-label">${label}</div>` +
        `<div class="funnel-count">${count}` +
        (future ? `<span class="funnel-future">(+${future})</span>` : "") +
        `</div>` +
        (pct ? `<div class="funnel-pct">${pct}</div>` : "");
      funnelBlocks.appendChild(block);

      if (i < stages.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "funnel-arrow";
        arrow.textContent = "→";
        funnelBlocks.appendChild(arrow);
      }
    });

    wrap.appendChild(funnelBlocks);

    // ── Upcoming interviews table ─────────────────────────────────────────────
    const upcoming = rows
      .filter(r => r.futureInterview)
      .sort((a, b) => {
        const dateComp = (a.date || "").localeCompare(b.date || "");
        if (dateComp !== 0) return dateComp;
        return (a.time || "").localeCompare(b.time || "");
      });

    const section = document.createElement("div");
    section.className = "leads-upcoming";

    const heading = document.createElement("h3");
    heading.className = "leads-upcoming-title";
    heading.textContent = "Upcoming Interviews";
    section.appendChild(heading);

    if (upcoming.length === 0) {
      const empty = document.createElement("p");
      empty.className = "leads-upcoming-empty";
      empty.textContent = "No upcoming interviews.";
      section.appendChild(empty);
    } else {
      const tableWrap = document.createElement("div");
      tableWrap.className = "leads-upcoming-wrap";

      const table = document.createElement("table");
      table.className = "leads-upcoming-table";

      const thead = table.createTHead();
      const hrow  = thead.insertRow();
      ["Date", "Day", "Time", "Name", "Phone", "Source", "Age", "Occupation"].forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        hrow.appendChild(th);
      });

      const tbody = table.createTBody();
      upcoming.forEach(r => {
        const tr = tbody.insertRow();
        [
          r.date       || "—",
          this._dayOfWeek(r.date) || "—",
          r.time       || "—",
          r.name       || "—",
          r.rawPhone   || "—",
          r.rawSource  || "—",
          r.age        || "—",
          r.occupation || "—",
        ].forEach(val => {
          const td = tr.insertCell();
          td.textContent = val;
        });
      });

      tableWrap.appendChild(table);
      section.appendChild(tableWrap);
    }

    wrap.appendChild(section);
    return wrap;
  },

  _uniqueSources(rows) {
    const present = new Set(rows.map(r => r.source));
    return SOURCE_ORDER.filter(s => present.has(s));
  },
};
