import NavBarComponent from "@/components/navBarComponent";
import ProfileComponent from "@/components/profileComponent";
import ProtectedRoute from "@/components/protectedRoute";

export default function ProfilePage() {
    return (
        <>
            <NavBarComponent/>
            <ProtectedRoute showLoginPrompt={true}>
                <ProfileComponent/>
            </ProtectedRoute>
        </>
    );
}