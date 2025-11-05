import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.API_KEY;

export async function POST(request: Request) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      { error: "BACKEND_URL não está definido nas variáveis de ambiente." },
      { status: 500 },
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "API_KEY não está definido nas variáveis de ambiente." },
      { status: 500 },
    );
  }
  try {
    const body = await request.json();

    if (!body.email || !body.senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    const response = await axios.post(`${BACKEND_URL}/auth/login`, body, {
      headers: { api_key: API_KEY },
    });

    const { access_token, refresh_token } = response.data;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: "Tokens de autenticação não recebidos do backend." },
        { status: 500 },
      );
    }

    const cookieStore = await cookies();

    // Access token expira em 1 hora (3600 segundos)
    cookieStore.set({
      name: "access_token",
      value: access_token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hora
    });

    // Refresh token expira em 30 dias
    cookieStore.set({
      name: "refresh_token",
      value: refresh_token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 dias
    });

    return NextResponse.json({ message: "Login bem-sucedido" });
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: { detail?: string } };
    };
    const status = error.response?.status || 500;
    const message = error.response?.data?.detail || "Erro interno";
    return NextResponse.json({ error: message }, { status });
  }
}
