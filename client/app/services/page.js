import NavBar from "../../src/Components/NavBar";
import Services from "../../src/Components/Services";
import Footer from "../../src/Components/Footer";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <Services />
      <Footer />
    </div>
  );
}
