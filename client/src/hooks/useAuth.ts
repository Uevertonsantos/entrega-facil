import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [isDeliverer, setIsDeliverer] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in with local tokens
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const merchantToken = localStorage.getItem("merchantToken");
    const delivererToken = localStorage.getItem("delivererToken");
    const userType = localStorage.getItem("userType");
    
    // Check admin token
    if (adminToken && userType === "admin") {
      try {
        const payload = JSON.parse(atob(adminToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (!isExpired) {
          setIsAdmin(true);
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("userType");
        }
      } catch (error) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("userType");
      }
    }
    
    // Check merchant token
    if (merchantToken && userType === "merchant") {
      try {
        const payload = JSON.parse(atob(merchantToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (!isExpired) {
          setIsMerchant(true);
        } else {
          localStorage.removeItem("merchantToken");
          localStorage.removeItem("userType");
        }
      } catch (error) {
        localStorage.removeItem("merchantToken");
        localStorage.removeItem("userType");
      }
    }
    
    // Check deliverer token
    if (delivererToken && userType === "deliverer") {
      try {
        const payload = JSON.parse(atob(delivererToken.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (!isExpired) {
          setIsDeliverer(true);
        } else {
          localStorage.removeItem("delivererToken");
          localStorage.removeItem("userType");
        }
      } catch (error) {
        localStorage.removeItem("delivererToken");
        localStorage.removeItem("userType");
      }
    }
    
    setIsCheckingAuth(false);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !isAdmin && !isMerchant && !isDeliverer, // Only query if not locally authenticated
  });

  return {
    user,
    isLoading: isLoading || isCheckingAuth,
    isAuthenticated: !!user || isAdmin || isMerchant || isDeliverer,
    isAdmin,
    isMerchant,
    isDeliverer,
  };
}
