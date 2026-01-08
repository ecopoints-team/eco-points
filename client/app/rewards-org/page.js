import NavBar from "../../src/Components/NavBar";
import Footer from "../../src/Components/Footer";
import RewardsOrg from "../../src/Components/Rewards";

export default function RewardsOrgPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <main>
        <RewardsOrg />
      </main>
      <Footer />
    </div>
  );
}
