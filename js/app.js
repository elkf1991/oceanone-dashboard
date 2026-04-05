/**
 * Ocean One Dashboard — App Controller
 * Hash-based SPA router, Supabase authentication, sidebar logic.
 */

const App = {
  // Cached data loaded after login
  _members:  null,
  _orgTree:  null,

  init() {
    this.bindEvents();
    this.handleRoute();
  },

  bindEvents() {
    // Login form
    document.getElementById("login-form")
      .addEventListener("submit", (e) => { e.preventDefault(); this.handleLogin(); });

    // Logout button
    document.getElementById("logout-btn")
      .addEventListener("click", () => this.handleLogout());

    // Mobile sidebar toggle
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    document.getElementById("sidebar-toggle").addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });

    document.querySelectorAll(".nav-item:not(.disabled)").forEach((item) => {
      item.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
      });
    });

    // Hash change
    window.addEventListener("hashchange", () => this.handleRoute());
  },

  async handleLogin() {
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorEl  = document.querySelector(".login-error");
    const container = document.querySelector(".login-container");
    const btn       = document.querySelector(".login-btn");

    btn.disabled = true;
    btn.textContent = "Logging in...";
    errorEl.hidden = true;

    let loginError;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      loginError = error;
    } catch (e) {
      loginError = e;
    }

    btn.disabled = false;
    btn.textContent = "Login";

    if (loginError) {
      errorEl.hidden = false;
      errorEl.textContent = loginError.message || "Login failed. Please try again.";
      container.classList.add("login-shake");
      setTimeout(() => container.classList.remove("login-shake"), 400);
      return;
    }

    // Load data then navigate
    await this.loadData();
    window.location.hash = "#orgchart";
  },

  async handleLogout() {
    await supabase.auth.signOut();
    this._members = null;
    this._orgTree = null;
    window.location.hash = "#login";
  },

  async loadData() {
    try {
      const { members, orgTree } = await DataService.loadAll();
      this._members  = members;
      this._orgTree  = orgTree;
    } catch (err) {
      console.error("Data load failed:", err);
    }
  },

  async handleRoute() {
    const hash = window.location.hash || "#login";
    const loginPage     = document.getElementById("login-page");
    const dashboardPage = document.getElementById("dashboard-page");
    const mainContent   = document.getElementById("main-content");

    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session && hash !== "#login") {
      window.location.hash = "#login";
      return;
    }

    if (session && (hash === "#login" || hash === "" || hash === "#")) {
      window.location.hash = "#orgchart";
      return;
    }

    if (hash === "#login") {
      loginPage.hidden = false;
      dashboardPage.hidden = true;
      return;
    }

    // Show dashboard
    loginPage.hidden = true;
    dashboardPage.hidden = false;

    // Ensure data is loaded
    if (!this._members) {
      mainContent.innerHTML = '<div style="padding:40px;color:var(--text-muted)">Loading...</div>';
      await this.loadData();
    }

    mainContent.innerHTML = "";

    if (!this._members) {
      mainContent.innerHTML =
        '<div style="padding:40px;color:var(--text-muted)">Could not load team data. Check the browser console and your Supabase connection, then refresh.</div>';
      return;
    }

    if (hash === "#orgchart" || hash === "#dashboard") {
      this.setActiveNav("orgchart");
      mainContent.classList.add("main-content--fit-org");
      const header = document.createElement("div");
      header.className = "content-header";
      header.innerHTML = "<h2>Org Chart 組織架構</h2><p>Click on a teammate to view details · 點擊查看詳情</p>";
      mainContent.appendChild(header);
      OrgChart.render(mainContent, { members: this._members, orgTree: this._orgTree });
    } else if (hash.startsWith("#member/")) {
      const memberId = hash.split("/")[1];
      this.setActiveNav("orgchart");
      mainContent.classList.remove("main-content--fit-org");
      MemberDetail.render(mainContent, memberId, this._members);
    } else if (hash === "#training") {
      this.setActiveNav("training");
      mainContent.classList.remove("main-content--fit-org");
      Training.render(mainContent, { members: this._members, orgTree: this._orgTree });
    } else if (hash === "#leads") {
      this.setActiveNav("leads");
      mainContent.classList.remove("main-content--fit-org");
      Leads.render(mainContent, { members: this._members });
    } else if (hash === "#exam") {
      this.setActiveNav("exam");
      mainContent.classList.remove("main-content--fit-org");
      Exam.render(mainContent, { members: this._members, orgTree: this._orgTree });
    } else if (hash === "#prospectlist") {
      this.setActiveNav("prospectlist");
      mainContent.classList.remove("main-content--fit-org");
      ProspectList.render(mainContent, { members: this._members, orgTree: this._orgTree });
    } else {
      window.location.hash = "#orgchart";
    }
  },

  setActiveNav(tab) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.getAttribute("data-tab") === tab);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
