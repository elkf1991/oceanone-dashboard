/**
 * Ocean One Dashboard — Member Detail Page
 * Renders full teammate profile with training, exam, availability, etc.
 * Training labels: DataService.TRAINING_LIST (defined once in data-service.js).
 */

const MemberDetail = {
  /**
   * Render member detail page into container
   * @param {HTMLElement} container
   * @param {string} memberId
   * @param {Object} members  - map of id → member from DataService
   */
  render(container, memberId, members) {
    if (!members || typeof members !== "object") {
      container.innerHTML =
        '<div class="member-detail"><p>Team data is not loaded. Return to Org Chart or refresh the page.</p></div>';
      return;
    }

    const id = decodeURIComponent(memberId || "");
    const member = members[id];
    if (!member) {
      container.innerHTML =
        '<div class="member-detail"><p>Member not found.</p><p class="remarks-text">ID: ' +
        this.escapeHtml(id) +
        "</p></div>";
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

    // Regular Training section
    detail.appendChild(this.buildRegularTrainingSection(member));

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

    // Admin Notes
    detail.appendChild(this.buildAdminNotesSection(member));

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

    const labels = DataService.TRAINING_LIST;
    const allTraining = ["L1", "L2", "L3"];
    allTraining.forEach((level) => {
      const item = document.createElement("div");
      item.className = "training-item";

      const icon = document.createElement("span");
      icon.className = "status-icon";

      const info = document.createElement("div");
      const nameEl = document.createElement("div");
      nameEl.className = "training-name";
      nameEl.textContent = level;
      if (labels[level]) {
        nameEl.textContent += " — " + labels[level].name;
      }
      info.appendChild(nameEl);

      const done = (member.trainingCompleted || []).includes(level);
      if (done) {
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

  buildRegularTrainingSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Weekly Regular Training 每週恆常培訓";
    section.appendChild(title);

    // Sessions legend
    const legend = document.createElement("div");
    legend.className = "regular-sessions-legend";
    Object.entries(DataService.REGULAR_SESSIONS).forEach(([key, time]) => {
      const item = document.createElement("div");
      item.className = "session-legend-item";
      const label = document.createElement("strong");
      label.textContent = "Session " + key + ":";
      item.appendChild(label);
      item.appendChild(document.createTextNode(" " + time));
      legend.appendChild(item);
    });
    section.appendChild(legend);

    // Availability badge
    const value = member.regularTraining || "—";
    const avail = document.createElement("div");
    const isPending = value.startsWith("Pending");
    const isDepends = value.startsWith("Depends");
    avail.className = "regular-training-availability" +
      (isPending ? " rt-pending" : isDepends ? " rt-depends" : " rt-available");

    const availLabel = document.createElement("span");
    availLabel.className = "rt-label";
    availLabel.textContent = "可出席 Session: ";
    avail.appendChild(availLabel);
    avail.appendChild(document.createTextNode(value));
    section.appendChild(avail);

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
        const raw = member.timetable[day];
        const value = raw != null && raw !== "" ? String(raw) : "—";
        dayEl.className = "timetable-day";

        const lower = value.toLowerCase();
        if (lower.includes("not available") || value.includes("有其他")) {
          dayEl.className += " not-available";
        } else if (lower === "free") {
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

    // Timetable photo from Supabase Storage (private bucket)
    this._appendTimetablePhoto(section, member.displayName);

    return section;
  },

  async _appendTimetablePhoto(section, displayName) {
    const extensions = ["jpeg", "png"];
    for (const ext of extensions) {
      const filename = `${displayName}.${ext}`;
      const { data, error } = await supabase.storage
        .from("timetables")
        .createSignedUrl(filename, 3600);
      if (!error && data?.signedUrl) {
        const img = document.createElement("img");
        img.className = "timetable-photo";
        img.alt = `${displayName} timetable`;
        img.src = data.signedUrl;
        section.appendChild(img);
        return;
      }
    }
  },

  buildAccomplishmentSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "Accomplishments 成就";
    section.appendChild(title);

    const list = document.createElement("div");
    list.className = "accomplishment-list";

    const acc =
      member.accomplishment && typeof member.accomplishment === "object"
        ? member.accomplishment
        : {};
    Object.entries(acc).forEach(([key, value]) => {
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

  buildAdminNotesSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section admin-notes-section";

    const title = document.createElement("h3");
    title.textContent = "Admin Notes 管理員備註";
    section.appendChild(title);

    const textarea = document.createElement("textarea");
    textarea.className = "admin-notes-textarea";
    textarea.placeholder = "Add private notes about this teammate...";
    textarea.value = member.adminNotes || "";
    section.appendChild(textarea);

    const footer = document.createElement("div");
    footer.className = "admin-notes-footer";

    const saveBtn = document.createElement("button");
    saveBtn.className = "admin-notes-save-btn";
    saveBtn.textContent = "Save Notes";
    footer.appendChild(saveBtn);

    const feedback = document.createElement("span");
    feedback.className = "admin-notes-feedback";
    footer.appendChild(feedback);

    section.appendChild(footer);

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      feedback.textContent = "";
      feedback.className = "admin-notes-feedback";

      try {
        await DataService.saveNotes(member.id, textarea.value);
        member.adminNotes = textarea.value;
        feedback.textContent = "Saved ✓";
        feedback.classList.add("success");
      } catch (err) {
        feedback.textContent = "Failed to save";
        feedback.classList.add("error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Notes";
        setTimeout(() => { feedback.textContent = ""; feedback.className = "admin-notes-feedback"; }, 3000);
      }
    });

    return section;
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
};
