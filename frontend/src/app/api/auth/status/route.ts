import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    return NextResponse.json({
      isAuthenticated: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });
  } catch (_err: unknown) {
    return NextResponse.json(
      { error: "Erro ao verificar autenticação" },
      { status: 500 },
    );
  }
}
