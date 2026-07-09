// Popup Controller
document.addEventListener('DOMContentLoaded', () => {
  const loginView = document.getElementById('login-view');
  const dashboardView = document.getElementById('dashboard-view');
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');
  
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');

  // Check auth state from storage on open
  chrome.runtime.sendMessage({ action: 'getToken' }, (response) => {
    if (response && response.token) {
      showDashboard(response.user);
    } else {
      showLogin();
    }
  });

  // Handle Login Submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    errorMessage.classList.add('hidden');
    btnLogin.disabled = true;
    btnLogin.innerText = 'Signing In...';

    chrome.runtime.sendMessage({
      action: 'login',
      credentials: { email, password }
    }, (response) => {
      btnLogin.disabled = false;
      btnLogin.innerText = 'Sign In';

      if (response && response.success) {
        showDashboard(response.user);
      } else {
        errorMessage.innerText = response?.error || 'Login failed. Please check credentials.';
        errorMessage.classList.remove('hidden');
      }
    });
  });

  // Handle Logout
  btnLogout.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'clearToken' }, (response) => {
      if (response && response.success) {
        showLogin();
      }
    });
  });

  // Quick Log elements
  const quickLogForm = document.getElementById('quick-log-form');
  const quickCompany = document.getElementById('quick-company');
  const quickRole = document.getElementById('quick-role');
  const quickUrl = document.getElementById('quick-url');
  const quickResume = document.getElementById('quick-resume');
  const quickStatus = document.getElementById('quick-status');
  const quickError = document.getElementById('quick-error');
  const quickSuccess = document.getElementById('quick-success');
  const btnQuickLog = document.getElementById('btn-quick-log');

  // Handle Quick Log Submission
  quickLogForm.addEventListener('submit', (e) => {
    e.preventDefault();
    quickError.classList.add('hidden');
    quickSuccess.classList.add('hidden');
    btnQuickLog.disabled = true;
    btnQuickLog.innerText = 'Syncing...';

    const data = {
      company: quickCompany.value.trim(),
      role: quickRole.value.trim(),
      jobLink: quickUrl.value.trim(),
      resumeVersion: quickResume.value.trim() || 'Default',
      status: quickStatus.value,
      notes: 'Logged directly via Quick Tab Capture extension popup.'
    };

    chrome.runtime.sendMessage({
      action: 'logApplication',
      data: data
    }, (response) => {
      btnQuickLog.disabled = false;
      btnQuickLog.innerText = 'Sync Active Tab';

      if (response && response.success) {
        quickSuccess.classList.remove('hidden');
        quickCompany.value = '';
        quickRole.value = '';
        setTimeout(() => {
          quickSuccess.classList.add('hidden');
        }, 3000);
      } else {
        quickError.innerText = response?.error || 'Failed to log application.';
        quickError.classList.remove('hidden');
      }
    });
  });

  function showDashboard(user) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userName.innerText = user?.name || 'Authorized User';
    userEmail.innerText = user?.email || 'Dashboard Sync Active';

    // Populate active tab details for quick logging
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        const activeTab = tabs[0];
        
        // Clean URL
        quickUrl.value = activeTab.url.split('?')[0];

        // Guess Company & Position from page title
        let guessedRole = activeTab.title;
        let guessedCompany = '';

        if (activeTab.title.includes(' at ')) {
          const parts = activeTab.title.split(' at ');
          guessedRole = parts[0].trim();
          guessedCompany = parts[1].split(/ [-\|] /)[0].trim();
        } else if (activeTab.title.includes(' - ')) {
          const parts = activeTab.title.split(' - ');
          guessedCompany = parts[0].trim();
          guessedRole = parts[1].trim();
        } else {
          try {
            const parsedUrl = new URL(activeTab.url);
            guessedCompany = parsedUrl.hostname.replace('www.', '').split('.')[0];
          } catch (e) {
            guessedCompany = '';
          }
        }

        // Clean common boilerplate strings
        quickRole.value = guessedRole.replace('Job Search | ', '').replace(' | LinkedIn', '').trim();
        quickCompany.value = guessedCompany.replace(' | LinkedIn', '').trim();
      }
    });
  }

  function showLogin() {
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  }
});
