"use client";

import axios from "axios";
import { type FormEvent, useState } from "react";
import InputComponent from "./inputComponent";
import { useRouter } from "next/navigation";

export default function RegisterComponent() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
    } = {};

    // Validar nome
    if (!name) {
      newErrors.name = "Nome é obrigatório";
    } else if (name.length < 3) {
      newErrors.name = "Nome deve ter no mínimo 3 caracteres";
    }

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
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      console.log("Cadastro realizado com sucesso:", response.data);
      setRegistered(true);
      router.push("/login");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      // Pegar a mensagem de erro do backend
      // Pegar a mensagem de erro do backend
      const resolveErrorMessage = (error: any): string => {
        if (error?.response?.data?.error) return error.response.data.error;
        if (error?.response?.data?.detail) return error.response.data.detail;
        return "Erro ao fazer registro. Tente novamente.";
      };
      const errorMessage = resolveErrorMessage(error);

      setErrors({ general: errorMessage });
      setIsLoading(false);
    }
  };

  return (
    <form
      className="w-full max-w-md md:max-w-[85%] lg:max-w-[95%] flex items-center flex-col gap-4 md:gap-8 px-4 md:px-8"
      onSubmit={handleSubmit}
    >
      <InputComponent
        type="text"
        label="Nome completo"
        placeholder="Digite seu nome"
        value={name}
        onChange={setName}
        error={errors.name}
        disabled={isLoading}
      />

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
        placeholder="Mínimo 6 caracteres"
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

      {registered && (
        <div className="w-full p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          Cadastro realizado com sucesso! Redirecionando para o login...
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 mt-4 md:h-16 bg-amber-50 text-emerald-900 font-semibold py-2 px-4 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
      >
        {isLoading ? "Cadastrando..." : "Cadastrar"}
      </button>
    </form>
  );
}
