import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;
const API_KEY = process.env.API_KEY;

enum FeedType {
  LATEST = "latest",
  HOTTEST = "hottest",
  LIKED = "liked",
}

export async function GET(request: Request) {
  // Verificações básicas de ambiente
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

  const cookiesStore = await cookies();
  const accessToken = cookiesStore.get("access_token")?.value;

  // Pegar parâmetros da URL
  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const feedType = searchParams.get("feedType") || FeedType.LATEST;

  try {
    const response = await axios.get(`${BACKEND_URL}/news/feed/${feedType}`, {
      headers: { api_key: API_KEY, Authorization: `Bearer ${accessToken}` },
      params: { skip, limit },
    });

    // Retorna os dados da API do backend
    return NextResponse.json(response.data);
  } catch (err: unknown) {
    const error = err as {
      response?: { status?: number; data?: { detail?: string } };
    };
    const status = error.response?.status || 500;
    const message = error.response?.data?.detail || "Erro interno";
    return NextResponse.json({ error: message }, { status });
  }
}
