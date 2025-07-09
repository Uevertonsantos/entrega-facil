import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>,
): Promise<Response> {
  // Add tokens if available
  const adminToken = localStorage.getItem("adminToken");
  const merchantToken = localStorage.getItem("merchantToken");
  const delivererToken = localStorage.getItem("delivererToken");
  const headers: any = data ? { "Content-Type": "application/json" } : {};
  
  // Add appropriate token based on endpoint and available tokens
  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  } else if (merchantToken) {
    headers.Authorization = `Bearer ${merchantToken}`;
  } else if (delivererToken) {
    headers.Authorization = `Bearer ${delivererToken}`;
  }
  
  // Override with custom headers if provided
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    
    // Add tokens if available
    const adminToken = localStorage.getItem("adminToken");
    const merchantToken = localStorage.getItem("merchantToken");
    const delivererToken = localStorage.getItem("delivererToken");
    const headers: any = {};
    
    // Add appropriate token based on available tokens
    if (adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    } else if (merchantToken) {
      headers.Authorization = `Bearer ${merchantToken}`;
    } else if (delivererToken) {
      headers.Authorization = `Bearer ${delivererToken}`;
    }
    
    const res = await fetch(url, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
