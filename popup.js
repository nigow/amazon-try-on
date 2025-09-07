document.addEventListener('DOMContentLoaded', async function() {
    const apiKeyInput = document.getElementById('apiKey');
    const portraitInput = document.getElementById('portrait');
    const portraitPreview = document.getElementById('portraitPreview');
    const saveButton = document.getElementById('saveButton');
    const status = document.getElementById('status');
    
    const settings = await chrome.storage.local.get(['apiKey', 'portrait']);
    if (settings.apiKey) {
        apiKeyInput.value = settings.apiKey;
    }
    if (settings.portrait) {
        portraitPreview.src = settings.portrait;
        portraitPreview.style.display = 'block';
    }
    
    portraitInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                portraitPreview.src = e.target.result;
                portraitPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    saveButton.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        const portraitFile = portraitInput.files[0];
        
        if (!apiKey) {
            showStatus('Please enter your Gemini API key', 'error');
            return;
        }
        
        let portraitData = settings.portrait;
        if (portraitFile) {
            portraitData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(portraitFile);
            });
        }
        
        if (!portraitData) {
            showStatus('Please select a portrait image', 'error');
            return;
        }
        
        await chrome.storage.local.set({
            apiKey: apiKey,
            portrait: portraitData
        });
        
        showStatus('Settings saved successfully!', 'success');
    });
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});