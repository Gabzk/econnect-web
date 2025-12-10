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
                const res = await fetch('/api/user');
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

    const handleEditConfirm = async (data: { nome: string; email: string; senha: string }) => {
        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
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
            <div className="w-full min-h-screen flex flex-col">
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-white">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen flex flex-col">
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex flex-col">
            <div className="flex flex-1">
                <aside className="w-1/3 max-w-[380px] border-r border-[#D5D0B3] px-10 py-12">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-[#245B2A] mx-auto flex items-center justify-center">
                        <img src="/tigreen.png" alt="" />
                    </div>

                    <h1 className="text-2xl text-[#1F4F25] font-semibold mt-6 text-center tracking-wide">
                        {user?.nome || "Carregando..."}
                    </h1>

                    <p className="text-center text-[#1F4F25] underline mt-1 text-sm">
                        {user?.email || "email@example.com"}
                    </p>

                    <p className="text-center text-[#1F4F25] mt-2 text-sm">
                        Se informando desde: 
                        {user?.dataCadastro
                            ? new Date(user.dataCadastro).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                              })
                            : "Data de criação não disponível"}
                    </p>

                    <div className="flex justify-center mt-6">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="w-14 h-10 text-white rounded bg-[#2F6D3A] flex items-center justify-center hover:scale-105 transition hover:bg-[#245B2A]">
                            Editar
                        </button>
                    </div>
                </aside>

                <main className="flex-1 border-l border-[#D5D0B3] px-10 py-12 overflow-hidden">
                    <LikedNewsFeedComponent />
                </main>
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