"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import ProjectCard from "../components/ProjectCard"
import ProjectForm from "../components/ProjectForm"

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, filterType])

  const fetchProjects = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/projects")
      setProjects(response.data)
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = projects

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.details.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((project) => project.type === filterType)
    }

    setFilteredProjects(filtered)
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDelete = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await axios.delete(`http://localhost:5000/api/projects/${projectId}`)
        fetchProjects()
      } catch (error) {
        alert("Failed to delete project")
      }
    }
  }

  const handleShare = async (projectId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/projects/${projectId}/share`)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  const handleFormSuccess = () => {
    fetchProjects()
    handleFormClose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-[30%]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div></div>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">Projects</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white p-2 mt-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="public">Public</option>
            <option value="auth">Auth</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {projects.length === 0 ? "No projects yet. Create your first project!" : "No projects match your search."}
          </div>
        </div>
      ) : (
        <div className="">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && <ProjectForm project={editingProject} onClose={handleFormClose} onSuccess={handleFormSuccess} />}
    </div>
  )
}

export default Projects
