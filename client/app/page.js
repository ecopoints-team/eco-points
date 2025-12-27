import NavBar from "../src/Components/NavBar";
import Hero from "../src/Components/Hero";
import Footer from "../src/Components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <Hero />
      <Footer />
    </div>
  );
}

