import { apiGet } from "@/lib/api";

enum FeedType {
  LATEST = "latest",
  HOTTEST = "hottest",
  LIKED = "liked",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const feedType = searchParams.get("feedType") || FeedType.LATEST;

  // Feed de curtidos requer autenticação
  const requireAuth = feedType === FeedType.LIKED;

  return apiGet(`/news/feed/${feedType}`, { skip, limit }, requireAuth);
}
