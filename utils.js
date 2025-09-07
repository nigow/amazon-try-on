function isFashionPage() {
  const breadcrumbSelector = '#wayfinding-breadcrumbs_container';
  const breadcrumb = document.querySelector(breadcrumbSelector);
  
  if (!breadcrumb) {
    return false;
  }
  
  const breadcrumbText = breadcrumb.textContent || '';
  
  const fashionKeywords = [
    'ファッション',
    'メンズ',
    'レディース',
    '服',
    'トップス',
    'ボトムス',
    'Tシャツ',
    'カットソー',
    'シャツ',
    'パンツ',
    'スカート',
    'ドレス',
    'アウター',
    'コート',
    'ジャケット',
    'セーター',
    'カーディガン',
    'ワンピース',
    'ジーンズ',
    'デニム'
  ];
  
  return fashionKeywords.some(keyword => breadcrumbText.includes(keyword));
}

function getMainProductImage() {
  const imageSelectors = [
    '#landingImage',
    '#imgBlkFront',
    '.imgTagWrapper img',
    '[data-a-image-name="landingImage"]',
    '.a-dynamic-image'
  ];
  
  for (const selector of imageSelectors) {
    const img = document.querySelector(selector);
    if (img && img.src) {
      return img;
    }
  }
  
  return null;
}

function extractProductImageUrl() {
  const mainImg = getMainProductImage();
  if (!mainImg) return null;
  
  return mainImg.src;
}

async function getStorageData(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result);
    });
  });
}

async function setStorageData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

function isValidSettings(settings) {
  return settings && 
         settings.apiKey && 
         settings.apiKey.trim() !== '' &&
         settings.portrait && 
         settings.portrait.trim() !== '';
}