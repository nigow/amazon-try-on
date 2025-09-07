/// <reference types="chrome" />
// FIX: Add chrome declaration to fix "Cannot find name 'chrome'" error.
declare var chrome: any;
import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import type { UserSettings } from './types';
import { generateTryOnImage } from './services/geminiService';

enum Status {
  IDLE,
  LOADING,
  READY,
  ERROR,
}

// Helper component defined outside the main component
const ToggleSwitch: React.FC<{
    isOn: boolean;
    onToggle: () => void;
    disabled: boolean;
}> = ({ isOn, onToggle, disabled }) => (
    <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isOn ? 'bg-indigo-600' : 'bg-gray-300'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                isOn ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);


const TryOnComponent: React.FC = () => {
    const [status, setStatus] = useState<Status>(Status.IDLE);
    const [showAIImage, setShowAIImage] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [generatedImageSrc, setGeneratedImageSrc] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const fetchImageAsBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const runGeneration = useCallback(async (settings: UserSettings, productImageUrl: string) => {
        try {
            setStatus(Status.LOADING);
            const productImgBase64 = await fetchImageAsBase64(productImageUrl);
            // FIX: Removed apiKey from generateTryOnImage call.
            const resultBase64 = await generateTryOnImage(settings.portraitImage, productImgBase64);
            setGeneratedImageSrc(resultBase64);
            setStatus(Status.READY);
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred.");
            setStatus(Status.ERROR);
        }
    }, []);

    useEffect(() => {
        const mainImageElement = document.querySelector<HTMLImageElement>('#landingImage, div#imgTagWrapperId img');
        if (!mainImageElement || !mainImageElement.src) return;

        setOriginalImageSrc(mainImageElement.src);

        // FIX: Removed apiKey from chrome storage call and subsequent logic.
        chrome.storage.local.get(['portraitImage'], (result: Partial<UserSettings>) => {
            if (result.portraitImage && mainImageElement.src) {
                runGeneration({portraitImage: result.portraitImage}, mainImageElement.src);
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const mainImageElement = document.querySelector<HTMLImageElement>('#landingImage, div#imgTagWrapperId img');
        if (!mainImageElement || !originalImageSrc) return;

        if (showAIImage && generatedImageSrc) {
            mainImageElement.srcset = '';
            mainImageElement.src = generatedImageSrc;
        } else {
            mainImageElement.src = originalImageSrc;
        }
    }, [showAIImage, generatedImageSrc, originalImageSrc]);
    
    let statusText = 'Initializing...';
    if (status === Status.LOADING) statusText = 'Generating AI Image...';
    if (status === Status.READY) statusText = 'AI Try-On Ready';
    if (status === Status.ERROR) statusText = 'Generation Failed';

    return (
        <div className="fixed bottom-5 right-5 z-[9999] p-4 bg-white rounded-lg shadow-2xl flex items-center space-x-4">
            <div className="flex items-center space-x-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
               <span className="text-sm font-medium text-gray-700">{statusText}</span>
            </div>
            <ToggleSwitch
                isOn={showAIImage}
                onToggle={() => setShowAIImage(prev => !prev)}
                disabled={status !== Status.READY}
            />
        </div>
    );
};

const init = () => {
    const breadcrumbs = document.getElementById('wayfinding-breadcrumbs_feature_div');
    const isFashionPage = breadcrumbs && breadcrumbs.innerText.includes('ファッション');

    if (!isFashionPage) {
        return;
    }

    const appRoot = document.createElement('div');
    appRoot.id = 'amazon-ai-try-on-root';
    document.body.appendChild(appRoot);

    const root = ReactDOM.createRoot(appRoot);
    root.render(
      <React.StrictMode>
        <TryOnComponent />
      </React.StrictMode>
    );
};

init();