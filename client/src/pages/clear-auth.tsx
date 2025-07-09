import { useEffect } from "react";

export default function ClearAuth() {
  useEffect(() => {
    // Limpar todos os tokens do localStorage
    localStorage.removeItem("adminToken");
    localStorage.removeItem("merchantToken");
    localStorage.removeItem("delivererToken");
    localStorage.removeItem("userType");
    
    // Redirecionar para a página inicial
    window.location.href = "/";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
}