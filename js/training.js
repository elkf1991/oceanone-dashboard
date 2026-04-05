/**
 * Ocean One Dashboard — Training Page
 * Sub-section 1: Dropout funnel (L1 → L2 → L3 → Regular)
 * Sub-section 2: Regular Training Session Availability
 *
 * Funnel counts: only completed (✓) rows count.
 * Scheduled rows: shown in table with date/time text, NOT counted in funnel.
 * Special scheduled values: "Rearrange" → light-yellow cell,
 *   "飛機, no response" → light-red cell.
 */

const Training = {
  render(container, { members, orgTree }) {
    container.innerHTML = "";
    container.classList.remove("main-content--fit-org");

    const activeIds = new Set();
    if (orgTree) this._collectIds(orgTree, activeIds);

    const wrapper = document.createElement("div");
    wrapper.className = "training-page";

    const header = document.createElement("div");
    header.className = "content-header";
    header.innerHTML = "<h2>Training 培訓</h2>";
    wrapper.appendChild(header);

    const tabs       = document.createElement("div");
    tabs.className   = "training-tabs";
    const tabContent = document.createElement("div");
    tabContent.className = "training-tab-content";

    const tabDefs = [
      { id: "dropout",      label: "L1 / L2 / L3 / Regular" },
      { id: "availability", label: "Regular Training Availability" },
    ];

    const renderTab = (id) => {
      tabContent.innerHTML = "";
      tabs.querySelectorAll(".training-tab-btn").forEach((b) =>
        b.classList.toggle("active", b.dataset.tab === id)
      );
      if (id === "dropout") this._renderDropout(tabContent, members, activeIds);
      else this._renderAvailability(tabContent, members, activeIds);
    };

    tabDefs.forEach(({ id, label }) => {
      const btn = document.createElement("button");
      btn.className = "training-tab-btn" + (id === "dropout" ? " active" : "");
      btn.dataset.tab = id;
      btn.textContent = label;
      btn.addEventListener("click", () => renderTab(id));
      tabs.appendChild(btn);
    });

    wrapper.appendChild(tabs);
    wrapper.appendChild(tabContent);
    container.appendChild(wrapper);
    renderTab("dropout");
  },

  _collectIds(node, set) {
    (node.children || []).forEach((child) => {
      set.add(child.id);
      this._collectIds(child, set);
    });
  },

  // ── Sub-section 1: Dropout funnel ─────────────────────────────────────────

  _renderDropout(container, members, activeIds) {
    // Include anyone who has completed L1 OR has L1 scheduled
    const rows = Object.values(members)
      .filter((m) => {
        const done = m.trainingCompleted || [];
        const sched = m.trainingScheduled || {};
        return done.includes("L1") || !!sched["L1"];
      })
      .sort((a, b) => {
        const aA = activeIds.has(a.id), bA = activeIds.has(b.id);
        if (aA !== bA) return aA ? -1 : 1;
        return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
      });

    // Funnel counts — only completed rows count
    const l1  = rows.filter((m) => (m.trainingCompleted || []).includes("L1")).length;
    const l2  = rows.filter((m) => (m.trainingCompleted || []).includes("L2")).length;
    const l3  = rows.filter((m) => (m.trainingCompleted || []).includes("L3")).length;
    const reg = rows.filter((m) => this._hasRegular(m)).length;

    const funnel = document.createElement("div");
    funnel.className = "training-funnel";
    [
      { label: "L1",      count: l1  },
      { label: "L2",      count: l2  },
      { label: "L3",      count: l3  },
      { label: "Regular", count: reg },
    ].forEach(({ label, count }, i, arr) => {
      const prev = i > 0 ? arr[i - 1].count : null;
      const pct  = (prev !== null && prev > 0)
        ? Math.round(count / prev * 100) + "%" : null;
      const block = document.createElement("div");
      block.className = "funnel-block";
      block.innerHTML =
        `<div class="funnel-label">${label}</div>` +
        `<div class="funnel-count">${count}</div>` +
        (pct ? `<div class="funnel-pct">${pct}</div>` : "");
      funnel.appendChild(block);
      if (i < arr.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "funnel-arrow";
        arrow.textContent = "→";
        funnel.appendChild(arrow);
      }
    });
    container.appendChild(funnel);

    // Table
    const tableWrap = document.createElement("div");
    tableWrap.className = "training-table-wrap";

    const table = document.createElement("table");
    table.className = "training-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="col-name">Name</th>
          <th class="col-check">L1</th>
          <th class="col-check">L2</th>
          <th class="col-check">L3</th>
          <th class="col-check">Regular</th>
        </tr>
      </thead>`;

    const tbody = document.createElement("tbody");
    rows.forEach((m) => {
      const isActive = activeIds.has(m.id);
      const done  = m.trainingCompleted || [];
      const sched = m.trainingScheduled || {};
      const tr = document.createElement("tr");
      if (!isActive) tr.className = "row-inactive";

      // Name cell
      const nameTd = document.createElement("td");
      nameTd.className = "col-name";
      nameTd.textContent = m.displayName;
      if (!isActive) {
        const badge = document.createElement("span");
        badge.className = "inactive-badge";
        badge.textContent = "Inactive";
        nameTd.appendChild(badge);
      }
      tr.appendChild(nameTd);

      // L1 / L2 / L3
      ["L1", "L2", "L3"].forEach((lvl) => {
        const td = document.createElement("td");
        td.className = "col-check";
        if (done.includes(lvl)) {
          td.textContent = "✓";
        } else if (sched[lvl]) {
          this._applyScheduledCell(td, sched[lvl]);
        }
        tr.appendChild(td);
      });

      // Regular
      const regTd = document.createElement("td");
      regTd.className = "col-check";
      regTd.textContent = this._hasRegular(m) ? "✓" : "";
      tr.appendChild(regTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.appendChild(tableWrap);
  },

  // Apply appropriate content + background colour to a scheduled cell
  _applyScheduledCell(td, schedValue) {
    const val = schedValue.trim();

    if (val === "Rearrange") {
      td.textContent = val;
      td.style.background = "#fefce8";   // light yellow
      td.style.color = "#a16207";
      td.style.fontSize = "11px";
    } else if (val.startsWith("飛機") || val.toLowerCase().includes("no response")) {
      td.textContent = val;
      td.style.background = "#fef2f2";   // light red
      td.style.color = "#b91c1c";
      td.style.fontSize = "11px";
    } else if (val.toLowerCase().includes("arrange in") || val.toLowerCase().includes("tbc")) {
      td.textContent = val;
      td.style.background = "#fefce8";   // light yellow
      td.style.color = "#a16207";
      td.style.fontSize = "11px";
    } else {
      // Regular datetime schedule — show compactly
      td.textContent = val;
      td.style.fontSize = "11px";
      td.style.color = "var(--ocean-mid)";
      td.style.whiteSpace = "nowrap";
    }
  },

  _hasRegular(m) {
    return m.regularAttended === true;
  },

  // ── Sub-section 2: Regular Training Availability ──────────────────────────

  _renderAvailability(container, members, activeIds) {
    const rows = Object.values(members)
      .filter((m) => activeIds.has(m.id))
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    const tableWrap = document.createElement("div");
    tableWrap.className = "training-table-wrap";

    const table = document.createElement("table");
    table.className = "training-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="col-name">Name</th>
          <th class="col-check">Session A<br><span class="session-time">Mon 09:00–11:00</span></th>
          <th class="col-check">Session B<br><span class="session-time">Wed 15:00–17:00</span></th>
          <th class="col-check">Session C<br><span class="session-time">Fri 15:00–17:00</span></th>
        </tr>
      </thead>`;

    const tbody = document.createElement("tbody");
    rows.forEach((m) => {
      const s = this._parseSessions(m.regularTraining);
      const allBlank = !s.A && !s.B && !s.C;

      const tr = document.createElement("tr");
      if (allBlank) tr.className = "row-no-session";

      const nameTd = document.createElement("td");
      nameTd.className = "col-name";
      nameTd.textContent = m.displayName;
      tr.appendChild(nameTd);

      ["A", "B", "C"].forEach((sess) => {
        const td = document.createElement("td");
        td.className = "col-check";
        td.textContent = s[sess] ? "✓" : "";
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    container.appendChild(tableWrap);
  },

  _parseSessions(val) {
    if (!val || val.startsWith("Pending") || val.startsWith("Depends")) {
      return { A: false, B: false, C: false };
    }
    return { A: val.includes("A"), B: val.includes("B"), C: val.includes("C") };
  },
};
