"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { refreshAuthToken } from "@/lib/auth-client";

interface AuthStatus {
  isAuthenticated: boolean;
  hasRefreshToken: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
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
        const refreshSuccess = await refreshToken();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshToken = async () => {
    const success = await refreshAuthToken();
    if (success) {
      console.log("Token renovado com sucesso!");
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

  return {
    ...authStatus,
    checkAuth,
    refreshToken,
    logout,
  };
}
