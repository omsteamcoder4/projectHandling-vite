"use client"

import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
// import Footer from "../components/Footer"
import { useState } from "react"
import { useAuth } from "../context/AuthContex"

const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  console.log(isAuthenticated)

  return (
    // Removed h-screen and overflow-hidden to allow page to scroll naturally
    <div className="flex flex-col bg-white text-gray-800">
      <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Content area - removed fixed height and overflow-hidden */}
      <main className="flex-1 relative z-10">
        {/* Removed h-full and overflow-hidden from this inner div */}
        <div>
          <Outlet />
        </div>
      </main>

      {/* <Footer /> */}
    </div>
  )
}

export default MainLayout
