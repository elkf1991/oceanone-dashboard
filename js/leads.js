/**
 * Ocean One Dashboard — Job Ad to Interview Tab
 *
 * Data sources:
 *   - Google Sheet (via Apps Script) for Lead + Interview stages
 *   - Supabase teammates table for L1 stage (phone number match)
 *
 * Moovup tab columns:
 *   A(0)=Date  E(4)=Phone  F(5)=Source  M(12)=Interview(bool)
 * JIJIS tab columns:
 *   A(0)=Name  B(1)=Phone  I(8)=Confirmed(bool)  L(11)=Interview(bool)
 */

const LEADS_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxaBMVcZBFQ7EAZfqie0p1A6tRS22mo-YdH6SkRUnn1PclPA-XRWjnYRGyPe6-8caNm6A/exec",
  TOKEN: "oceanone_leads_2026",
};

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

      // Build phone→L1 lookup from Supabase members
      const l1Map = this._buildL1Map(members);

      // Normalise all rows into unified format
      const allRows = this._normaliseRows(raw, l1Map);

      // Source filter buttons + funnel area
      const sources = ["All", ...this._uniqueSources(allRows)];
      this._activeSource = "All";

      const filterWrap = document.createElement("div");
      filterWrap.className = "leads-filters";

      const funnelWrap = document.createElement("div");
      funnelWrap.className = "leads-funnel-wrap";

      const redraw = () => {
        const filtered = this._activeSource === "All"
          ? allRows
          : allRows.filter(r => r.source === this._activeSource);
        funnelWrap.innerHTML = "";
        funnelWrap.appendChild(this._renderFunnel(filtered));
      };

      sources.forEach(src => {
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
        filterWrap.appendChild(btn);
      });

      wrapper.appendChild(filterWrap);
      wrapper.appendChild(funnelWrap);
      redraw();
    });
  },

  // ── Data helpers ──────────────────────────────────────────────────────────

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

  _buildL1Map(members) {
    // phone (normalised) → true if L1 completed
    const map = {};
    for (const m of Object.values(members || {})) {
      const phone = this._normalisePhone(m.contact);
      if (phone) map[phone] = (m.trainingCompleted || []).includes("L1");
    }
    return map;
  },

  _normalisePhone(val) {
    // Remove spaces, dashes, +852 prefix → 8-digit HK number
    return String(val || "").replace(/[\s\-]/g, "").replace(/^\+?852/, "");
  },

  _normaliseRows(raw, l1Map) {
    const rows = [];

    // Moovup rows
    for (const r of (raw.moovup || [])) {
      const phone  = this._normalisePhone(r.phone);
      const hasL1  = r.interview && phone ? l1Map[phone] === true : false;
      rows.push({
        source:    r.source || "Moovup",
        interview: !!r.interview,
        l1:        hasL1,
      });
    }

    // JIJIS rows
    for (const r of (raw.jijis || [])) {
      const phone = this._normalisePhone(r.phone);
      const hasL1 = r.interview && phone ? l1Map[phone] === true : false;
      rows.push({
        source:    "JIJIS",
        interview: !!r.interview,
        l1:        hasL1,
      });
    }

    return rows;
  },

  _uniqueSources(rows) {
    const seen = new Set();
    // Moovup sources first, then JIJIS
    for (const r of rows) if (r.source !== "JIJIS") seen.add(r.source);
    seen.add("JIJIS");
    return [...seen];
  },

  // ── Funnel rendering ──────────────────────────────────────────────────────

  _renderFunnel(rows) {
    const leads     = rows.length;
    const interview = rows.filter(r => r.interview).length;
    const l1        = rows.filter(r => r.l1).length;

    const stages = [
      { label: "Lead",      count: leads     },
      { label: "Interview", count: interview },
      { label: "L1 Training", count: l1      },
    ];

    const wrap = document.createElement("div");
    wrap.className = "training-funnel leads-funnel";

    stages.forEach(({ label, count }, i) => {
      const prev = i > 0 ? stages[i - 1].count : null;
      const pct  = (prev !== null && prev > 0)
        ? Math.round(count / prev * 100) + "%"
        : null;

      const block = document.createElement("div");
      block.className = "funnel-block";
      block.innerHTML =
        `<div class="funnel-label">${label}</div>` +
        `<div class="funnel-count">${count}</div>` +
        (pct ? `<div class="funnel-pct">${pct}</div>` : "");
      wrap.appendChild(block);

      if (i < stages.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "funnel-arrow";
        arrow.textContent = "→";
        wrap.appendChild(arrow);
      }
    });

    return wrap;
  },
};
