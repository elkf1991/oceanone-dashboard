/**
 * Ocean One Dashboard — App Controller
 * Hash-based SPA router, authentication, sidebar logic
 */

const App = {
  AUTH_KEY: "oceanone_auth",
  VALID_USER: "admin",
  VALID_PASS: "oceanone168",

  /**
   * Initialize the app
   */
  init() {
    this.bindEvents();
    this.handleRoute();
  },

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Login form
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.addEventListener("click", () => {
      this.handleLogout();
    });

    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("open");
    });

    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("open");
    });

    // Sidebar nav items
    document.querySelectorAll(".nav-item:not(.disabled)").forEach((item) => {
      item.addEventListener("click", () => {
        // Close mobile sidebar
        sidebar.classList.remove("open");
        overlay.classList.remove("open");
      });
    });

    // Hash change (routing)
    window.addEventListener("hashchange", () => {
      this.handleRoute();
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return sessionStorage.getItem(this.AUTH_KEY) === "true";
  },

  /**
   * Handle login form submission
   */
  handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("login-error");
    const container = document.querySelector(".login-container");

    if (username === this.VALID_USER && password === this.VALID_PASS) {
      sessionStorage.setItem(this.AUTH_KEY, "true");
      errorEl.hidden = true;
      window.location.hash = "#orgchart";
    } else {
      errorEl.hidden = false;
      container.classList.add("login-shake");
      setTimeout(() => container.classList.remove("login-shake"), 400);
    }
  },

  /**
   * Handle logout
   */
  handleLogout() {
    sessionStorage.removeItem(this.AUTH_KEY);
    window.location.hash = "#login";
  },

  /**
   * Route based on current hash
   */
  handleRoute() {
    const hash = window.location.hash || "#login";
    const loginPage = document.getElementById("login-page");
    const dashboardPage = document.getElementById("dashboard-page");
    const mainContent = document.getElementById("main-content");

    // Not authenticated → force login
    if (!this.isAuthenticated() && hash !== "#login") {
      window.location.hash = "#login";
      return;
    }

    // Authenticated but on login page → go to dashboard
    if (this.isAuthenticated() && (hash === "#login" || hash === "" || hash === "#")) {
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

    // Clear main content
    mainContent.innerHTML = "";

    // Route to correct tab/page
    if (hash === "#orgchart" || hash === "#dashboard") {
      this.setActiveNav("orgchart");
      this.renderOrgChart(mainContent);
    } else if (hash.startsWith("#member/")) {
      const memberId = hash.split("/")[1];
      this.setActiveNav("orgchart");
      MemberDetail.render(mainContent, memberId);
    } else {
      // Default to org chart
      window.location.hash = "#orgchart";
    }
  },

  /**
   * Update active state in sidebar navigation
   */
  setActiveNav(tab) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      const itemTab = item.getAttribute("data-tab");
      if (itemTab === tab) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  },

  /**
   * Render the org chart tab
   */
  renderOrgChart(container) {
    // Header
    const header = document.createElement("div");
    header.className = "content-header";
    header.innerHTML = "<h2>Org Chart 組織架構</h2><p>Click on a teammate to view details · 點擊查看詳情</p>";
    container.appendChild(header);

    // Org chart
    OrgChart.render(container);
  }
};

// Start the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
