import FeedComponent from "@/components/feedComponent";
import NavBarComponent from "@/components/navBarComponent";
import ProtectedRoute from "@/components/protectedRoute";

export default function FeedPage() {
  return (
    <div>
      <NavBarComponent />
      <ProtectedRoute showLoginPrompt={true}>
        <FeedComponent feedType="latest" />
      </ProtectedRoute>
    </div>
  );
}
