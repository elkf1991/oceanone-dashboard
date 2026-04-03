/**
 * Ocean One Dashboard — Data Service
 * Fetches team data from Supabase and builds the structures
 * that OrgChart and MemberDetail expect.
 */

const DataService = {
  /** Shared labels for L1–L5 (+ 自爆); single definition avoids duplicate `const` across script files. */
  TRAINING_LIST: {
    L1: { name: "心態 Training", durationHrs: 3 },
    L2: { name: "Product Training", durationHrs: 2 },
    L3: { name: "CDP, Career Development Planning", durationHrs: 2, note: "一人一節" },
    L4: { name: "講 Plan Training", durationHrs: 2 },
    L5: { name: "邀約 Training", durationHrs: 2 },
    自爆: { name: "自己買一份儲蓄保險", durationHrs: null }
  },

  /**
   * Load all data from Supabase.
   * Returns { members, orgTree } ready for OrgChart and MemberDetail.
   */
  async loadAll() {
    const [teammatesRes, orgRes] = await Promise.all([
      supabase.from("teammates").select("*").order("sort_order"),
      supabase.from("org_nodes").select("*").order("sort_order")
    ]);

    if (teammatesRes.error) throw new Error("Failed to load teammates: " + teammatesRes.error.message);
    if (orgRes.error) throw new Error("Failed to load org structure: " + orgRes.error.message);

    // Build MEMBERS map: id → normalised member object
    const members = {};
    for (const row of teammatesRes.data) {
      members[row.id] = this._normaliseMember(row);
    }

    // Build ORG_TREE from org_nodes
    const orgTree = this._buildOrgTree(orgRes.data, members);

    return { members, orgTree, trainingList: this.TRAINING_LIST };
  },

  /**
   * Save admin notes for a teammate.
   */
  async saveNotes(memberId, notes) {
    const { error } = await supabase
      .from("teammates")
      .update({ admin_notes: notes })
      .eq("id", memberId);
    if (error) throw new Error(error.message);
  },

  /**
   * Normalise a Supabase row into the shape the UI expects
   * (camelCase, same as the old team.js format).
   */
  _normaliseMember(row) {
    const asArray = (v) => (Array.isArray(v) ? v : []);
    const asObject = (v) =>
      v && typeof v === "object" && !Array.isArray(v) ? v : {};

    return {
      id:                 row.id,
      displayName:        row.display_name,
      fullName:           row.full_name,
      contact:            row.contact,
      background:         row.background,
      interviewDate:      row.interview_date,
      trainingCompleted:  asArray(row.training_completed),
      trainingScheduled:  asObject(row.training_scheduled),
      trainingPending:    asArray(row.training_pending),
      exam:               asObject(row.exam),
      accomplishment:     asObject(row.accomplishment),
      availabilityType:   row.availability_type,
      timetable:          row.timetable && typeof row.timetable === "object" ? row.timetable : null,
      remarks:            row.remarks,
      adminNotes:         row.admin_notes
    };
  },

  /**
   * Build a recursive org tree from flat org_nodes rows.
   * Returns the root node with nested children arrays.
   */
  _buildOrgTree(rows, members) {
    // Build a map for quick lookup
    const nodeMap = {};
    for (const row of rows) {
      nodeMap[row.id] = {
        id:          row.id,
        displayName: row.display_name,
        role:        row.role,
        children:    []
      };
    }

    let root = null;
    for (const row of rows) {
      if (!row.parent_id) {
        root = nodeMap[row.id];
      } else if (nodeMap[row.parent_id]) {
        nodeMap[row.parent_id].children.push(nodeMap[row.id]);
      }
    }

    return root;
  }
};
