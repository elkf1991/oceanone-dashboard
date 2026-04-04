/**
 * Ocean One Dashboard — Job Ad to Interview Tab
 * Reads lead/interview funnel data from Google Sheets via Apps Script Web App.
 *
 * Sheet columns (headers are numeric keys from the spreadsheet):
 *   "52"  = Interview (showed up)
 *   "17"  = Day 1 Training
 *   "10"  = Day 2 Training
 *   "6"   = CDP
 *   "4"   = 邀約 (Referral made)
 *   Values are boolean (checkbox)
 *   Lead Source is injected by the script: "moovup" or "jijis"
 */

const LEADS_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxaBMVcZBFQ7EAZfqie0p1A6tRS22mo-YdH6SkRUnn1PclPA-XRWjnYRGyPe6-8caNm6A/exec",
  TOKEN: "oceanone_leads_2026",
};

// Funnel stages in order
const FUNNEL_STAGES = [
  { key: null,  label: "Lead"          },
  { key: "52",  label: "Interview"     },
  { key: "17",  label: "Day 1 Training"},
  { key: "10",  label: "Day 2 Training"},
  { key: "6",   label: "CDP"           },
  { key: "4",   label: "邀約"          },
];

const Leads = {
  _cache: null,

  render(container) {
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

    this._fetchData().then((rows) => {
      loading.remove();
      if (!rows) {
        const err = document.createElement("p");
        err.style.cssText = "padding:40px;color:var(--text-muted)";
        err.textContent = "Could not load data. Check the Apps Script URL and token.";
        wrapper.appendChild(err);
        return;
      }
      wrapper.appendChild(this._renderSummary(rows));
      wrapper.appendChild(this._renderBySource(rows));
    });
  },

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

  _checked(row, key) {
    const val = row[key];
    if (typeof val === "boolean") return val;
    return String(val).trim().toLowerCase() === "true" || String(val).trim().toLowerCase() === "yes";
  },

  _countStage(rows, key) {
    if (!key) return rows.length;
    return rows.filter(r => this._checked(r, key)).length;
  },

  // ── Overall funnel ────────────────────────────────────────────────────────

  _renderSummary(rows) {
    const section = document.createElement("div");
    section.className = "leads-overall";

    const title = document.createElement("h3");
    title.textContent = "Overall 總覽";
    section.appendChild(title);

    section.appendChild(this._funnelBlocks(rows));
    return section;
  },

  _funnelBlocks(rows) {
    const wrap = document.createElement("div");
    wrap.className = "training-funnel leads-funnel";

    FUNNEL_STAGES.forEach(({ key, label }, i) => {
      const count = this._countStage(rows, key);
      const prev  = i > 0 ? this._countStage(rows, FUNNEL_STAGES[i - 1].key) : null;
      const pct   = (prev !== null && prev > 0) ? Math.round(count / prev * 100) + "%" : null;

      const block = document.createElement("div");
      block.className = "funnel-block";
      block.innerHTML =
        `<div class="funnel-label">${label}</div>` +
        `<div class="funnel-count">${count}</div>` +
        (pct ? `<div class="funnel-pct">${pct}</div>` : "");
      wrap.appendChild(block);

      if (i < FUNNEL_STAGES.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "funnel-arrow";
        arrow.textContent = "→";
        wrap.appendChild(arrow);
      }
    });

    return wrap;
  },

  // ── By source table ───────────────────────────────────────────────────────

  _renderBySource(rows) {
    const section = document.createElement("div");
    section.className = "leads-by-source";

    const title = document.createElement("h3");
    title.textContent = "By Lead Source 按渠道";
    section.appendChild(title);

    // Group rows by Lead Source
    const sources = {};
    for (const row of rows) {
      const src = String(row["Lead Source"] || "Unknown").trim();
      if (!sources[src]) sources[src] = [];
      sources[src].push(row);
    }

    const tableWrap = document.createElement("div");
    tableWrap.className = "training-table-wrap";

    const table = document.createElement("table");
    table.className = "training-table leads-source-table";

    // Build header row from stages (skip "Lead" as it's just the total)
    const stageHeaders = FUNNEL_STAGES.map(s =>
      `<th class="col-check">${s.label}</th>`
    ).join("");
    table.innerHTML = `<thead><tr><th class="col-name">Source</th>${stageHeaders}</tr></thead>`;

    const tbody = document.createElement("tbody");
    const sourceList = Object.entries(sources).sort((a, b) => b[1].length - a[1].length);

    // Add "Total" row first in order
    const allEntries = [...sourceList, ["Total", rows]];

    allEntries.forEach(([src, srcRows], idx) => {
      const isTotal = src === "Total";
      const tr = document.createElement("tr");
      if (isTotal) tr.className = "leads-total-row";

      const nameTd = document.createElement("td");
      nameTd.className = "col-name";
      nameTd.textContent = isTotal ? "Total" : src;
      tr.appendChild(nameTd);

      FUNNEL_STAGES.forEach(({ key }, i) => {
        const count = this._countStage(srcRows, key);
        const prev  = i > 0 ? this._countStage(srcRows, FUNNEL_STAGES[i - 1].key) : null;
        const pct   = (prev !== null && prev > 0) ? ` (${Math.round(count / prev * 100)}%)` : "";

        const td = document.createElement("td");
        td.className = "col-check";
        td.innerHTML = `${count}<span class="leads-pct">${pct}</span>`;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    section.appendChild(tableWrap);
    return section;
  },
};
