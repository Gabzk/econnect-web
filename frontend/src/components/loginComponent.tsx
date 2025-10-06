"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import InputComponent from "./inputComponent";

export default function LoginComponent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      // const response = await axios.post("/api/login", { email, password }); temporariamente desativado até o backend estar pronto
      // console.log("Login bem-sucedido:", response.data);
      // Redirecionar ou tualizar o estado do usuário aqui

      router.replace("/dashboard"); // Redirecionar para a dashboard após o login
    } catch (error) {
      console.error("Erro no login:", error);
      // Tratar erros de autenticação aqui
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
