/* Helix EMR Template - Shared Components */

// Template configurations
const TEMPLATE_CONFIG = {
  user: {
    name: "Dr. A. Kumar",
    role: "Physician",
    initials: "AK"
  },
  brand: {
    name: "Helix EMR",
    logo: "HE"
  }
};

// Generate navbar HTML
function generateNavbar() {
  return `
    <nav class="navbar">
      <a href="dashboard.html" class="navbar-brand">
        <div class="navbar-logo">${TEMPLATE_CONFIG.brand.logo}</div>
        <h1 class="navbar-title">${TEMPLATE_CONFIG.brand.name}</h1>
      </a>

      <div class="navbar-actions">
        <div class="navbar-search" role="search">
          <i class='bx bx-search' style="color:var(--muted)"></i>
          <input id="navbar-search" placeholder="Search patients..." />
        </div>

        <div class="user-profile">
          <div class="user-avatar">${TEMPLATE_CONFIG.user.initials}</div>
          <div class="user-info">
            <div class="user-name">${TEMPLATE_CONFIG.user.name}</div>
            <div class="user-role">${TEMPLATE_CONFIG.user.role}</div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// Generate sidebar HTML
function generateSidebar(activePage = '') {
  const navItems = [
    { page: 'dashboard', icon: 'bx-grid-alt', title: 'Dashboard' },
    { page: 'visits', icon: 'bx-user', title: 'Patient Visits' },
    { page: 'appointments', icon: 'bx-calendar', title: 'Appointments' },
    { page: 'settings', icon: 'bx-cog', title: 'Settings' }
  ];

  const navItemsHTML = navItems.map(item =>
    `<a href="#${item.page}" data-page="${item.page}" class="nav-item ${activePage === item.page ? 'active' : ''}" title="${item.title}">
      <i class='bx ${item.icon}'></i>
    </a>`
  ).join('');

  return `
    <aside class="sidebar" aria-label="Main">
      <nav class="nav" role="tablist" aria-label="Sections">
        ${navItemsHTML}
      </nav>

      <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
        <button class="nav-item" id="logout-btn" title="Logout" style="width:56px;height:56px;border-radius:12px;border:0;background:var(--panel);box-shadow:0 6px 14px rgba(15,23,36,0.06);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted);transition:all 0.2s ease;">
          <i class='bx bx-log-out' style="font-size:24px"></i>
        </button>
        <div style="font-size:12px;color:var(--muted)">v1.0</div>
      </div>
    </aside>
  `;
}
// Generate chatbot HTML
function generateChatbot() {
  return `
    <div class="chat-toggle">
      <div id="chat-panel" class="chat-panel" role="dialog" aria-label="Chatbot">
        <div class="chat-header">
          <div style="display:flex;gap:10px;align-items:center">
            <i class='bx bx-comment-detail' style="font-size:20px"></i>
            <div>
              <div style="font-weight:700">Helix Assistant</div>
              <div style="color:var(--muted);font-size:12px">Help & navigation</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn ghost" id="clear-chat">Clear</button>
            <button class="btn ghost" id="close-chat">✕</button>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages">
          <div class="msg bot">Hi — I'm Helix Assistant. Try: "Show today's appointments" or "Open John Doe".</div>
        </div>
        <div class="chat-input">
          <input id="chat-input" placeholder="Type a message..."/>
          <button class="btn" id="send-chat">Send</button>
        </div>
      </div>

      <button id="chat-toggle-btn" class="chat-btn" aria-expanded="false" aria-controls="chat-panel" title="Open chat">
        <i class='bx bx-chat' style="font-size:22px"></i>
      </button>
    </div>
  `;
}

// Initialize template components
function initTemplate(activePage = '', includeApp = true) {
  // Insert navbar
  const navbarPlaceholder = document.getElementById('navbar-placeholder');
  if (navbarPlaceholder) {
    navbarPlaceholder.innerHTML = generateNavbar();
  }

  // Insert sidebar (only for pages with app layout)
  if (includeApp) {
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
      sidebarPlaceholder.innerHTML = generateSidebar(activePage);
      // Add navigation event listeners for SPA routing
      initSPANavigation();
    }
  }

  // Insert chatbot
  const chatbotPlaceholder = document.getElementById('chatbot-placeholder');
  if (chatbotPlaceholder) {
    chatbotPlaceholder.innerHTML = generateChatbot();
  }

  // Initialize chat functionality
  initChat();
}

// Initialize SPA navigation
function initSPANavigation() {
  document.querySelectorAll('.nav a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.currentTarget.dataset.page;
      if (typeof router !== 'undefined') {
        router.navigateTo(page);
      } else {
        // Fallback to traditional navigation if router not available
        window.location.href = `${page}.html`;
      }
    });
  });
}

// Chat functionality
function initChat() {
  const chatToggleBtn = document.getElementById('chat-toggle-btn');
  const chatPanel = document.getElementById('chat-panel');
  const closeChatBtn = document.getElementById('close-chat');
  const sendBtn = document.getElementById('send-chat');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const clearChat = document.getElementById('clear-chat');

  function toggleChat(open){
    const isOpen = chatPanel && chatPanel.classList.contains('open');
    if(open===undefined) open = !isOpen;
    if(open && chatPanel){
      chatPanel.classList.add('open');
      if(chatToggleBtn) chatToggleBtn.setAttribute('aria-expanded','true');
      setTimeout(()=>chatInput && chatInput.focus(),180);
    }
    else if(chatPanel) {
      chatPanel.classList.remove('open');
      if(chatToggleBtn) chatToggleBtn.setAttribute('aria-expanded','false');
    }
  }

  if(chatToggleBtn) chatToggleBtn.addEventListener('click', ()=> toggleChat());
  if(closeChatBtn) closeChatBtn.addEventListener('click', ()=> toggleChat(false));
  if(clearChat) clearChat.addEventListener('click', ()=> {
    if(chatMessages) chatMessages.innerHTML = '<div class="msg bot">Hi — I am Helix Assistant. Ask me to find patients or appointments.</div>';
  });

  function appendMessage(text, who='bot'){
    if(!chatMessages) return;
    const m = document.createElement('div');
    m.className = 'msg ' + (who==='bot'?'bot':'user');
    m.innerText = text;
    chatMessages.appendChild(m);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function botRespond(input){
    const q = input.trim().toLowerCase();
    if(!q) return "I'm here when you need me.";
    if(q.includes('appointments')) return "Today's appointments are listed on the Dashboard.";
    if(q.includes('john')) return "Opening John Doe's patient page.";
    return "Try: 'Show today's appointments' or 'Open John Doe'.";
  }

  if(sendBtn) sendBtn.addEventListener('click', ()=>{
    const val = chatInput && chatInput.value.trim();
    if(!val) return;
    appendMessage(val,'user');
    if(chatInput) chatInput.value='';
    setTimeout(()=> appendMessage(botRespond(val),'bot'), 300+Math.random()*300);
  });

  if(chatInput) chatInput.addEventListener('keydown', (e)=>{
    if(e.key==='Enter' && !e.shiftKey){
      e.preventDefault();
      if(sendBtn) sendBtn.click();
    }
  });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initTemplate, generateNavbar, generateSidebar, generateChatbot };
}