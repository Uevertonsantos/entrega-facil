import { useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import NewDeliveryModal from "../modals/new-delivery-modal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isNewDeliveryOpen, setIsNewDeliveryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 pwa-safe-area">
      <Header onNewDelivery={() => setIsNewDeliveryOpen(true)} />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-6 overflow-y-auto mobile-scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <NewDeliveryModal
        isOpen={isNewDeliveryOpen}
        onClose={() => setIsNewDeliveryOpen(false)}
      />
    </div>
  );
}
