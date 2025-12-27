import NavBar from "../../src/Components/NavBar";
import Features from "../../src/Components/Features";
import Footer from "../../src/Components/Footer";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <Features />
      <Footer />
    </div>
  );
}
