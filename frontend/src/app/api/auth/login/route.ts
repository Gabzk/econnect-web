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

    (await cookies()).set({
      name: "access_token",
      value: access_token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    (await cookies()).set({
      name: "refresh_token",
      value: refresh_token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return NextResponse.json({ message: "Login bem-sucedido" });
  } catch (err: any) {
    // Axios joga erro para status >= 400, então capturamos aqui
    const status = err.response?.status || 500;
    const message = err.response?.data?.detail || "Erro interno";
    return NextResponse.json({ error: message }, { status });
  }
}
