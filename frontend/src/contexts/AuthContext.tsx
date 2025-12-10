"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { refreshAuthToken } from "@/lib/auth-client";

interface AuthState {
  isAuthenticated: boolean;
  hasRefreshToken: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthState>({
    isAuthenticated: false,
    hasRefreshToken: false,
    isLoading: true,
  });
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await axios.get("/api/auth/status");
      const { isAuthenticated, hasRefreshToken } = response.data;

      // Se não tem access token mas tem refresh token, tentar renovar
      if (!isAuthenticated && hasRefreshToken) {
        console.log(
          "Access token ausente, tentando renovar com refresh token...",
        );
        const refreshSuccess = await refreshAuthToken();

        if (refreshSuccess) {
          // Token renovado com sucesso, verificar novamente
          const newResponse = await axios.get("/api/auth/status");
          setAuthStatus({
            isAuthenticated: newResponse.data.isAuthenticated,
            hasRefreshToken: newResponse.data.hasRefreshToken,
            isLoading: false,
          });
          return;
        }
      }

      setAuthStatus({
        isAuthenticated,
        hasRefreshToken,
        isLoading: false,
      });
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setAuthStatus({
        isAuthenticated: false,
        hasRefreshToken: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshToken = async () => {
    const success = await refreshAuthToken();
    if (success) {
      console.log("Token renovado com sucesso!");
      // Atualiza o status após refresh bem sucedido
      await checkAuth();
    }
    return success;
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setAuthStatus({
        isAuthenticated: false,
        hasRefreshToken: false,
        isLoading: false,
      });
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authStatus,
        checkAuth,
        refreshToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
