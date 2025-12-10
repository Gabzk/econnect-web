"use client";

import { useState, useEffect } from "react";
import LikedNewsFeedComponent from "./likedNewsFeedComponent";
import EditProfileModalComponent from "./editProfileModalComponent";

type User = {
  nome: string;
  email: string;
  dataCadastro?: string;
};

export default function ProfileComponent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setError("Falha ao buscar o perfil do usuário");
          console.error("Falha ao buscar o perfil do usuário");
        }
      } catch (e) {
        setError("Erro ao buscar o perfil do usuário");
        console.error("Erro ao buscar o perfil do usuário", e);
      } finally {
        setLoading(false);
      }
    }
    fetchUserProfile();
  }, []);

  const handleEditConfirm = async (data: {
    nome: string;
    email: string;
    senha: string;
  }) => {
    try {
      const formData = new FormData();
      if (data.nome) formData.append("nome", data.nome);
      if (data.email) formData.append("email", data.email);
      if (data.senha) formData.append("senha", data.senha);

      const response = await fetch("/api/user", {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar perfil");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsModalOpen(false);
      window.location.reload();
    } catch (err) {
      throw err instanceof Error ? err : new Error("Erro desconhecido");
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F5F1E8]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-800 font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#F5F1E8]">
        <div className="bg-white p-8 rounded-lg shadow-md border border-red-200 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">
            Ops! Algo deu errado.
          </h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Profile Card */}
          <aside className="w-full lg:w-1/3 xl:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden sticky top-8">
              <div className="h-32 bg-gradient-to-r from-emerald-600 to-emerald-900"></div>

              <div className="px-6 pb-8 relative">
                <div className="relative -mt-16 mb-6 flex justify-center">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#F5F1E8]">
                    <img
                      src="/tigreen.png"
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-emerald-900">
                    {user?.nome || "Usuário"}
                  </h1>
                  <p className="text-emerald-600 font-medium">{user?.email}</p>

                  <div className="pt-4 pb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Membro desde{" "}
                      {user?.dataCadastro
                        ? new Date(user.dataCadastro).toLocaleDateString(
                            "pt-BR",
                            {
                              month: "long",
                              year: "numeric",
                            },
                          )
                        : "..."}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Editar Perfil
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content / Feed */}
          <main className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 min-h-[500px] p-6">
              <h2 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2 border-b border-emerald-50 pb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Notícias Curtidas
              </h2>
              <LikedNewsFeedComponent />
            </div>
          </main>
        </div>
      </div>

      {/* Modal de Edição */}
      <EditProfileModalComponent
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleEditConfirm}
        initialData={{
          nome: user?.nome || "",
          email: user?.email || "",
        }}
      />
    </div>
  );
}
