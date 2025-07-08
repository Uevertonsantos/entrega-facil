import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Check if user is admin
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const userType = localStorage.getItem("userType");
    
    if (adminToken && userType === "admin") {
      // Verify token is still valid (simple check)
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
    
    setIsCheckingAdmin(false);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !isAdmin, // Only query if not admin
  });

  return {
    user,
    isLoading: isLoading || isCheckingAdmin,
    isAuthenticated: !!user || isAdmin,
    isAdmin,
  };
}
