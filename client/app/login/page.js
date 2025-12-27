import NavBar from "../../src/Components/NavBar";
import LogIn from "../../src/Components/LogIn";
import Footer from "../../src/Components/Footer";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-l from-lime-900 to-lime-950 text-white overflow-hidden">
      <NavBar />
      <LogIn />
      <Footer />
    </div>
  );
}
