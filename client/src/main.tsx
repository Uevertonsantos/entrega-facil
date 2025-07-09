console.log("🚀 Starting Entrega Fácil...");

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.simple";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-size: 18px;">ERRO: Elemento root não encontrado!</div>';
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log("✅ React app rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering React app:", error);
    document.body.innerHTML = `<div style="padding: 20px; color: red; font-size: 18px;">ERRO: ${error.message}</div>`;
  }
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
