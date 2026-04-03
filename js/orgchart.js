/**
 * Ocean One Dashboard — Org Chart Renderer
 * Renders a classic top-down organizational tree using CSS flexbox.
 * Accepts { members, orgTree } as data — no globals needed.
 */

const OrgChart = {
  render(container, { members, orgTree }) {
    const viewport = document.createElement("div");
    viewport.className = "org-chart-viewport";

    const outer = document.createElement("div");
    outer.className = "org-chart-scale-outer";

    const inner = document.createElement("div");
    inner.className = "org-chart-scale-inner";

    const wrapper = document.createElement("div");
    wrapper.className = "org-chart-container";

    const tree = document.createElement("div");
    tree.className = "org-tree";

    tree.appendChild(this.buildLevel(orgTree, members));

    wrapper.appendChild(tree);
    inner.appendChild(wrapper);
    outer.appendChild(inner);
    viewport.appendChild(outer);
    container.appendChild(viewport);

    this._attachAutoScale(viewport, outer, inner);
  },

  _attachAutoScale(viewport, outer, inner) {
    const apply = () => {
      const chart = inner.querySelector(".org-chart-container");
      if (!chart) return;
      inner.style.transform = "none";
      const w = chart.offsetWidth;
      const h = chart.offsetHeight;
      if (w < 2 || h < 2) return;
      const scale = Math.min((viewport.clientWidth - 16) / w, (viewport.clientHeight - 72) / h, 1);
      outer.style.width  = `${w * scale}px`;
      outer.style.height = `${h * scale}px`;
      inner.style.width  = `${w}px`;
      inner.style.height = `${h}px`;
      inner.style.transform = `scale(${scale})`;
      inner.style.transformOrigin = "0 0";
    };

    const run = () => requestAnimationFrame(apply);
    requestAnimationFrame(() => requestAnimationFrame(run));
    new ResizeObserver(run).observe(viewport);
  },

  buildLevel(nodeData, members) {
    const level = document.createElement("div");
    level.className = "tree-level";

    const member = members[nodeData.id] || {
      id: nodeData.id,
      displayName: nodeData.displayName
    };
    const isRoot = Boolean(nodeData.role);
    level.appendChild(this.buildNode(member, isRoot, nodeData.role, members));

    const children = nodeData.children || [];
    if (children.length > 0) {
      const connDown = document.createElement("div");
      connDown.className = "tree-connector-down";
      level.appendChild(connDown);

      const childrenRow = document.createElement("div");
      childrenRow.className = "tree-children";

      children.forEach((child) => {
        const childWrapper = document.createElement("div");
        childWrapper.className = "tree-child";

        if (child.children && child.children.length > 0) {
          childWrapper.appendChild(this.buildLevel(child, members));
        } else {
          const childMember = members[child.id] || { id: child.id, displayName: child.displayName };
          childWrapper.appendChild(this.buildNode(childMember, false, null, members));
        }

        childrenRow.appendChild(childWrapper);
      });

      level.appendChild(childrenRow);
    }

    return level;
  },

  buildNode(member, isRoot, role, members) {
    const node = document.createElement("div");
    node.className = "org-node" + (isRoot ? " root-node" : "");
    node.setAttribute("data-id", member.id);

    const name = document.createElement("div");
    name.className = "node-name";
    name.textContent = member.displayName;
    node.appendChild(name);

    if (isRoot && role) {
      const roleEl = document.createElement("div");
      roleEl.className = "node-role";
      roleEl.textContent = role;
      node.appendChild(roleEl);
    }

    if (!isRoot) {
      node.appendChild(this.buildTooltip(member));
      node.addEventListener("click", () => {
        window.location.hash = "#member/" + member.id;
      });
    }

    return node;
  },

  buildTooltip(member) {
    const tooltip = document.createElement("div");
    tooltip.className = "org-tooltip";

    const tooltipName = document.createElement("div");
    tooltipName.className = "tooltip-name";
    tooltipName.textContent = member.displayName + (member.fullName ? ` (${member.fullName})` : "");
    tooltip.appendChild(tooltipName);

    if (member.interviewDate) {
      tooltip.appendChild(this._tooltipRow("Interview", member.interviewDate));
    }

    // Training badges
    const trainingRow = document.createElement("div");
    trainingRow.className = "tooltip-row";
    const lbl = document.createElement("span");
    lbl.className = "tooltip-label";
    lbl.textContent = "Training";
    trainingRow.appendChild(lbl);

    const badges = document.createElement("div");
    badges.className = "training-badges";
    ["L1","L2","L3","L4","L5"].forEach((lvl) => {
      const badge = document.createElement("span");
      badge.className = "training-badge";
      badge.textContent = lvl;
      const completed  = (member.trainingCompleted  || []).includes(lvl);
      const scheduled  = (member.trainingScheduled  || {})[lvl];
      badge.classList.add(completed ? "completed" : scheduled ? "scheduled" : "pending");
      if (completed) badge.textContent += " ✓";
      if (scheduled && !completed) badge.textContent += " ◷";
      badges.appendChild(badge);
    });
    trainingRow.appendChild(badges);
    tooltip.appendChild(trainingRow);

    // Exam highlights
    const exam = member.exam || {};
    const examBits = [];
    if (String(exam.paper1  || "").toLowerCase().includes("passed")) examBits.push("P1 ✓");
    if (String(exam.paper3  || "").toLowerCase().includes("passed")) examBits.push("P3 ✓");
    if (String(exam.licence || "").includes("上牌"))                  examBits.push("Licensed ✓");
    if (examBits.length) tooltip.appendChild(this._tooltipRow("Exam", examBits.join(" · ")));

    if (member.background) {
      tooltip.appendChild(this._tooltipRow("Background", member.background));
    }

    return tooltip;
  },

  _tooltipRow(label, value) {
    const row = document.createElement("div");
    row.className = "tooltip-row";
    const l = document.createElement("span");
    l.className = "tooltip-label";
    l.textContent = label;
    const v = document.createElement("span");
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    return row;
  }
};
