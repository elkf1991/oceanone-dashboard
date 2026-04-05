/**
 * Ocean One Dashboard — 人名單 (Prospect List) Summary Page
 * Shows all active teammates and their prospect list status.
 */

const ProspectList = {
  render(container, { members, orgTree }) {
    container.innerHTML = "";
    container.classList.remove("main-content--fit-org");

    const activeIds = new Set();
    if (orgTree) this._collectIds(orgTree, activeIds);

    const wrapper = document.createElement("div");
    wrapper.className = "prospectlist-page";

    const header = document.createElement("div");
    header.className = "content-header";
    header.innerHTML = "<h2>人名單 Prospect List</h2>" +
      "<p>Target client list progress · 各人人名單進度</p>";
    wrapper.appendChild(header);

    const rows = Object.values(members)
      .filter((m) => activeIds.has(m.id))
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    const tableWrap = document.createElement("div");
    tableWrap.className = "training-table-wrap";

    const table = document.createElement("table");
    table.className = "training-table prospectlist-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="col-name">Name</th>
          <th class="col-prospect-status">Status</th>
          <th class="col-prospect-link">Link</th>
        </tr>
      </thead>`;

    const tbody = document.createElement("tbody");
    rows.forEach((m) => {
      const tr = document.createElement("tr");

      // Name
      const nameTd = document.createElement("td");
      nameTd.className = "col-name";
      nameTd.textContent = m.displayName;
      tr.appendChild(nameTd);

      // Status
      const statusTd = document.createElement("td");
      statusTd.className = "col-prospect-status";
      if (m.prospectListDone) {
        statusTd.textContent = "✓";
        statusTd.classList.add("prospect-done");
      } else {
        statusTd.textContent = "—";
        statusTd.classList.add("prospect-pending");
      }
      tr.appendChild(statusTd);

      // Link
      const linkTd = document.createElement("td");
      linkTd.className = "col-prospect-link";
      if (m.prospectListDone && m.prospectListUrl) {
        const a = document.createElement("a");
        a.href = m.prospectListUrl;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "prospect-link-btn";
        a.textContent = "Click here ↗";
        linkTd.appendChild(a);
      }
      tr.appendChild(linkTd);

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableWrap.appendChild(table);
    wrapper.appendChild(tableWrap);
    container.appendChild(wrapper);
  },

  _collectIds(node, set) {
    (node.children || []).forEach((child) => {
      set.add(child.id);
      this._collectIds(child, set);
    });
  },
};
