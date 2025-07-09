console.log("🚀 Starting Entrega Fácil...");

// First, show a basic loading screen
document.body.innerHTML = `
<div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; background: #f0f0f0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">🚚 Entrega Fácil</h1>
    <p style="color: #666; margin-bottom: 20px;">Carregando sistema...</p>
    <div id="loading-status" style="color: #007bff;">Iniciando...</div>
  </div>
</div>
`;

const updateStatus = (message) => {
  const statusEl = document.getElementById('loading-status');
  if (statusEl) statusEl.textContent = message;
};

// Try to load React step by step
setTimeout(async () => {
  try {
    updateStatus("Carregando React...");
    
    const { createRoot } = await import("react-dom/client");
    updateStatus("React DOM carregado ✅");
    
    const { StrictMode } = await import("react");
    updateStatus("React carregado ✅");
    
    // Import CSS
    await import("./index.css");
    updateStatus("Estilos carregados ✅");
    
    // Try to import App
    updateStatus("Carregando App...");
    const { default: App } = await import("./App");
    updateStatus("App carregado ✅");
    
    // Create root element
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      // Create root if it doesn't exist
      const newRoot = document.createElement("div");
      newRoot.id = "root";
      document.body.appendChild(newRoot);
    }
    
    updateStatus("Renderizando App...");
    const root = createRoot(document.getElementById("root"));
    
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    updateStatus("App renderizado com sucesso ✅");
    console.log("✅ React app rendered successfully");
    
  } catch (error) {
    console.error("❌ Error loading app:", error);
    updateStatus(`Erro: ${error.message}`);
    
    // Show error and fallback options
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; background: #f0f0f0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin-bottom: 20px;">🚚 Entrega Fácil</h1>
          <div style="color: #d32f2f; margin-bottom: 20px;">❌ Erro ao carregar: ${error.message}</div>
          
          <div style="margin-top: 20px;">
            <h3>Páginas alternativas:</h3>
            <a href="/test.html" style="display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">Teste Básico</a>
            <a href="/debug.html" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 5px;">Debug</a>
          </div>
        </div>
      </div>
    `;
  }
}, 100);

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
