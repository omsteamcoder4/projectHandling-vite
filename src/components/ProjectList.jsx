"use client"
import { useState, useEffect, useRef } from "react"
import { FiEdit2, FiTrash2, FiShare2, FiMoreVertical, FiInfo } from "react-icons/fi"
import { Phone, Globe, Lock, Ban, Edit } from "lucide-react"

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

  const handleWheel = (e) => {
    e.stopPropagation()
  }

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
    <div
      className="w-full lg:w-[30%] border-r border-gray-200 lg:pr-4 flex flex-col h-screen overflow-hidden"
      onWheel={handleWheel}
    >
      {/* Fixed Header Section */}
      <div className="fixed top-0 left-0 right-0 lg:right-auto lg:w-[calc(30%-1rem)] bg-white pt-2 pb-2 border-b border-gray-200 z-[100]">
        <div className="grid grid-cols-3 items-center mb-2 gap-4 p-2">
          <div></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          </div>
          <div className="flex justify-end mr-2">
            <button onClick={() => setShowForm(true)} className="p-1 hover:bg-gray-100 rounded">
              <Edit />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 p-2 bg-white">
          <div className="w-full">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto min-w-[140px] h-8 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="public">Public</option>
              <option value="auth">Auth</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mt-32 lg:mt-36" onWheel={handleWheel}>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {projects.length === 0 ? "No projects yet. Create your first project!" : "No projects match your search."}
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredProjects.map((project) => {
              const canEdit = user.role === "admin" || project.createdBy?._id === user.id
              const canDelete = user.role === "admin" || project.createdBy?._id === user.id
              const canShare = (project.type === "public" || project.type === "auth") && canEdit

              return (
                <div
                  key={project._id}
                  className={`bg-white border-b border-gray-400 hover:bg-gray-100 duration-200 cursor-pointer rounded-md ${selectedProject === project._id ? "bg-blue-100" : ""}`}
                  onClick={() => onProjectClick(project)}
                >
                  <div className="p-3">
                    <div className="flex justify-between items-center">
                      {/* Left side content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{project.name}</h3>
                          {getTypeIcon(project.type)}
                        </div>
                        <div className="flex items-center text-sm mt-1 text-gray-500">
                          <Phone size={16} className="mr-1 text-blue-400" />
                          <span className="truncate">{project.phoneNumber}</span>
                        </div>
                      </div>

                      {/* Right side menu button - vertically centered */}
                      <div
                        className="relative flex items-center ml-2"
                        ref={(el) => (actionMenuRefs.current[project._id] = el)}
                      >
                        <button
                          onClick={(e) => toggleActionMenu(project._id, e)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiMoreVertical />
                        </button>
                        {showActionMenu === project._id && (
                          <div
                            className="fixed left-95 mt-2 w-48 bg-white rounded-md shadow-lg z-[1000] py-1 border border-gray-100"
                            style={{
                              position: "fixed",
                              zIndex: 1000,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onInfo(project)
                                setShowActionMenu(null)
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                            >
                              <FiInfo className="mr-2 text-gray-500" />
                              Info
                            </button>
                            {canEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(project)
                                  setShowActionMenu(null)
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 w-full text-left"
                              >
                                <FiEdit2 className="mr-2 text-blue-500" />
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(project._id)
                                  setShowActionMenu(null)
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 w-full text-left"
                              >
                                <FiTrash2 className="mr-2 text-red-500" />
                                Delete
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
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 w-full text-left"
                              >
                                {shareLoading ? (
                                  <span className="animate-pulse text-gray-400">Loading...</span>
                                ) : (
                                  <>
                                    <FiShare2 className="mr-2 text-green-500" />
                                    Share
                                  </>
                                )}
                              </button>
                            )}
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
