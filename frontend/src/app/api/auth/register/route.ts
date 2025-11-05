import { NextResponse } from "next/server";
import axios from "axios";

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

    console.log("Body recebido no frontend:", body);

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Email, senha e nome são obrigatórios" },
        { status: 400 },
      );
    }

    // Criar FormData para enviar como multipart/form-data
    const formData = new FormData();
    formData.append('nome', body.name);
    formData.append('email', body.email);
    formData.append('senha', body.password);
    // Só adiciona o campo 'image' se fornecido
    if (body.image) {
      formData.append('image', body.image);
    }

    console.log("Enviando FormData para o backend");

    const response = await axios.post(`${BACKEND_URL}/auth/register`, formData, {
      headers: { 
        api_key: API_KEY,
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("Resposta do backend de registro:", response.data);

    return NextResponse.json({ message: "Registro bem-sucedido" });
  } catch (err: any) {
    // Axios joga erro para status >= 400, então capturamos aqui
    console.error("Erro completo:", err.response?.data);
    const status = err.response?.status || 500;
    const message = err.response?.data?.detail || "Erro interno";
    return NextResponse.json({ error: message }, { status });
  }
}
