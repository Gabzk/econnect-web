import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.API_KEY;

// Get Usuario
export async function GET() {
  const cookieStore = cookies();
  const accessToken = (await cookieStore).get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Token de acesso não encontrado" },
      { status: 401 },
    );

    try {
      // Faz o request do usuario para o backend usando o token de acesso do cookie
      const response = await axios.get(`${BACKEND_URL}/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          api_key: API_KEY,
        },
      });

      return NextResponse.json(response.data);
    } catch (err: any) {
      const status = err.response?.status || 500;
      const message = err.response?.data?.detail || "Erro interno";
      return NextResponse.json({ error: message }, { status });
    }
  }
}
