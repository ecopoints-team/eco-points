import NavBar from "../../src/Components/NavBar";
import Footer from "../../src/Components/Footer";
import RewardsOrg from "../../src/Components/Rewards";

export default function RewardsPage() {
  return (
    <div className="min-h-screen deep-forest-bg text-color-content overflow-hidden">
      <NavBar />
      <main>
        <RewardsOrg />
      </main>
      <Footer />
    </div>
  );
}
