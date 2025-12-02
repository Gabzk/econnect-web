import FeedComponent from "@/components/feedComponent";
import NavBarComponent from "@/components/navBarComponentClient";

export default function HottestPage() {
  return (
    <div>
      <NavBarComponent />
      <FeedComponent feedType="hottest" />
    </div>
  );
}
