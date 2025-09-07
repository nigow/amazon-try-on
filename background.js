const readyTabs = new Set();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Amazon AI Fashion Try-On extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentScriptReady' && sender.tab) {
    console.log(`Content script ready in tab ${sender.tab.id}`);
    readyTabs.add(sender.tab.id);
    sendResponse({ status: 'acknowledged' });
    
    chrome.tabs.sendMessage(sender.tab.id, { action: 'injectScript' })
      .then(response => {
        if (response && response.status === 'injected') {
          console.log('Content script injected successfully');
        } else {
          console.log('Content script injection failed or already injected');
        }
      }).catch(error => {
        console.error('Error sending inject message:', error);
      });
  }
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('amazon.co.jp')) {
    setTimeout(() => {
      try {
        if (!readyTabs.has(tabId)) {
          console.log(`Attempting to send injectScript message to tab ${tabId}`);
          chrome.tabs.sendMessage(tabId, { action: 'injectScript' })
            .then(response => {
              if (response && response.status === 'injected') {
                console.log('Content script injected successfully');
              } else {
                console.log('Content script injection failed or already injected');
              }
            }).catch(_error => {
              console.log('Content script not ready yet, normal if page just loaded');
            });
        }
      } catch (error) {
        console.log('Error with content script communication:', error);
      }
    }, 1000);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId);
});