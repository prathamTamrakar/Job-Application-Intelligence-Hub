// JobIntelHub - Content Script
console.log('JobIntelHub content script loaded.');

// 1. Session Syncing: Share JWT token from web dashboard (localhost:5173) with extension
if (window.location.host === 'localhost:5173') {
  const syncSession = () => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode user details from token if needed, or send simple sync
      chrome.runtime.sendMessage({
        action: 'saveToken',
        token: token,
        user: { name: 'Dashboard User' } // Background will verify on me request
      }, (response) => {
        if (response?.success) {
          console.log('JobIntelHub extension authenticated via dashboard sync.');
        }
      });
    } else {
      // User logged out on dashboard, clear extension token
      chrome.runtime.sendMessage({ action: 'clearToken' });
    }
  };
  
  // Sync on load and listen for storage changes
  syncSession();
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      syncSession();
    }
  });
}

// 2. Job Boards Injection & Scrapers
const shouldInjectButton = () => {
  const url = window.location.href;
  // Exclude our dashboard page
  if (url.includes('localhost:5173')) {
    return false;
  }
  return true;
};

if (shouldInjectButton()) {
  initExtensionUI();
}

function scrapeJobDetails() {
  const url = window.location.href;
  let company = '';
  let role = '';
  let jobLink = url.split('?')[0]; // Clean query parameters for a cleaner link

  if (url.includes('linkedin.com')) {
    // LinkedIn Scraper selectors (checked for modern layout)
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1, h2');
    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name, .jobs-description__company-name');
    
    role = titleEl ? titleEl.innerText.trim() : '';
    company = companyEl ? companyEl.innerText.trim() : '';
    
    // Clean company name (often has extra details or reviews)
    if (company) {
      company = company.split('\n')[0].replace('·', '').trim();
    }
  } else if (url.includes('greenhouse.io')) {
    // Greenhouse Scraper selectors
    const titleEl = document.querySelector('.app-title, h1');
    const companyEl = document.querySelector('.company-name');
    
    role = titleEl ? titleEl.innerText.trim() : '';
    company = companyEl ? companyEl.innerText.trim().replace('at ', '') : '';
    
    if (!company) {
      // Fallback: parse from page title
      const match = document.title.match(/(.*) at (.*)/);
      if (match) {
        role = match[1].trim();
        company = match[2].trim();
      }
    }
  } else if (url.includes('lever.co')) {
    // Lever Scraper selectors
    const titleEl = document.querySelector('.posting-header h2, h2');
    
    role = titleEl ? titleEl.innerText.trim() : '';
    
    // Parse company from title (Lever page title: "Company Name - Job Title - Lever")
    const titleParts = document.title.split(' - ');
    if (titleParts.length >= 2) {
      company = titleParts[0].trim();
      if (!role) role = titleParts[1].trim();
    } else {
      company = 'Lever Job Posting';
    }
  } else if (url.includes('naukri.com')) {
    // Naukri Scraper
    const titleEl = document.querySelector('.jd-header-title, h1.title, h1');
    const companyEl = document.querySelector('.jd-header-comp-name a, .company-name, .comp-info-detail a, a.pad-rt-8');
    
    role = titleEl ? titleEl.innerText.trim() : '';
    company = companyEl ? companyEl.innerText.trim() : '';

    // Clean reviews / ratings text (e.g. "Amazon 4.2 (132 reviews)" -> "Amazon")
    if (company) {
      company = company.split(/[\d\.]+\s*\(/)[0].trim();
      company = company.split('\n')[0].trim();
    }
  } else if (url.includes('indeed.com')) {
    // Indeed Scraper
    const titleEl = document.querySelector('h1.jobsearch-JobInfoHeader-title, h1');
    const companyEl = document.querySelector('div.jobsearch-CompanyInfoContainer a, [data-company-name="true"], .jobsearch-InlineCompanyRating a');
    role = titleEl ? titleEl.innerText.trim() : '';
    company = companyEl ? companyEl.innerText.trim() : '';
  } else if (url.includes('instahyre.com')) {
    // Instahyre Scraper
    const titleEl = document.querySelector('.position-title, h1');
    const companyEl = document.querySelector('.company-name, h2');
    role = titleEl ? titleEl.innerText.trim() : '';
    company = companyEl ? companyEl.innerText.trim().replace('at ', '') : '';
  } else {
    // Fallback best-effort scraper for other websites (Indeed, Wellfound, Naukri, Glassdoor, etc.)
    const titleEl = document.querySelector('h1');
    role = titleEl ? titleEl.innerText.trim() : document.title;
    
    // Try to extract company name from metadata
    const metaCompany = document.querySelector('meta[property="og:site_name"], meta[name="author"]');
    company = metaCompany ? metaCompany.content.trim() : '';
    
    if (!company) {
      const titleParts = document.title.split(/ [-\|] /);
      if (titleParts.length >= 2) {
        company = titleParts[0].trim();
        if (company.toLowerCase().includes('job') || company.toLowerCase().includes('career')) {
          company = titleParts[1].trim();
        }
      } else {
        const host = window.location.hostname;
        company = host.replace('www.', '').split('.')[0];
      }
    }
  }

  return { company, role, jobLink };
}

function initExtensionUI() {
  // Prevent duplicate mounts
  if (document.getElementById('jobintel-root')) return;

  const rootContainer = document.createElement('div');
  rootContainer.id = 'jobintel-root';
  document.body.appendChild(rootContainer);

  const shadow = rootContainer.attachShadow({ mode: 'closed' });

  // Injected CSS for Shadow DOM style isolation
  const style = document.createElement('style');
  style.textContent = `
    .floating-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      letter-spacing: -0.01em;
    }
    
    .floating-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(99, 102, 241, 0.5);
    }

    .floating-btn:active {
      transform: translateY(0);
    }

    .floating-btn svg {
      width: 16px;
      height: 16px;
    }

    .drawer {
      position: fixed;
      top: 0;
      right: -380px;
      width: 340px;
      height: 100vh;
      background: #18181b;
      color: #f4f4f5;
      box-shadow: -4px 0 30px rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      transition: right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #27272a;
    }

    .drawer.open {
      right: 0;
    }

    .drawer-header {
      padding: 20px;
      border-bottom: 1px solid #27272a;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #121214;
    }

    .drawer-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: white;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #a1a1aa;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: white;
    }

    .drawer-body {
      padding: 20px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a1a1aa;
    }

    .form-group input, .form-group select, .form-group textarea {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
      color: #e4e4e7;
      font-size: 13px;
      transition: border-color 0.2s;
    }

    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
    }

    .form-group textarea {
      resize: none;
      height: 80px;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    .btn {
      flex: 1;
      padding: 11px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-align: center;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }

    .btn-primary:hover {
      opacity: 0.95;
    }

    .btn-secondary {
      background: #27272a;
      color: #d4d4d8;
      border: 1px solid #3f3f46;
    }

    .btn-secondary:hover {
      background: #3f3f46;
    }

    .toast {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.error {
      background: #ef4444;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  `;

  // Draw extension UI Structure
  const shadowRoot = document.createElement('div');
  shadowRoot.innerHTML = `
    <button class="floating-btn" id="jobintel-fab">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Log to JobIntel
    </button>

    <div class="drawer" id="jobintel-drawer">
      <div class="drawer-header">
        <h3>Log Application</h3>
        <button class="close-btn" id="jobintel-close">&times;</button>
      </div>
      <div class="drawer-body">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" id="jobintel-company" placeholder="e.g. Google">
        </div>
        <div class="form-group">
          <label>Position / Role</label>
          <input type="text" id="jobintel-role" placeholder="e.g. Software Engineer">
        </div>
        <div class="form-group">
          <label>Job Posting URL</label>
          <input type="text" id="jobintel-url" readonly>
        </div>
        <div class="form-group">
          <label>Resume Version Used</label>
          <input type="text" id="jobintel-resume" value="Default" placeholder="e.g. Resume_SDE_V2">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="jobintel-status">
            <option value="Applied">Applied</option>
            <option value="OA">OA</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
          </select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="jobintel-notes" placeholder="Log details, referrals, salary structure..."></textarea>
        </div>
        <div class="actions">
          <button class="btn btn-secondary" id="jobintel-cancel">Cancel</button>
          <button class="btn btn-primary" id="jobintel-submit">Sync Application</button>
        </div>
      </div>
      <div class="toast" id="jobintel-toast">Logged Successfully!</div>
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(shadowRoot);

  // Setup DOM Elements
  const fab = shadow.getElementById('jobintel-fab');
  const drawer = shadow.getElementById('jobintel-drawer');
  const closeBtn = shadow.getElementById('jobintel-close');
  const cancelBtn = shadow.getElementById('jobintel-cancel');
  const submitBtn = shadow.getElementById('jobintel-submit');
  const toast = shadow.getElementById('jobintel-toast');

  // Input Elements
  const companyInput = shadow.getElementById('jobintel-company');
  const roleInput = shadow.getElementById('jobintel-role');
  const urlInput = shadow.getElementById('jobintel-url');
  const resumeInput = shadow.getElementById('jobintel-resume');
  const statusSelect = shadow.getElementById('jobintel-status');
  const notesText = shadow.getElementById('jobintel-notes');

  const showToast = (message, isError = false) => {
    toast.innerText = message;
    if (isError) {
      toast.classList.add('error');
    } else {
      toast.classList.remove('error');
    }
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  };

  // Toggle drawer and scrape details on click
  fab.addEventListener('click', () => {
    // Check if user is authenticated first
    chrome.runtime.sendMessage({ action: 'getToken' }, (res) => {
      if (!res?.token) {
        showToast('Please log in using the JobIntel extension popup first.', true);
        return;
      }
      
      const details = scrapeJobDetails();
      companyInput.value = details.company;
      roleInput.value = details.role;
      urlInput.value = details.jobLink;
      
      drawer.classList.add('open');
    });
  });

  const closeDrawer = () => {
    drawer.classList.remove('open');
  };

  closeBtn.addEventListener('click', closeDrawer);
  cancelBtn.addEventListener('click', closeDrawer);

  submitBtn.addEventListener('click', () => {
    const data = {
      company: companyInput.value.trim(),
      role: roleInput.value.trim(),
      jobLink: urlInput.value.trim(),
      resumeVersion: resumeInput.value.trim() || 'Default',
      status: statusSelect.value,
      notes: notesText.value.trim()
    };

    if (!data.company || !data.role) {
      showToast('Company and Role are required.', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = 'Syncing...';

    chrome.runtime.sendMessage({
      action: 'logApplication',
      data: data
    }, (response) => {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Sync Application';

      if (response && response.success) {
        showToast('Application logged!');
        notesText.value = '';
        setTimeout(() => {
          closeDrawer();
        }, 1000);
      } else {
        showToast(response?.error || 'Failed to sync application.', true);
      }
    });
  });
}
