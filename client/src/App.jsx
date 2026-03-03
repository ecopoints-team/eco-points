import NavBar from "./Components/NavBar";
import Hero from "./Components/Hero";
import Features from "./Components/Features";
import Carousel from "./Components/Carousel";
import Services from "./Components/Services";
import Rewards from "./Components/Showcase";
import Footer from "./Components/Footer";

function App() {
  return (
    <div className="soft-sage-bg">
      <div className="">
        <button>
          <ChevronDownCircle className="soft-sage-bg" />
        </button>
      </div>
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
