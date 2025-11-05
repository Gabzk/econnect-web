"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    try {
      const _response = await axios.post("/api/auth/refresh");
      console.log("Token renovado com sucesso!");
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown }; message?: string };
      console.error(
        "Erro ao renovar token:",
        err.response?.data || err.message,
      );
      // Se o refresh falhou, significa que o refresh token também expirou
      // Não fazer logout automático, apenas retornar false
      return false;
    }
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
