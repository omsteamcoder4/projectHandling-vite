"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated,setIsAuthenticated]= useState(false)

  // Set up axios defaults
  const token = localStorage.getItem("token")
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          const response = await axios.get("http://localhost:5000/api/auth/me")
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem("token")
          delete axios.defaults.headers.common["Authorization"]
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      })

      const { token, user } = response.data
      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const register = async (username, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        password,
      })

      const { token, user } = response.data
      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
