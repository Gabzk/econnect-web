import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getEnvConfig, handleApiError, validateEnvVars } from "@/lib/api";

export async function POST(_request: Request) {
  const envError = validateEnvVars();
  if (envError) return envError;

  const { BACKEND_URL, API_KEY } = getEnvConfig();

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token não encontrado" },
        { status: 401 },
      );
    }

    const response = await axios.post(
      `${BACKEND_URL}/auth/refresh?refresh_token=${refreshToken}`,
      {},
      { headers: { api_key: API_KEY } },
    );

    const { access_token, refresh_token: new_refresh_token } = response.data;

    // Atualizar o access_token no cookie
    cookieStore.set({
      name: "access_token",
      value: access_token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
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
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return NextResponse.json({
      message: "Token atualizado com sucesso",
      access_token,
    });
  } catch (err: unknown) {
    const error = err as { response?: { status?: number; data?: unknown } };
    const status = error.response?.status || 500;

    // Se o refresh token expirou ou é inválido, limpar os cookies
    if (status === 401 || status === 403) {
      const cookieStore = await cookies();
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
    }

    return handleApiError(err);
  }
}
