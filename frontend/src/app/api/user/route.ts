import { apiGet } from "@/lib/api";

// Get Usuario
export async function GET() {
  return apiGet("/user", undefined, true);
}
