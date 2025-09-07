let toggleContainer = null;
let originalImageSrc = null;
let isGenerating = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'injectScript') {
    console.log('Content script received injectScript message');
    sendResponse({ status: 'injected' });
    return true; 
  }
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.sendMessage({ action: 'contentScriptReady' });
});

async function initializeExtension() {
    console.log('Initializing Amazon AI Fashion Try-On extension');
    if (window.location.hostname !== 'www.amazon.co.jp') {
        return;
    }
    
    // if (!isFashionPage()) {
    //     console.log('Not a fashion page');
    //     return;
    // }
    
    const settings = await chrome.storage.local.get(['apiKey', 'portrait']);
    if (!isValidSettings(settings)) {
        console.log('Settings not configured. Please configure API key and portrait in extension popup.');
        return;
    }
    
    createToggle();
}

function createToggle() {
    if (toggleContainer) {
        return;
    }
    
    toggleContainer = document.createElement('div');
    toggleContainer.innerHTML = `
        <div id="fashion-toggle-container" style="
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: white;
            border: 2px solid #ff9900;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
            font-size: 14px;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>AI Try-On:</span>
                <label style="position: relative; display: inline-block; width: 50px; height: 24px;">
                    <input type="checkbox" id="fashion-toggle" style="opacity: 0; width: 0; height: 0;">
                    <span class="slider" style="
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: .4s;
                        border-radius: 24px;
                    ">
                        <span class="slider-circle" style="
                            position: absolute;
                            content: '';
                            height: 18px;
                            width: 18px;
                            left: 3px;
                            bottom: 3px;
                            background-color: white;
                            transition: .4s;
                            border-radius: 50%;
                        "></span>
                    </span>
                </label>
                <span id="toggle-status">OFF</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(toggleContainer);
    
    const toggle = document.getElementById('fashion-toggle');
    const slider = toggleContainer.querySelector('.slider');
    const sliderCircle = toggleContainer.querySelector('.slider-circle');
    const status = document.getElementById('toggle-status');
    
    toggle.addEventListener('change', async function() {
        if (isGenerating) {
            toggle.checked = !toggle.checked;
            return;
        }
        
        if (toggle.checked) {
            slider.style.backgroundColor = '#ff9900';
            sliderCircle.style.transform = 'translateX(26px)';
            status.textContent = 'LOADING...';
            await generateAndReplaceImage();
        } else {
            slider.style.backgroundColor = '#ccc';
            sliderCircle.style.transform = 'translateX(0px)';
            status.textContent = 'OFF';
            restoreOriginalImage();
        }
    });
}

async function generateAndReplaceImage() {
    if (isGenerating) return;
    
    isGenerating = true;
    const toggle = document.getElementById('fashion-toggle');
    const status = document.getElementById('toggle-status');
    
    try {
        const mainImg = getMainProductImage();
        if (!mainImg) {
            throw new Error('Could not find product image');
        }
        
        if (!originalImageSrc) {
            originalImageSrc = mainImg.src;
        }
        
        const settings = await chrome.storage.local.get(['apiKey', 'portrait']);
        if (!isValidSettings(settings)) {
            throw new Error('Settings not configured');
        }
        
        status.textContent = 'GENERATING...';
        
        const generatedImageUrl = await generateImageWithGemini(
            settings.apiKey,
            settings.portrait,
            originalImageSrc
        );
        
        mainImg.src = generatedImageUrl;
        status.textContent = 'ON';
        
    } catch (error) {
        console.error('Error generating image:', error);
        status.textContent = 'ERROR';
        toggle.checked = false;
        const slider = toggleContainer.querySelector('.slider');
        const sliderCircle = toggleContainer.querySelector('.slider-circle');
        slider.style.backgroundColor = '#ccc';
        sliderCircle.style.transform = 'translateX(0px)';
        
        setTimeout(() => {
            status.textContent = 'OFF';
        }, 2000);
    } finally {
        isGenerating = false;
    }
}

function restoreOriginalImage() {
    if (originalImageSrc) {
        const mainImg = getMainProductImage();
        if (mainImg) {
            mainImg.src = originalImageSrc;
        }
    }
}

async function generateImageWithGemini(apiKey, portraitBase64, productImageUrl) {
    const prompt = `Generate an image showing the person from the first image wearing the clothing item from the second image. Keep the person's face, hair, body posture, and background exactly the same as the first image. Only replace their current clothing with the fashion item from the second product image. The new clothing should fit naturally and realistically on the person's body. Maintain the same lighting, pose, and setting from the original portrait. Generate the final composite image.`;
    
    try {
        const productImageResponse = await fetch(productImageUrl);
        const productImageBlob = await productImageResponse.blob();
        const productImageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(productImageBlob);
        });
        
        const portraitBase64Clean = portraitBase64.includes(',') ? portraitBase64.split(',')[1] : portraitBase64;
        
        const requestBody = {
            contents: [{
                parts: [
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: portraitBase64Clean
                        }
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg", 
                            data: productImageBase64
                        }
                    },
                    { text: prompt }
                ]
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response:", data);
        
        if (data.candidates && 
            data.candidates[0] && 
            data.candidates[0].content && 
            data.candidates[0].content.parts) {
            
            const imagePart = data.candidates[0].content.parts.find(part => part.inlineData || part.inline_data);
            if (imagePart) {
                const imageData = imagePart.inlineData || imagePart.inline_data;
                if (imageData && imageData.data) {
                    return `data:${imageData.mimeType || imageData.mime_type || 'image/png'};base64,${imageData.data}`;
                }
            }
        }
        
        throw new Error('No image generated in response');
        
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        throw error;
    }
}

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

function isValidSettings(settings) {
    return settings && 
           settings.apiKey && 
           settings.apiKey.trim() !== '' &&
           settings.portrait && 
           settings.portrait.trim() !== '';
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        if (toggleContainer) {
            toggleContainer.remove();
            toggleContainer = null;
            originalImageSrc = null;
        }
        setTimeout(initializeExtension, 1000);
    }
}).observe(document, { subtree: true, childList: true });