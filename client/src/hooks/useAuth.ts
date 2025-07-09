import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMerchant, setIsMerchant] = useState(false);
  const [isDeliverer, setIsDeliverer] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is logged in with local tokens
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    let hasValidToken = false;
    
    if (userType === "admin") {
      const adminToken = localStorage.getItem("adminToken");
      if (adminToken) {
        try {
          const payload = JSON.parse(atob(adminToken.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            setIsAdmin(true);
            hasValidToken = true;
          } else {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("userType");
          }
        } catch (error) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("userType");
        }
      }
    } else if (userType === "merchant") {
      const merchantToken = localStorage.getItem("merchantToken");
      if (merchantToken) {
        try {
          const payload = JSON.parse(atob(merchantToken.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            setIsMerchant(true);
            hasValidToken = true;
          } else {
            localStorage.removeItem("merchantToken");
            localStorage.removeItem("userType");
          }
        } catch (error) {
          localStorage.removeItem("merchantToken");
          localStorage.removeItem("userType");
        }
      }
    } else if (userType === "deliverer") {
      const delivererToken = localStorage.getItem("delivererToken");
      if (delivererToken) {
        try {
          const payload = JSON.parse(atob(delivererToken.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            setIsDeliverer(true);
            hasValidToken = true;
          } else {
            localStorage.removeItem("delivererToken");
            localStorage.removeItem("userType");
          }
        } catch (error) {
          localStorage.removeItem("delivererToken");
          localStorage.removeItem("userType");
        }
      }
    }
    
    setIsCheckingAuth(false);
  }, []);

  // Only query if not locally authenticated to avoid unnecessary API calls
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: false, // Disable Replit auth for now since we use local auth
  });

  return {
    user,
    isLoading: isCheckingAuth,
    isAuthenticated: isAdmin || isMerchant || isDeliverer,
    isAdmin,
    isMerchant,
    isDeliverer,
  };
}
