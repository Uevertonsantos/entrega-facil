import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

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

// Debug logging
console.log("Starting React app...");

// Try-catch to identify any React errors
try {
  const root = createRoot(document.getElementById("root")!);
  console.log("Root created successfully");
  root.render(<App />);
  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">
    <h1>Erro no Entrega Fácil</h1>
    <p>Erro ao carregar a aplicação: ${error.message}</p>
    <pre>${error.stack}</pre>
  </div>`;
}
