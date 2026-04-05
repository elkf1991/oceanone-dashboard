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
      const nameLink = document.createElement("a");
      nameLink.className = "table-name-link";
      nameLink.href = "#member/" + m.id;
      nameLink.textContent = m.displayName;
      nameTd.appendChild(nameLink);
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

    // ── Failed, Need Re-exam ─────────────────────────────────────────────────
    // e.g. "2026-03-17 Failed, Need Re-exam"
    if (/failed/i.test(val) || /re-exam/i.test(val)) {
      const dateMatch = val.match(/\d{4}-\d{2}-\d{2}/);
      td.textContent = dateMatch ? `${dateMatch[0]} Failed, Re-exam` : val;
      td.classList.add("exam-failed");
      return;
    }

    // ── Already sat exam (result pending) ───────────────────────────────────
    // e.g. "已考 2026-03-09（筆試，約一星期知結果）"
    if (val.startsWith("已考")) {
      const dateMatch = val.match(/\d{4}-\d{2}-\d{2}/);
      td.textContent = dateMatch ? `已考 ${dateMatch[0]}` : val;
      td.classList.add("exam-sat");
      return;
    }

    // ── Booked / tentatively booked ─────────────────────────────────────────
    // e.g. "已報 2026-03-17"  "擬報 2026-03-20（未確認）"  "Scheduled 2026-04-30"
    if (val.startsWith("已報") || val.startsWith("擬報") || /^scheduled/i.test(val)) {
      const dateMatch = val.match(/\d{4}-\d{2}-\d{2}/);
      let prefix = "已報";
      if (val.startsWith("擬報")) prefix = "擬報";
      else if (/^scheduled/i.test(val)) prefix = "Scheduled";
      td.textContent = dateMatch ? `${prefix} ${dateMatch[0]}` : val;
      td.classList.add(val.startsWith("擬報") ? "exam-tentative" : "exam-booked");
      return;
    }

    // ── Raw date string e.g. "2026-03-16" ───────────────────────────────────
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      td.textContent = val.substring(0, 10);
      td.classList.add("exam-booked");
      return;
    }

    // ── In progress ──────────────────────────────────────────────────────────
    if (/^in progress/i.test(val)) {
      td.textContent = val;
      td.classList.add("exam-inprogress");
      return;
    }

    // ── Free-text note (e.g. "打算5月考, 4月報", "想預好時間…") ───────────────
    td.textContent = val;
    td.classList.add("exam-note");
  },

  _collectIds(node, set) {
    (node.children || []).forEach((child) => {
      set.add(child.id);
      this._collectIds(child, set);
    });
  },
};
