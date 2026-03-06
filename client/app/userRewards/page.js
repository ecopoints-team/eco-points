import NavBar from "../../src/Components/NavBar";
import Footer from "../../src/Components/Footer";
import UserRewards from "../../src/Components/UserRewards";

export default function UserRewardsPage() {
  return (
    <div className="min-h-screen background-color text-white overflow-hidden">
      <main>
        <UserRewards />
      </main>
      <Footer />
    </div>
  );
}
