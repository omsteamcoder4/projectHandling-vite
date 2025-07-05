import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState } from "react";
import { useAuth } from '../context/AuthContex';


const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
const { isAuthenticated } = useAuth(); 
    console.log(isAuthenticated)

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />
      
      {/* Content (no margin shift) */}
      <main className="relative z-10">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;