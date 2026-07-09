const API_URL = 'http://localhost:5000/api';

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveToken') {
    // Save token from web app to local extension storage
    chrome.storage.local.set({ token: message.token, user: message.user }, () => {
      console.log('Session synced from web dashboard.');
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'getToken') {
    chrome.storage.local.get(['token', 'user'], (result) => {
      sendResponse({ token: result.token || null, user: result.user || null });
    });
    return true;
  }

  if (message.action === 'clearToken') {
    chrome.storage.local.remove(['token', 'user'], () => {
      console.log('Session cleared.');
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'login') {
    const { email, password } = message.credentials;
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          chrome.storage.local.set({ token: data.token, user: { name: data.name, email: data.email } }, () => {
            sendResponse({ success: true, user: { name: data.name, email: data.email } });
          });
        } else {
          sendResponse({ success: false, error: data.message });
        }
      })
      .catch(err => {
        console.error(err);
        sendResponse({ success: false, error: 'Cannot connect to backend server' });
      });
    return true;
  }

  if (message.action === 'logApplication') {
    chrome.storage.local.get(['token'], (result) => {
      if (!result.token) {
        sendResponse({ success: false, error: 'Unauthorized. Please login first.' });
        return;
      }

      fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.token}`
        },
        body: JSON.stringify(message.data)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            sendResponse({ success: true, data: data.data });
          } else {
            sendResponse({ success: false, error: data.message });
          }
        })
        .catch(err => {
          console.error(err);
          sendResponse({ success: false, error: 'Failed to connect to backend server.' });
        });
    });
    return true;
  }
});
