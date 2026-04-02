/**
 * Ocean One Dashboard — Member Detail Page
 * Renders full teammate profile with training, exam, availability, etc.
 */

const MemberDetail = {
  /**
   * Render member detail page into container
   * @param {HTMLElement} container
   * @param {string} memberId
   */
  render(container, memberId) {
    const member = MEMBERS[memberId];
    if (!member) {
      container.innerHTML = '<div class="member-detail"><p>Member not found.</p></div>';
      return;
    }

    const detail = document.createElement("div");
    detail.className = "member-detail";

    // Back button
    const backBtn = document.createElement("button");
    backBtn.className = "back-btn";
    backBtn.innerHTML = "← Back to Org Chart";
    backBtn.addEventListener("click", () => {
      window.location.hash = "#orgchart";
    });
    detail.appendChild(backBtn);

    // Header card
    detail.appendChild(this.buildHeader(member));

    // Training section
    detail.appendChild(this.buildTrainingSection(member));

    // Exam section
    detail.appendChild(this.buildExamSection(member));

    // Availability / Timetable section
    if (member.timetable || member.availabilityType) {
      detail.appendChild(this.buildAvailabilitySection(member));
    }

    // Accomplishments
    if (member.accomplishment && Object.keys(member.accomplishment).length > 0) {
      detail.appendChild(this.buildAccomplishmentSection(member));
    }

    // Remarks
    if (member.remarks) {
      detail.appendChild(this.buildRemarksSection(member));
    }

    container.appendChild(detail);
  },

  buildHeader(member) {
    const header = document.createElement("div");
    header.className = "member-header";

    const name = document.createElement("div");
    name.className = "member-name";
    name.textContent = member.displayName;
    header.appendChild(name);

    if (member.fullName) {
      const fullName = document.createElement("div");
      fullName.className = "member-fullname";
      fullName.textContent = member.fullName;
      header.appendChild(fullName);
    }

    const meta = document.createElement("div");
    meta.className = "member-meta";

    if (member.contact) {
      meta.appendChild(this.buildMetaItem("Phone", member.contact));
    }
    if (member.background) {
      meta.appendChild(this.buildMetaItem("Background", member.background));
    }
    if (member.interviewDate) {
      meta.appendChild(this.buildMetaItem("Interview", member.interviewDate));
    }
    if (member.availabilityType) {
      const typeLabels = {
        timetable: "按時間表",
        by_booking: "每次再約",
        flexible: "彈性時間",
        weekday_evening_weekend: "平日晚上/週末",
        tbc: "待確認"
      };
      meta.appendChild(this.buildMetaItem("Availability", typeLabels[member.availabilityType] || member.availabilityType));
    }

    header.appendChild(meta);
    return header;
  },

  buildMetaItem(label, value) {
    const item = document.createElement("div");
    item.className = "member-meta-item";
    item.innerHTML = "<strong>" + label + ":</strong> " + this.escapeHtml(value);
    return item;
  },

  buildTrainingSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Training Progress 培訓進度";
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "training-grid";

    const allTraining = ["L1", "L2", "L3", "L4", "L5"];
    allTraining.forEach((level) => {
      const item = document.createElement("div");
      item.className = "training-item";

      const icon = document.createElement("span");
      icon.className = "status-icon";

      const info = document.createElement("div");
      const nameEl = document.createElement("div");
      nameEl.className = "training-name";
      nameEl.textContent = level;
      if (TRAINING_LIST[level]) {
        nameEl.textContent += " — " + TRAINING_LIST[level].name;
      }
      info.appendChild(nameEl);

      if (member.trainingCompleted.includes(level)) {
        icon.textContent = "✅";
        const detail = document.createElement("div");
        detail.className = "training-detail";
        detail.textContent = "Completed";
        info.appendChild(detail);
      } else if (member.trainingScheduled && member.trainingScheduled[level]) {
        icon.textContent = "📅";
        const detail = document.createElement("div");
        detail.className = "training-detail";
        detail.textContent = member.trainingScheduled[level];
        info.appendChild(detail);
      } else {
        icon.textContent = "⬜";
        const detail = document.createElement("div");
        detail.className = "training-detail";
        detail.textContent = "Pending";
        info.appendChild(detail);
      }

      item.appendChild(icon);
      item.appendChild(info);
      grid.appendChild(item);
    });

    section.appendChild(grid);
    return section;
  },

  buildExamSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Exam & Licence 考試及牌照";
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "exam-grid";

    const examFields = [
      { key: "paper1", label: "Paper 1" },
      { key: "paper3", label: "Paper 3" },
      { key: "licence", label: "Licence 牌照" }
    ];

    examFields.forEach((field) => {
      const item = document.createElement("div");
      item.className = "exam-item";

      const label = document.createElement("div");
      label.className = "exam-label";
      label.textContent = field.label;
      item.appendChild(label);

      const value = document.createElement("div");
      value.className = "exam-value";
      value.textContent = member.exam ? member.exam[field.key] || "N/A" : "N/A";
      item.appendChild(value);

      grid.appendChild(item);
    });

    section.appendChild(grid);
    return section;
  },

  buildAvailabilitySection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Availability 可用時間";
    section.appendChild(title);

    if (member.timetable) {
      const grid = document.createElement("div");
      grid.className = "timetable-grid";

      const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
      days.forEach((day) => {
        const dayEl = document.createElement("div");
        const value = member.timetable[day] || "—";
        dayEl.className = "timetable-day";

        if (value.toLowerCase().includes("not available") || value.includes("有其他")) {
          dayEl.className += " not-available";
        } else if (value.toLowerCase() === "free") {
          dayEl.className += " free";
        }

        const label = document.createElement("div");
        label.className = "day-label";
        label.textContent = day;
        dayEl.appendChild(label);

        const val = document.createElement("div");
        val.className = "day-value";
        val.textContent = value;
        dayEl.appendChild(val);

        grid.appendChild(dayEl);
      });

      section.appendChild(grid);
    } else {
      const text = document.createElement("p");
      text.className = "remarks-text";
      const typeLabels = {
        by_booking: "Available 時間每次再約",
        flexible: "彈性時間，基本上所有時間都可以",
        weekday_evening_weekend: "平日 18:00 後或週末",
        tbc: "待確認"
      };
      text.textContent = typeLabels[member.availabilityType] || member.availabilityType;
      section.appendChild(text);
    }

    return section;
  },

  buildAccomplishmentSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Accomplishments 成就";
    section.appendChild(title);

    const list = document.createElement("div");
    list.className = "accomplishment-list";

    Object.entries(member.accomplishment).forEach(([key, value]) => {
      const tag = document.createElement("span");
      tag.className = "accomplishment-tag";
      tag.textContent = key + (value ? ": " + value : "");
      list.appendChild(tag);
    });

    section.appendChild(list);
    return section;
  },

  buildRemarksSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Remarks 備註";
    section.appendChild(title);

    const text = document.createElement("p");
    text.className = "remarks-text";
    text.textContent = member.remarks;
    section.appendChild(text);

    return section;
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
};
