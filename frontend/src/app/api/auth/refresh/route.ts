import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.API_KEY;

export async function POST(_request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    console.log("Tentando renovar token...");
    console.log("Refresh token presente:", !!refreshToken);

    if (!refreshToken) {
      console.log("Refresh token não encontrado nos cookies");
      return NextResponse.json(
        { error: "Refresh token não encontrado" },
        { status: 401 },
      );
    }

    // Chamar a API do backend para refresh usando query parameter
    console.log("Chamando backend para refresh...");
    const response = await axios.post(
      `${BACKEND_URL}/auth/refresh?refresh_token=${refreshToken}`,
      {},
      {
        headers: { api_key: API_KEY },
      },
    );

    console.log("Token renovado com sucesso pelo backend");
    const { access_token, refresh_token: new_refresh_token } = response.data;

    // Atualizar o access_token no cookie (3600 segundos = 1 hora)
    cookieStore.set({
      name: "access_token",
      value: access_token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hora
    });

    // Se o backend retornar um novo refresh_token, atualizar também
    if (new_refresh_token) {
      cookieStore.set({
        name: "refresh_token",
        value: new_refresh_token,
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60, // 30 dias
      });
    }

    return NextResponse.json({
      message: "Token atualizado com sucesso",
      access_token,
    });
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: unknown } };
    const status = error.response?.status || 500;
    const message =
      (error.response?.data as { detail?: string })?.detail ||
      "Erro ao atualizar token";

    console.error("Erro ao renovar token:", {
      status,
      message,
      error: error.response?.data,
    });

    // Se o refresh token expirou (401) ou é inválido, limpar os cookies
    if (status === 401 || status === 403) {
      console.log("Refresh token inválido ou expirado, removendo cookies");
      const cookieStore = await cookies();
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
    }

    return NextResponse.json({ error: message }, { status });
  }
}
