/**
 * Ocean One Dashboard — 自爆，邀約，簽單 Summary Page
 */

const Milestone = {
  render(container, { members, orgTree }) {
    container.innerHTML = "";
    container.classList.remove("main-content--fit-org");

    const activeIds = new Set();
    if (orgTree) this._collectIds(orgTree, activeIds);

    const wrapper = document.createElement("div");
    wrapper.className = "milestone-page";

    const header = document.createElement("div");
    header.className = "content-header";
    header.innerHTML = "<h2>自爆，邀約，簽單</h2>";
    wrapper.appendChild(header);

    const rows = Object.values(members)
      .filter((m) => activeIds.has(m.id))
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

    const tableWrap = document.createElement("div");
    tableWrap.className = "training-table-wrap";

    const table = document.createElement("table");
    table.className = "training-table milestone-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th class="col-name">Name</th>
          <th class="col-milestone">自爆</th>
          <th class="col-milestone">邀約</th>
          <th class="col-milestone">簽單</th>
        </tr>
      </thead>`;

    const tbody = document.createElement("tbody");
    rows.forEach((m) => {
      const tr = document.createElement("tr");

      // Name — clickable
      const nameTd = document.createElement("td");
      nameTd.className = "col-name";
      const nameLink = document.createElement("a");
      nameLink.className = "table-name-link";
      nameLink.href = "#member/" + m.id;
      nameLink.textContent = m.displayName;
      nameTd.appendChild(nameLink);
      tr.appendChild(nameTd);

      // 自爆 — tick + amount if set
      const ownTd = document.createElement("td");
      ownTd.className = "col-milestone";
      if (m.milestoneOwnPlan) {
        ownTd.innerHTML = `<span class="milestone-tick">✓</span><span class="milestone-amount">${m.milestoneOwnPlan}</span>`;
      }
      tr.appendChild(ownTd);

      // 邀約
      const invTd = document.createElement("td");
      invTd.className = "col-milestone";
      if (m.milestoneInvites) invTd.innerHTML = `<span class="milestone-tick">✓</span>`;
      tr.appendChild(invTd);

      // 簽單
      const signTd = document.createElement("td");
      signTd.className = "col-milestone";
      if (m.milestoneSignCase) signTd.innerHTML = `<span class="milestone-tick">✓</span>`;
      tr.appendChild(signTd);

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
