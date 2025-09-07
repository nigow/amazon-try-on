// FIX: Add chrome declaration to fix "Cannot find name 'chrome'" error.
declare var chrome: any;
import React, { useState, useEffect, useCallback } from 'react';
import type { UserSettings } from './types';

const App: React.FC = () => {
  // FIX: Removed apiKey state as it is no longer managed through the UI.
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    // FIX: Removed apiKey from chrome storage call.
    chrome.storage.local.get(['portraitImage'], (result: Partial<UserSettings>) => {
      if (result.portraitImage) {
        setPortraitImage(result.portraitImage);
      }
    });
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortraitImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = useCallback(() => {
    // FIX: Removed apiKey check.
    if (!portraitImage) {
      setStatus('Portrait image is required.');
      return;
    }

    // FIX: Removed apiKey from settings object.
    const settings: UserSettings = { portraitImage };
    chrome.storage.local.set(settings, () => {
      setStatus('Settings saved successfully!');
      setTimeout(() => setStatus(''), 2000);
    });
  }, [portraitImage]);

  return (
    <div className="w-[400px] p-6 bg-white shadow-lg font-sans">
      <div className="flex items-center mb-6">
        <img src="https://picsum.photos/40/40" alt="logo" className="rounded-full mr-3" />
        <h1 className="text-2xl font-bold text-gray-800">AI Fashion Try-On</h1>
      </div>

      <div className="space-y-6">
        {/* FIX: Removed API Key input field as per guidelines. */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Self-Portrait Image
          </label>
          <div className="mt-1 flex items-center space-x-4">
            {portraitImage ? (
              <img src={portraitImage} alt="Portrait Preview" className="h-20 w-20 rounded-md object-cover bg-gray-100" />
            ) : (
              <div className="h-20 w-20 rounded-md bg-gray-200 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <span>Upload Image</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Settings
        </button>

        {status && <p className="text-sm text-center text-gray-600 mt-2">{status}</p>}
      </div>
    </div>
  );
};

export default App;