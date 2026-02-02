import NavBar from "../../src/Components/NavBar";
import Footer from "../../src/Components/Footer";
import UserRewards from "../../src/Components/UserRewards";

export default function UserRewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <main>
        <UserRewards />
      </main>
      <Footer />
    </div>
  );
}
