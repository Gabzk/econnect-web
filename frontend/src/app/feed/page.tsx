"use client";

import FeedComponent from "@/components/feedComponent";
import NavBarComponent from "@/components/navBarComponent";
import ProtectedRoute from "@/components/protectedRoute";
import { useAuth } from "@/hooks/useAuth";

export default function FeedPage() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log(isAuthenticated);
  return (
    <div>
      <NavBarComponent />
      <ProtectedRoute showLoginPrompt={true}>
        <FeedComponent feedType="latest"/>
      </ProtectedRoute>
    </div>
  );
}
