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
    <div className="min-h-screen bg-gray-100">
      <Header onNewDelivery={() => setIsNewDeliveryOpen(true)} />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      
      <NewDeliveryModal
        isOpen={isNewDeliveryOpen}
        onClose={() => setIsNewDeliveryOpen(false)}
      />
    </div>
  );
}
