import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useGetMe, User, getGetMeQueryKey } from "@workspace/api-client-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("metapay_token"));
  const queryClient = useQueryClient();

  // Update token getter for customFetch whenever token changes
  useEffect(() => {
    setAuthTokenGetter(() => token);
    if (token) {
      localStorage.setItem("metapay_token", token);
    } else {
      localStorage.removeItem("metapay_token");
    }
  }, [token]);

  // Fetch user if token exists
  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  // Handle unauthorized
  useEffect(() => {
    if (error) {
      setToken(null);
    }
  }, [error]);

  const login = useCallback((newToken: string) => {
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  // Polling logic for when user is 'inactive'
  // Orval doesn't support dynamic refetchInterval easily in the hook options without overriding, 
  // but we can manage it. We will just let the components handle polling.

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isUserLoading && !!token,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
