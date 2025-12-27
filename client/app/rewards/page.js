import NavBar from "../../src/Components/NavBar";
import Rewards from "../../src/Components/Rewards";
import Footer from "../../src/Components/Footer";

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <Rewards />
      <Footer />
    </div>
  );
}
