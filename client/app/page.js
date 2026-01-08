import NavBar from "../src/Components/NavBar";
import Hero from "../src/Components/Hero";
import Features from "../src/Components/Features";
import Services from "../src/Components/Services";
import Rewards from "../src/Components/Showcase";
import About from "../src/Components/About";
import LogIn from "../src/Components/LogIn";
import Footer from "../src/Components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <main className="flex flex-col gap-0">
        <Hero />
        <Features />
        <Services />
        <Rewards />
        <About />
        <LogIn />
      </main>
      <Footer />
    </div>
  );
}

