import FeedComponent from "@/components/feedComponent";
import NavBarComponent from "@/components/navBarComponent";
import ProtectedRoute from "@/components/protectedRoute";

export default function HottestPage() {
  return (
    <div>
      <NavBarComponent />
      <ProtectedRoute showLoginPrompt={true}>
        <FeedComponent feedType="hottest" />
      </ProtectedRoute>
    </div>
  );
}
