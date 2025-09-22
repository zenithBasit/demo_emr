/* Helix EMR SPA Router */

class HelixRouter {
  constructor() {
    this.routes = {};
    this.currentPage = '';
    this.contentContainer = null;
    this.init();
  }

  init() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const path = e.state ? e.state.page : this.getPathFromUrl();
      this.loadPage(path, false); // false = don't push to history
    });

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.contentContainer = document.getElementById('spa-content');
      const initialPage = this.getPathFromUrl() || 'dashboard';
      this.loadPage(initialPage, false);
    });
  }

  // Register page content and functionality
  registerRoute(path, config) {
    this.routes[path] = {
      title: config.title,
      template: config.template,
      render: config.render,
      init: config.init || (() => {}),
      cleanup: config.cleanup || (() => {})
    };
  }

  // Get current page from URL hash
  getPathFromUrl() {
    const hash = window.location.hash.slice(1);
    return hash || 'dashboard';
  }

  // Navigate to a page
  navigateTo(page, pushHistory = true) {
    if (page === this.currentPage) return;
    this.loadPage(page, pushHistory);
  }

  // Load page content
  async loadPage(page, pushHistory = true) {
    const route = this.routes[page];
    if (!route) {
      console.error(`Route not found: ${page}`);
      return;
    }

    // Cleanup current page
    if (this.routes[this.currentPage]?.cleanup) {
      this.routes[this.currentPage].cleanup();
    }

    // Add loading state
    if (this.contentContainer) {
      this.contentContainer.style.opacity = '0.7';
      this.contentContainer.style.transition = 'opacity 0.2s ease';
    }

    try {
      // Load HTML template if available
      let htmlContent = '';
      if (route.template) {
        const response = await fetch(route.template);
        if (response.ok) {
          htmlContent = await response.text();
        } else {
          console.error(`Failed to load template: ${route.template}`);
          // Fallback for file:// CORS — redirect to legacy multipage route
          if (location.protocol === 'file:') {
            const legacy = page === 'dashboard' ? 'dashboard' : page;
            window.location.href = `${legacy}.html`;
            return;
          }
          htmlContent = '<div style="padding:20px;text-align:center;color:var(--muted)">Page not found</div>';
        }
      } else if (route.render) {
        // Fallback to render function for backward compatibility
        htmlContent = route.render();
      } else {
        htmlContent = '<div style="padding:20px;text-align:center;color:var(--muted)">No content available</div>';
      }

      // Update URL and history
      if (pushHistory) {
        const url = page === 'dashboard' ? '#' : `#${page}`;
        window.history.pushState({ page }, route.title, url);
      }

      // Update page title
      document.title = route.title;

      // Render new page content
      if (this.contentContainer) {
        this.contentContainer.innerHTML = htmlContent;
        this.contentContainer.style.opacity = '1';
      }

      // Update active states in navigation
      this.updateActiveStates(page);

      // Initialize page functionality
      setTimeout(() => {
        route.init();
      }, 50);

      this.currentPage = page;
    } catch (error) {
      console.error(`Error loading page ${page}:`, error);
      // Fallback for file:// CORS — redirect to legacy multipage route
      if (location.protocol === 'file:') {
        const legacy = page === 'dashboard' ? 'dashboard' : page;
        window.location.href = `${legacy}.html`;
        return;
      }
      if (this.contentContainer) {
        this.contentContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted)">Error loading page</div>';
        this.contentContainer.style.opacity = '1';
      }
    }
  }

  // Update active states in sidebar
  updateActiveStates(activePage) {
    // Update sidebar active states
    document.querySelectorAll('.nav a').forEach(link => {
      link.classList.remove('active');
      if (link.dataset.page === activePage) {
        link.classList.add('active');
      }
    });

    // Update page title
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
      const titles = {
        dashboard: 'Dashboard',
        visits: 'Visits',
        appointments: 'Appointments',
        settings: 'Settings'
      };
      titleElement.textContent = titles[activePage] || 'Dashboard';
    }
  }
}

// Page content definitions
const PageContent = {
  dashboard: {
    title: 'Helix EMR — Dashboard',
    template: 'templates/dashboard.html',
    init: () => {
      try {
        if (typeof renderTodaysAppointmentsOnDashboard === 'function') {
          renderTodaysAppointmentsOnDashboard();
        }
      } catch(e) {}
    }
  },

  visits: {
    title: 'Helix EMR — Patient Visits',
    template: 'templates/visits.html',
    init: () => {
      const addVisitBtn = document.getElementById('add-visit');
      if (addVisitBtn) {
        addVisitBtn.addEventListener('click', () => {
          alert('Open new visit modal (mock) — integrate your form here.');
        });
      }

      const filter = document.getElementById('filter-visits');
      if (filter) {
        filter.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase();
          document.querySelectorAll('#visits-body tr').forEach(tr =>
            tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none'
          );
        });
      }
    }
  },

  appointments: {
    title: 'Helix EMR — Appointments',
    template: 'templates/appointments.html',
    init: () => {
      if (typeof initAppointmentsPage === 'function') { initAppointmentsPage(); }
    }
  },

  settings: {
    title: 'Helix EMR — Settings',
    template: 'templates/settings.html',
    init: () => {
      // No specific initialization needed for settings page
    }
  },

  patient: {
    title: 'Patient — Helix EMR',
    template: 'templates/patient.html',
    init: () => {
      // Initialize patient page functionality
      if (typeof initPatientPage === 'function') {
        initPatientPage();
      }
    }
  }
};

// Initialize router
const router = new HelixRouter();

// Register all routes
Object.keys(PageContent).forEach(page => {
  router.registerRoute(page, PageContent[page]);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HelixRouter, router };
}