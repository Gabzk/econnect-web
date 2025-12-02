import FeedComponent from "@/components/feedComponent";
import NavBarComponent from "@/components/navBarComponentClient";

export default function FeedPage() {
  return (
    <div>
      <NavBarComponent />
      <FeedComponent feedType="latest" />
    </div>
  );
}
