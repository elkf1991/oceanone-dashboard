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

    // 自爆，邀約，簽單
    detail.appendChild(this.buildMilestoneSection(member));

    // 人名單 Prospect List
    detail.appendChild(this.buildProspectListSection(member));

    // Remarks 備註 (combined)
    detail.appendChild(this.buildRemarksSection(member));

    container.appendChild(detail);
  },

  buildHeader(member) {
    const header = document.createElement("div");
    header.className = "member-header";

    // ── Status dropdown (top-right corner) ──────────────────────────────────
    const statusWrap = document.createElement("div");
    statusWrap.className = "member-status-wrap";

    const statusLabel = document.createElement("span");
    statusLabel.className = "member-status-label";
    statusLabel.textContent = "狀態:";
    statusWrap.appendChild(statusLabel);

    const statusSelect = document.createElement("select");
    statusSelect.className = "member-status-select";
    const statusOptions = [
      { value: "",       label: "—"      },
      { value: "Good",   label: "Good"   },
      { value: "Normal", label: "Normal" },
      { value: "Bad",    label: "Bad"    },
    ];
    statusOptions.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if ((member.status || "") === value) opt.selected = true;
      statusSelect.appendChild(opt);
    });

    // Apply colour class immediately and on change
    const applyStatusClass = (val) => {
      statusSelect.className = "member-status-select" +
        (val === "Good" ? " status-good" : val === "Normal" ? " status-normal" : val === "Bad" ? " status-bad" : "");
    };
    applyStatusClass(member.status || "");

    const statusFeedback = document.createElement("span");
    statusFeedback.className = "member-status-feedback";

    statusSelect.addEventListener("change", async () => {
      const val = statusSelect.value;
      applyStatusClass(val);
      statusFeedback.textContent = "";
      try {
        await DataService.saveStatus(member.id, val || null);
        member.status = val || null;
        statusFeedback.textContent = "✓";
        statusFeedback.className = "member-status-feedback success";
        setTimeout(() => { statusFeedback.textContent = ""; statusFeedback.className = "member-status-feedback"; }, 2000);
      } catch {
        statusFeedback.textContent = "✗";
        statusFeedback.className = "member-status-feedback error";
      }
    });

    statusWrap.appendChild(statusSelect);
    statusWrap.appendChild(statusFeedback);
    header.appendChild(statusWrap);

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
    this._appendTimetablePhoto(section, member.displayName, member.id);

    return section;
  },

  async _appendTimetablePhoto(section, displayName, memberId) {
    const candidates = [
      `${displayName}.jpeg`, `${displayName}.png`,
      `${memberId}.jpeg`,    `${memberId}.png`,
    ];
    for (const filename of candidates) {
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

    // List of existing remarks
    const list = document.createElement("div");
    list.className = "remarks-list";
    section.appendChild(list);

    const renderList = () => {
      list.innerHTML = "";
      (member.remarksList || []).forEach((text, idx) => {
        const row = document.createElement("div");
        row.className = "remarks-row";

        const span = document.createElement("span");
        span.className = "remarks-row-text";
        span.textContent = text;
        row.appendChild(span);

        const delBtn = document.createElement("button");
        delBtn.className = "remarks-del-btn";
        delBtn.innerHTML = "&#10005;";
        delBtn.title = "Delete";
        delBtn.addEventListener("click", async () => {
          const updated = (member.remarksList || []).filter((_, i) => i !== idx);
          try {
            await DataService.saveRemarksList(member.id, updated);
            member.remarksList = updated;
            renderList();
          } catch {
            // silent fail — row stays
          }
        });
        row.appendChild(delBtn);
        list.appendChild(row);
      });
    };
    renderList();

    // Add new remark
    const addRow = document.createElement("div");
    addRow.className = "remarks-add-row";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "remarks-input";
    input.placeholder = "Add a remark…";
    addRow.appendChild(input);

    const addBtn = document.createElement("button");
    addBtn.className = "remarks-add-btn";
    addBtn.innerHTML = "&#43;";
    addBtn.title = "Add";

    const doAdd = async () => {
      const val = input.value.trim();
      if (!val) return;
      const updated = [...(member.remarksList || []), val];
      try {
        await DataService.saveRemarksList(member.id, updated);
        member.remarksList = updated;
        input.value = "";
        renderList();
      } catch {
        // silent fail
      }
    };

    addBtn.addEventListener("click", doAdd);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

    addRow.appendChild(addBtn);
    section.appendChild(addRow);

    return section;
  },

  buildMilestoneSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "自爆，邀約，簽單";
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "milestone-grid";

    // ── 自爆 (own plan) — text field with tick ────────────────────────────
    const ownPlanBlock = document.createElement("div");
    ownPlanBlock.className = "milestone-item";

    const ownLabel = document.createElement("div");
    ownLabel.className = "milestone-label";
    ownLabel.textContent = "自爆";
    ownPlanBlock.appendChild(ownLabel);

    const ownInput = document.createElement("input");
    ownInput.type = "text";
    ownInput.className = "milestone-text-input";
    ownInput.placeholder = "e.g. 180 USD/month";
    ownInput.value = member.milestoneOwnPlan || "";
    ownPlanBlock.appendChild(ownInput);

    grid.appendChild(ownPlanBlock);

    // ── 邀約 + 簽單 — checkboxes ─────────────────────────────────────────
    [
      { key: "invites",   label: "邀約",  field: "milestoneInvites"  },
      { key: "signCase",  label: "簽單",  field: "milestoneSignCase" },
    ].forEach(({ label, field }) => {
      const block = document.createElement("div");
      block.className = "milestone-item";

      const lbl = document.createElement("div");
      lbl.className = "milestone-label";
      lbl.textContent = label;
      block.appendChild(lbl);

      const checkLabel = document.createElement("label");
      checkLabel.className = "milestone-check-label";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "milestone-checkbox";
      cb.checked = !!member[field];
      cb.dataset.field = field;
      checkLabel.appendChild(cb);
      const tick = document.createElement("span");
      tick.className = "milestone-check-text";
      tick.textContent = "完成";
      checkLabel.appendChild(tick);
      block.appendChild(checkLabel);

      grid.appendChild(block);
    });

    section.appendChild(grid);

    // Save button
    const footer = document.createElement("div");
    footer.className = "prospect-footer";

    const saveBtn = document.createElement("button");
    saveBtn.className = "admin-notes-save-btn";
    saveBtn.textContent = "Save";
    footer.appendChild(saveBtn);

    const feedback = document.createElement("span");
    feedback.className = "admin-notes-feedback";
    footer.appendChild(feedback);
    section.appendChild(footer);

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
      feedback.textContent = "";
      feedback.className = "admin-notes-feedback";
      try {
        const invitesCb  = grid.querySelector('[data-field="milestoneInvites"]');
        const signCb     = grid.querySelector('[data-field="milestoneSignCase"]');
        const ownPlan    = ownInput.value.trim() || null;
        const invites    = invitesCb.checked;
        const signCase   = signCb.checked;
        await DataService.saveMilestones(member.id, { ownPlan, invites, signCase });
        member.milestoneOwnPlan  = ownPlan;
        member.milestoneInvites  = invites;
        member.milestoneSignCase = signCase;
        feedback.textContent = "Saved ✓";
        feedback.classList.add("success");
      } catch {
        feedback.textContent = "Failed to save";
        feedback.classList.add("error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
        setTimeout(() => { feedback.textContent = ""; feedback.className = "admin-notes-feedback"; }, 3000);
      }
    });

    return section;
  },

  buildProspectListSection(member) {
    const section = document.createElement("div");
    section.className = "detail-section";

    const title = document.createElement("h3");
    title.textContent = "人名單 Prospect List";
    section.appendChild(title);

    const row = document.createElement("div");
    row.className = "prospect-list-row";

    // Tick checkbox (toggle done)
    const tickLabel = document.createElement("label");
    tickLabel.className = "prospect-tick-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "prospect-tick-checkbox";
    checkbox.checked = !!member.prospectListDone;

    const tickText = document.createElement("span");
    tickText.textContent = "已完成";

    tickLabel.appendChild(checkbox);
    tickLabel.appendChild(tickText);
    row.appendChild(tickLabel);

    // URL input
    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.className = "prospect-url-input";
    urlInput.placeholder = "Google Sheets link…";
    urlInput.value = member.prospectListUrl || "";
    row.appendChild(urlInput);

    // Open link button (visible when URL is set)
    const openBtn = document.createElement("a");
    openBtn.className = "prospect-open-btn" + (member.prospectListUrl ? "" : " hidden");
    openBtn.textContent = "Open ↗";
    openBtn.target = "_blank";
    openBtn.rel = "noopener noreferrer";
    openBtn.href = member.prospectListUrl || "#";
    row.appendChild(openBtn);

    section.appendChild(row);

    // Save button + feedback
    const footer = document.createElement("div");
    footer.className = "prospect-footer";

    const saveBtn = document.createElement("button");
    saveBtn.className = "admin-notes-save-btn";
    saveBtn.textContent = "Save";
    footer.appendChild(saveBtn);

    const feedback = document.createElement("span");
    feedback.className = "admin-notes-feedback";
    footer.appendChild(feedback);
    section.appendChild(footer);

    // Update open button visibility on URL input
    urlInput.addEventListener("input", () => {
      const v = urlInput.value.trim();
      openBtn.href = v || "#";
      openBtn.classList.toggle("hidden", !v);
    });

    saveBtn.addEventListener("click", async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";
      feedback.textContent = "";
      feedback.className = "admin-notes-feedback";
      try {
        const done = checkbox.checked;
        const url  = urlInput.value.trim() || null;
        await DataService.saveProspectList(member.id, done, url);
        member.prospectListDone = done;
        member.prospectListUrl  = url;
        openBtn.href = url || "#";
        openBtn.classList.toggle("hidden", !url);
        feedback.textContent = "Saved ✓";
        feedback.classList.add("success");
      } catch {
        feedback.textContent = "Failed to save";
        feedback.classList.add("error");
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
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
