"use client"
import { useState, useEffect, useRef } from "react"
import { FiEdit2, FiTrash2, FiShare2, FiMoreVertical, FiInfo, FiSearch, FiFilter } from "react-icons/fi"
import { Phone, Globe, Lock, Ban, Plus } from "lucide-react"

const ProjectList = ({
  projects,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  selectedProject,
  onProjectClick,
  onEdit,
  onDelete,
  onShare,
  onInfo,
  shareLoading,
  user,
  setShowForm,
}) => {
  const [showActionMenu, setShowActionMenu] = useState(null)
  const actionMenuRefs = useRef({})

  const getTypeIcon = (type) => {
    switch (type) {
      case "public":
        return <Globe size={16} className="text-green-500" title="Public" />
      case "auth":
        return <Lock size={16} className="text-yellow-500" title="Auth" />
      case "private":
        return <Ban size={16} className="text-red-500" title="Private" />
      default:
        return (
          <span className="text-gray-500" title="Unknown">
            ❓
          </span>
        )
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      const ref = actionMenuRefs.current[showActionMenu]
      if (ref && !ref.contains(event.target)) {
        setShowActionMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showActionMenu])

  const toggleActionMenu = (projectId, e) => {
    e.stopPropagation()
    if (showActionMenu === projectId) {
      setShowActionMenu(null)
    } else {
      setShowActionMenu(projectId)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || project.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        {/* Title and Add Button */}
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <button
            onClick={() => setShowForm(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Add Project"
          >
            <Plus size={20} className="text-indigo-600" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="relative flex-1">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="public">Public</option>
              <option value="auth">Auth</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">📁</span>
            </div>
            <div className="text-gray-500 text-lg mb-2">
              {projects.length === 0 ? "No projects yet" : "No projects match your search"}
            </div>
            <div className="text-gray-400 text-sm">
              {projects.length === 0 ? "Create your first project!" : "Try adjusting your search or filter"}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {filteredProjects.map((project) => {
              const canEdit = user.role === "admin" || project.createdBy?._id === user.id
              const canDelete = user.role === "admin" || project.createdBy?._id === user.id
              const canShare = (project.type === "public" || project.type === "auth") && canEdit

              return (
                <div
                  key={project._id}
                  className={`
                    relative bg-white border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer
                    ${selectedProject === project._id
                      ? "border-indigo-500 bg-indigo-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                    }
                  `}
                  onClick={() => onProjectClick(project)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                          {getTypeIcon(project.type)}
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Phone size={14} className="mr-2 text-indigo-500 flex-shrink-0" />
                          <span className="truncate">{project.phoneNumber}</span>
                        </div>

                        {project.details && <p className="text-sm text-gray-500 line-clamp-2">{project.details}</p>}
                      </div>

                      {/* Action Menu */}
                      <div className="flex items-center" ref={(el) => (actionMenuRefs.current[project._id] = el)}>
                        <button
                          onClick={(e) => toggleActionMenu(project._id, e)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <FiMoreVertical size={16} />
                        </button>

                        {showActionMenu === project._id && (
                          <div className="absolute right-10 top-0 z-50">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onInfo(project)
                                  setShowActionMenu(null)
                                }}
                                className="absolute right-0 top-0 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 transform hover:scale-105 animate-fade-in"
                                style={{ animationDelay: '0ms' }}
                              >
                                <FiInfo className="text-gray-500" size={16} />
                              </button>

                              {canEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(project)
                                    setShowActionMenu(null)
                                  }}
                                  className="absolute right-5 top-5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105 animate-fade-in"
                                  style={{ animationDelay: '100ms' }}
                                >
                                  <FiEdit2 className="text-blue-500" size={16} />
                                </button>
                              )}

                              {canShare && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onShare(project._id)
                                    setShowActionMenu(null)
                                  }}
                                  disabled={shareLoading}
                                  className="absolute right-0 top-15 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-105 animate-fade-in disabled:opacity-50"
                                  style={{ animationDelay: '200ms' }}
                                >
                                  {shareLoading ? (
                                    <span className="animate-pulse text-gray-400">Generating link...</span>
                                  ) : (
                                    <FiShare2 className="text-green-500" size={16} />
                                  )}
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(project._id)
                                    setShowActionMenu(null)
                                  }}
                                  className="absolute right-5 top-10 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105 animate-fade-in"
                                  style={{ animationDelay: '300ms' }}
                                >
                                  <FiTrash2 className="text-red-500" size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectList