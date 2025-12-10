"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { refreshAuthToken } from "@/lib/auth-client";
import InputComponent from "./inputComponent";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginComponent() {
  const { isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkIfAuthenticated = async () => {
    try {
      const response = await axios.get("/api/auth/status");
      const { isAuthenticated, hasRefreshToken } = response.data;

      if (isAuthenticated) {
        // Já está autenticado, redirecionar para feed
        router.push("/");
      } else if (hasRefreshToken) {
        // Tem refresh token, tentar renovar
        const success = await refreshAuthToken();
        if (success) {
          router.push("/");
        } else {
          // Refresh falhou, continuar na tela de login
          console.log("Refresh token expirado ou inválido");
        }
      }
    } catch (error) {
      // Erro ao verificar, continuar na tela de login
      console.error("Erro ao verificar autenticação:", error);
    }
  };

  // Verificar se já está autenticado ao montar o componente
  useEffect(() => {
    checkIfAuthenticated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Validar email
    if (!email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    // Validar senha
    if (!password) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      newErrors.password = "Senha deve ter no mínimo 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({}); // Limpar erros anteriores

    try {
      const res = await axios.post("/api/auth/login", {
        email,
        senha: password,
      });

      console.log("Login bem-sucedido:", res.data);
      await checkAuth();
      router.push("/"); // Redirecionar para a feed após o login
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string; detail?: string } };
      };
      console.error("Erro no login:", error);

      // Pegar a mensagem de erro do backend
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Erro ao fazer login. Tente novamente.";

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="w-full max-w-md md:max-w-[85%] lg:max-w-[95%] flex items-center flex-col gap-4 md:gap-10 px-4 md:px-8"
      onSubmit={handleSubmit}
    >
      <InputComponent
        type="email"
        label="Email"
        placeholder="seu@email.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        disabled={isLoading}
      />

      <InputComponent
        type="password"
        label="Senha"
        placeholder="Digite sua senha"
        value={password}
        onChange={setPassword}
        error={errors.password}
        disabled={isLoading}
      />

      {errors.general && (
        <div className="w-full p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {errors.general}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 mt-4 md:h-16 bg-amber-50 text-emerald-900 font-semibold py-2 px-4 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
