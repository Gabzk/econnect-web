import axios from "axios";
import { NextResponse } from "next/server";
import { getEnvConfig, handleApiError, validateEnvVars } from "@/lib/api";

export async function POST(request: Request) {
  const envError = validateEnvVars();
  if (envError) return envError;

  const { BACKEND_URL, API_KEY } = getEnvConfig();

  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 },
      );
    }

    // Criar FormData para enviar como multipart/form-data
    const formData = new FormData();
    formData.append("nome", body.name);
    formData.append("email", body.email);
    formData.append("senha", body.password);
    if (body.image) {
      formData.append("image", body.image);
    }

    const response = await axios.post(
      `${BACKEND_URL}/auth/register`,
      formData,
      {
        headers: {
          api_key: API_KEY,
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return NextResponse.json(response.data);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
