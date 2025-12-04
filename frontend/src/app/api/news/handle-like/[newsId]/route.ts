import { apiPost } from "@/lib/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ newsId: string }> },
) {
  const { newsId } = await params;
  return apiPost(`/news/handle-like/${newsId}`, undefined, true);
}
