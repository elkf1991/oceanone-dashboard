/**
 * Ocean One Dashboard — Exam & Licence Page
 *
 * Cell logic per field (paper1 / paper3 / licence):
 *   ✓  (green)  — value contains "Passed" / "passed" / "已成功上牌"
 *   date text   — value contains a date pattern (YYYY-MM-DD or 已報/擬報/已考 + date)
 *   —           — value is blank, "未排期", or the boilerplate "須通過…" string
 */

const Exam = {
  render(container, { members, orgTree }) {
    container.innerHTML = "";
    container.classList.remove("main-content--fit-org");

    const activeIds = new Set();
    if (orgTree) this._collectIds(orgTree, activeIds);

    const wrapper = document.createElement("div");
    wrapper.className = "exam-page";

    const header = document.createElement("div");
    header.className = "content-header";
    header.innerHTML = "<h2>Exam &amp; Licence 考試及牌照</h2>" +
      "<p>Paper 1 &amp; Paper 3 exam progress · 各人考試及上牌進度</p>";
    wrapper.appendChild(header);

    // Active members sorted by sortOrder
    const rows = Object.values(members)
      .filter((m) => activeIds.has(m.id))
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    const tableWrap = document.createElement("div");
    tableWrap.className = "training-table-wrap";

    const table = document.createElement("table");
    table.className = "training-table exam-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="col-name">Name</th>
          <th class="col-exam">Paper 1</th>
          <th class="col-exam">Paper 3</th>
          <th class="col-exam">Licence 牌照</th>
        </tr>
      </thead>`;

    const tbody = document.createElement("tbody");
    rows.forEach((m) => {
      const exam = m.exam || {};
      const tr   = document.createElement("tr");

      const nameTd = document.createElement("td");
      nameTd.className = "col-name";
      nameTd.textContent = m.displayName;
      tr.appendChild(nameTd);

      ["paper1", "paper3", "licence"].forEach((field) => {
        const td = document.createElement("td");
        td.className = "col-exam";
        this._applyExamCell(td, exam[field] || "");
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrapper.appendChild(tableWrap);
    container.appendChild(wrapper);
  },

  _applyExamCell(td, raw) {
    const val = String(raw).trim();

    // ── Passed / Licensed ────────────────────────────────────────────────────
    if (/passed/i.test(val) || val.includes("已成功上牌")) {
      td.textContent = "✓";
      td.classList.add("exam-passed");
      return;
    }

    // ── Blank / pending / boilerplate ────────────────────────────────────────
    if (!val || val === "未排期" || val.startsWith("須通過")) {
      td.textContent = "—";
      td.classList.add("exam-pending");
      return;
    }

    // ── Already sat exam (result pending) ───────────────────────────────────
    // e.g. "已考 2026-03-09（筆試，約一星期知結果）"
    if (val.startsWith("已考")) {
      const dateMatch = val.match(/\d{4}-\d{2}-\d{2}/);
      td.textContent = dateMatch ? `已考 ${dateMatch[0]}` : val;
      td.classList.add("exam-sat");   // blue-ish — waiting for result
      return;
    }

    // ── Booked / tentatively booked ─────────────────────────────────────────
    // e.g. "已報 2026-03-17"  "擬報 2026-03-20（未確認）"
    if (val.startsWith("已報") || val.startsWith("擬報")) {
      const dateMatch = val.match(/\d{4}-\d{2}-\d{2}/);
      const prefix = val.startsWith("已報") ? "已報" : "擬報";
      td.textContent = dateMatch ? `${prefix} ${dateMatch[0]}` : val;
      td.classList.add(val.startsWith("已報") ? "exam-booked" : "exam-tentative");
      return;
    }

    // ── Raw date string e.g. "2026-03-16" ───────────────────────────────────
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      td.textContent = val.substring(0, 10);
      td.classList.add("exam-booked");
      return;
    }

    // ── Fallback: show as-is ─────────────────────────────────────────────────
    td.textContent = val;
    td.style.fontSize = "11px";
  },

  _collectIds(node, set) {
    (node.children || []).forEach((child) => {
      set.add(child.id);
      this._collectIds(child, set);
    });
  },
};
