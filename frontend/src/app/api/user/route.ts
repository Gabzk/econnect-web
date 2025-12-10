import { apiGet, apiPatch } from "@/lib/api";

// Get Usuario
export async function GET() {
  return apiGet("/user", undefined, true);
}

export async function PATCH(request: Request) {
  const formData = await request.formData();
  return apiPatch("/user", formData);
}
