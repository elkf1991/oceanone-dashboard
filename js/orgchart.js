/**
 * Ocean One Dashboard — Org Chart Renderer
 * Renders a classic top-down organizational tree using CSS flexbox
 */

const OrgChart = {
  /**
   * Render the full org chart into a container element
   * @param {HTMLElement} container
   */
  render(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "org-chart-container";

    const tree = document.createElement("div");
    tree.className = "org-tree";

    // Build the tree recursively starting from root
    const rootLevel = this.buildLevel(ORG_TREE);
    tree.appendChild(rootLevel);

    wrapper.appendChild(tree);
    container.appendChild(wrapper);
  },

  /**
   * Build a tree level: node + optional children
   * @param {Object} nodeData - { id, displayName, role, children }
   * @returns {HTMLElement}
   */
  buildLevel(nodeData) {
    const level = document.createElement("div");
    level.className = "tree-level";

    // Build the node card
    const member = MEMBERS[nodeData.id];
    const isRoot = nodeData.role !== undefined;
    const node = this.buildNode(member, isRoot, nodeData.role);
    level.appendChild(node);

    // If has children, build connectors + children row
    const children = nodeData.children || [];
    if (children.length > 0) {
      // Vertical connector down from parent
      const connDown = document.createElement("div");
      connDown.className = "tree-connector-down";
      level.appendChild(connDown);

      // Children container
      const childrenRow = document.createElement("div");
      childrenRow.className = "tree-children";

      children.forEach((child) => {
        const childWrapper = document.createElement("div");
        childWrapper.className = "tree-child";

        // Check if child has its own children (multi-level support)
        const childMember = MEMBERS[child.id];
        if (child.children && child.children.length > 0) {
          // Recursive: build full level for sub-tree
          const subLevel = this.buildLevel(child);
          childWrapper.appendChild(subLevel);
        } else {
          // Leaf node
          const childNode = this.buildNode(childMember, false);
          childWrapper.appendChild(childNode);
        }

        childrenRow.appendChild(childWrapper);
      });

      level.appendChild(childrenRow);
    }

    return level;
  },

  /**
   * Build a single node card with tooltip
   * @param {Object} member - Full member data from MEMBERS
   * @param {boolean} isRoot - Whether this is the root/manager node
   * @param {string} role - Optional role text
   * @returns {HTMLElement}
   */
  buildNode(member, isRoot, role) {
    const node = document.createElement("div");
    node.className = "org-node" + (isRoot ? " root-node" : "");
    node.setAttribute("data-id", member.id);

    // Name
    const name = document.createElement("div");
    name.className = "node-name";
    name.textContent = member.displayName;
    node.appendChild(name);

    // Role (for root node)
    if (isRoot && role) {
      const roleEl = document.createElement("div");
      roleEl.className = "node-role";
      roleEl.textContent = role;
      node.appendChild(roleEl);
    }

    // Tooltip (hover)
    if (!isRoot) {
      const tooltip = this.buildTooltip(member);
      node.appendChild(tooltip);
    }

    // Click → navigate to detail
    node.addEventListener("click", () => {
      window.location.hash = "#member/" + member.id;
    });

    return node;
  },

  /**
   * Build hover tooltip for a member node
   * @param {Object} member
   * @returns {HTMLElement}
   */
  buildTooltip(member) {
    const tooltip = document.createElement("div");
    tooltip.className = "org-tooltip";

    // Name
    const tooltipName = document.createElement("div");
    tooltipName.className = "tooltip-name";
    tooltipName.textContent = member.displayName;
    if (member.fullName) {
      tooltipName.textContent += " (" + member.fullName + ")";
    }
    tooltip.appendChild(tooltipName);

    // Interview date
    if (member.interviewDate) {
      tooltip.appendChild(this.buildTooltipRow("Interview", member.interviewDate));
    }

    // Training progress
    const trainingRow = document.createElement("div");
    trainingRow.className = "tooltip-row";
    const trainingLabel = document.createElement("span");
    trainingLabel.className = "tooltip-label";
    trainingLabel.textContent = "Training";
    trainingRow.appendChild(trainingLabel);

    const badges = document.createElement("div");
    badges.className = "training-badges";

    const allTraining = ["L1", "L2", "L3", "L4", "L5"];
    allTraining.forEach((level) => {
      const badge = document.createElement("span");
      badge.className = "training-badge";
      badge.textContent = level;

      if (member.trainingCompleted.includes(level)) {
        badge.className += " completed";
        badge.textContent += " ✓";
      } else if (member.trainingScheduled && member.trainingScheduled[level]) {
        badge.className += " scheduled";
        badge.textContent += " ◷";
      } else {
        badge.className += " pending";
      }

      badges.appendChild(badge);
    });

    trainingRow.appendChild(badges);
    tooltip.appendChild(trainingRow);

    // Exam status
    if (member.exam) {
      const examText = [];
      if (member.exam.paper1 && member.exam.paper1.toLowerCase().includes("passed")) {
        examText.push("P1 ✓");
      }
      if (member.exam.paper3 && member.exam.paper3.toLowerCase().includes("passed")) {
        examText.push("P3 ✓");
      }
      if (member.exam.licence && member.exam.licence.includes("上牌")) {
        examText.push("Licensed ✓");
      }
      if (examText.length > 0) {
        tooltip.appendChild(this.buildTooltipRow("Exam", examText.join(" · ")));
      }
    }

    // Background
    if (member.background) {
      tooltip.appendChild(this.buildTooltipRow("Background", member.background));
    }

    return tooltip;
  },

  /**
   * Build a tooltip row
   */
  buildTooltipRow(label, value) {
    const row = document.createElement("div");
    row.className = "tooltip-row";

    const labelEl = document.createElement("span");
    labelEl.className = "tooltip-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.textContent = value;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    return row;
  }
};
