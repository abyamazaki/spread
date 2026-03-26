"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { login as apiLogin, logout as apiLogout, isAuthenticated, ApiError } from "@/lib/api-client";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      if (!isAuthenticated()) {
        setLoading(false);
        if (pathname !== "/login") {
          router.push("/login");
        }
        return;
      }

      try {
        const { apiClient } = await import("@/lib/api-client");
        const userData = await apiClient.get<User>("/api/v1/auth/me");
        setUser(userData);
      } catch {
        // Token invalid, clear and redirect
        apiLogout();
        if (pathname !== "/login") {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const userData = await apiLogin(email, password);
    setUser(userData);
    router.push("/sheets");
  }, [router]);

  const handleLogout = useCallback(() => {
    apiLogout();
    setUser(null);
    router.push("/login");
  }, [router]);

  // Don't block login page rendering
  if (pathname === "/login") {
    return (
      <AuthContext.Provider value={{ user, loading: false, login: handleLogin, logout: handleLogout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
