import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(_request: Request) {
  try {
    const cookieStore = await cookies();

    // Deletar os cookies
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return NextResponse.json({ message: "Logout realizado com sucesso" });
  } catch (_err: unknown) {
    return NextResponse.json(
      { error: "Erro ao fazer logout" },
      { status: 500 },
    );
  }
}
