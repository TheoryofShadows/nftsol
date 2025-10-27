import React, { useState, useEffect } from 'react';
import { pwaService } from '../services/pwaService';
import './InstallButton.css';

export default function InstallButton() {
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if PWA is already installed
    if (pwaService.isInstalled()) {
      setShowInstall(false);
      return;
    }

    // Check if install prompt is available
    const checkInstallPrompt = () => {
      setShowInstall(true);
    };

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', checkInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaService.installPWA();
      if (success) {
        setShowInstall(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (!showInstall) {
    return null;
  }

  return (
    <div className="install-button-container">
      <button
        className="install-button"
        onClick={handleInstall}
        disabled={isInstalling}
      >
        {isInstalling ? (
          <>
            <span className="install-spinner"></span>
            Installing...
          </>
        ) : (
          <>
            📱 Install NFTSol App
          </>
        )}
      </button>
    </div>
  );
}

