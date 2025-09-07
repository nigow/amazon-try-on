chrome.runtime.onInstalled.addListener(() => {
  console.log('Amazon AI Fashion Try-On extension installed');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('amazon.co.jp')) {
    let sendMessagePromise = chrome.tabs.sendMessage(tabId, { action: 'injectScript' });
    sendMessagePromise.then(response => {
      if (response && response.status === 'injected') {
        console.log('Content script injected successfully');
      } else {
        console.log('Content script injection failed or already injected');
      }
    }).catch(error => {
      console.error('Error sending message to content script:', error);
    });
  }
});