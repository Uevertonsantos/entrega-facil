import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force cache clear for Chrome compatibility
const APP_VERSION = '4.0.0';
const STORED_VERSION = localStorage.getItem('app-version');

if (STORED_VERSION !== APP_VERSION) {
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }
  
  // Clear localStorage except for essential data
  const essentialKeys = ['adminToken', 'merchantToken', 'delivererToken', 'userType'];
  const tempStorage: Record<string, string> = {};
  
  essentialKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) tempStorage[key] = value;
  });
  
  localStorage.clear();
  
  // Restore essential data
  Object.entries(tempStorage).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  localStorage.setItem('app-version', APP_VERSION);
}

// Register service worker for PWA with aggressive update checking
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Force update check
        registration.update();
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, force refresh
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
