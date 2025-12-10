import axios from "axios";

// Variável para armazenar a promessa de refresh em andamento
// Isso evita múltiplas chamadas simultâneas para o endpoint de refresh
let refreshPromise: Promise<boolean> | null = null;

/**
 * Realiza o refresh do token de autenticação com deduplicação de requisições.
 * Se múltiplas chamadas forem feitas simultaneamente, todas aguardarão a mesma requisição.
 *
 * @returns Promise<boolean> true se o refresh foi bem sucedido, false caso contrário
 */
export async function refreshAuthToken(): Promise<boolean> {
  // Se já existe um refresh em andamento, retorna a promessa existente
  if (refreshPromise) {
    return refreshPromise;
  }

  // Inicia uma nova requisição de refresh
  refreshPromise = (async () => {
    try {
      await axios.post("/api/auth/refresh");
      return true;
    } catch (error) {
      console.error("Falha na renovação do token:", error);
      return false;
    } finally {
      // Limpa a promessa ao finalizar para permitir futuras tentativas
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
