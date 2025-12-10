"use client";

import { useState } from "react";

interface EditProfileModalComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { nome: string; email: string; senha: string }) => Promise<void>;
  initialData: {
    nome: string;
    email: string;
  };
}

export default function EditProfileModalComponent({
  isOpen,
  onClose,
  onConfirm,
  initialData,
}: EditProfileModalComponentProps) {
  const [formData, setFormData] = useState({
    nome: initialData.nome,
    email: initialData.email,
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleConfirm = async () => {
    // Validações básicas
    if (!formData.nome.trim()) {
      setError("Nome não pode estar vazio");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email não pode estar vazio");
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#F5F1E8] rounded-lg shadow-lg w-full max-w-md mx-4 p-8 border border-[#D5D0B3]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1F4F25]">
            Editar Perfil
          </h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-[#1F4F25] mb-2">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-[#D5D0B3] rounded bg-white text-[#1F4F25] focus:outline-none focus:ring-2 focus:ring-[#2F6D3A] disabled:opacity-50"
              placeholder="Seu nome"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#1F4F25] mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-[#D5D0B3] rounded bg-white text-[#1F4F25] focus:outline-none focus:ring-2 focus:ring-[#2F6D3A] disabled:opacity-50"
              placeholder="seu@email.com"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-medium text-[#1F4F25] mb-2">
              Senha (deixar em branco para não alterar)
            </label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-2 border border-[#D5D0B3] rounded bg-white text-[#1F4F25] focus:outline-none focus:ring-2 focus:ring-[#2F6D3A] disabled:opacity-50"
              placeholder="Nova senha"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-[#D5D0B3] rounded text-[#1F4F25] hover:bg-[#E8E4D5] transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[#2F6D3A] text-white rounded hover:bg-[#245B2A] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
