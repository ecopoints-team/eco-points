import NavBar from "./Components/NavBar";
import Hero from "./Components/Hero";
import Features from "./Components/Features";
import Carousel from "./Components/Carousel";
import Services from "./Components/Services";
import Rewards from "./Components/Showcase";
import Footer from "./Components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <Hero />
      <Features />
      <Carousel />
      <Services />
      <Rewards />
      <Footer />
    </div>
  );
}

export default App;
