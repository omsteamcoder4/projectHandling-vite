"use client"

import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { useState } from "react"
import { useAuth } from "../context/AuthContex"

const MainLayout = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  console.log(isAuthenticated)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white text-gray-800">
      <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Content with fixed height and scroll containment */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div className="h-full overflow-hidden">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default MainLayout
