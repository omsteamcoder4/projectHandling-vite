"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import { FiX } from "react-icons/fi"

const ProjectForm = ({ project, onClose, onSuccess }) => {
  const modalRef = useRef(null)

  const [formData, setFormData] = useState({
    name: "",
    details: "",
    phoneNumber: "",
    type: "auth",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        details: project.details,
        phoneNumber: project.phoneNumber,
        type: project.type,
      })
    }
  }, [project])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (project) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/projects/${project._id}`, formData)
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/projects`, formData)
      }
      onSuccess()
    } catch (error) {
      setError(error.response?.data?.message || "Operation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        ref={modalRef}
        className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md mx-2 sm:mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between mb-1 sm:mb-1 lg:mb-4">
          <div className="w-6"></div> {/* Spacer for centering */}
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {project ? "Edit Project" : "Create Project"}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <FiX size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Project Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Project Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="auth">Auth - Phone verification required</option>
              <option value="public">Public - Anyone with link can upload</option>
              <option value="private">Private - No sharing allowed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-1">Description</label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter project description (optional)"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors text-sm sm:text-base"
            >
              {loading ? "Saving..." : project ? "Update" : "Create"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 sm:py-2.5 rounded-lg hover:bg-gray-600 font-medium transition-colors text-sm sm:text-base"
            >
              Cancel
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ProjectForm