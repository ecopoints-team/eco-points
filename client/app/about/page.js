import NavBar from "../../src/Components/NavBar";
import About from "../../src/Components/About";
import Footer from "../../src/Components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <About />
      <Footer />
    </div>
  );
}
