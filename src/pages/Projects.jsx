"use client"
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import ProjectForm from "../components/ProjectForm"
import ProjectList from "../components/ProjectList"
import ProjectDetails from "../components/ProjectDetails"
import { useAuth } from "../context/AuthContex"
import { motion, AnimatePresence } from "framer-motion"
import { FiX, FiUpload } from "react-icons/fi" // Keep FiUpload for the modal
import { Phone } from "lucide-react"
import { ToastContainer, toast } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'

const Projects = () => {
  // Project List State
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shareLoading, setShareLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [currentProjectInfo, setCurrentProjectInfo] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [error, setError] = useState(null)

  // Project View State (props for ProjectDetails)
  const [projectDetails, setProjectDetails] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [editingFileName, setEditingFileName] = useState(null)
  const [newFileName, setNewFileName] = useState("")
  // Removed showImageDownloadModal, selectedImageFormat, downloadingImages from here
  // as they are now managed solely by ProjectDetails.jsx

  // File Upload Modal State (for adding to existing sessions)
  const [showUploadModal, setShowUploadModal] = useState(false) // Keep this for session uploads
  const [uploadFiles, setUploadFiles] = useState([]) // Keep this for session uploads
  const [uploadNotes, setUploadNotes] = useState("") // Keep this for session uploads
  const [uploading, setUploading] = useState(false) // Keep this for session uploads
  const [isDragging, setIsDragging] = useState(false) // Keep this for session uploads
  const [uploadToSessionId, setUploadToSessionId] = useState(null) // Keep this for session uploads

  // Session Management State
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)

  const { user } = useAuth()

  const modalRef = useRef(null)

  // Fetch all projects
  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowDetailsModal(false) // Hide the modal
        setShowInfoModal(false)
        // setShowImageDownloadModal(false) // Removed
        setShowUploadModal(false) // Close upload modal too
        setShowDeleteSessionModal(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/projects`)
      setProjects(response.data)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }
  const updateSessionNotes = async (sessionId, notes) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/sessions/${sessionId}`, { notes });
      fetchProjectDetails(selectedProject);
    } catch (e) {
      toast.error("Failed to update notes");
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`)
      setProjectDetails(response.data)
    } catch (error) {
      console.error("Error fetching project details:", error)
      toast.error("Failed to load project details")
    }
  }

  const handleProjectClick = async (project) => {
    const projectId = project._id
    if (selectedProject === projectId) {
      setSelectedProject(null)
      setProjectDetails(null)
    } else {
      setSelectedProject(projectId)
      await fetchProjectDetails(projectId)
    }
  }

  const getAllFiles = () => {
    if (!projectDetails) return []
    let allFiles = []

    // Get files from sessions
    if (projectDetails.sessions) {
      projectDetails.sessions.forEach((session) => {
        if (session.files) {
          allFiles = [...allFiles, ...session.files]
        }
      })
    }

    // Get legacy files
    if (projectDetails.files) {
      allFiles = [...allFiles, ...projectDetails.files]
    }

    return allFiles
  }

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const handleSelectAll = () => {
    const allFiles = getAllFiles()
    if (selectedFiles.length === allFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(allFiles.map((file) => file._id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0 || !selectedProject) return

    const confirm = await new Promise((resolve) => {
      toast.info(
        <div>
          <p>Are you sure you want to delete {selectedFiles.length} file(s)?</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss()
                resolve(true)
              }}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss()
                resolve(false)
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeButton: false
        }
      )
    })

    if (!confirm) return

    try {
      for (const fileId of selectedFiles) {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/files/${fileId}`)
      }
      setSelectedFiles([])
      fetchProjectDetails(selectedProject)
      toast.success("Files deleted successfully!")
    } catch (error) {
      toast.error("Failed to delete some files")
    }
  }

  const handleFileNameEdit = async (fileId) => {
    if (!newFileName.trim() || !selectedProject) return
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/files/${fileId}`, {
        displayName: newFileName,
      })
      setEditingFileName(null)
      setNewFileName("")
      fetchProjectDetails(selectedProject)
    } catch (error) {
      toast.error("Failed to update file name")
    }
  }

  const downloadFile = async (fileId, fileName, format = "original") => {
    if (!selectedProject) return
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/files/${fileId}/download?format=${format}`,
        { responseType: "blob" },
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success("File downloaded successfully!")
    } catch (error) {
      toast.error("Failed to download file")
    }
  }

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      uploadFiles.forEach((file) => {
        formData.append("files", file)
      })
      formData.append("notes", uploadNotes)

      // If uploading to specific session, add sessionId
      if (uploadToSessionId) {
        formData.append("sessionId", uploadToSessionId)
      }

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setShowUploadModal(false)
      setUploadFiles([])
      setUploadNotes("")
      setUploadToSessionId(null)
      fetchProjectDetails(selectedProject) // Refresh details after session upload
      toast.success("Files uploaded successfully!")
    } catch (error) {
      toast.error("Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChangeModal = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setUploadFiles(selectedFiles)
  }

  const handleDragOverModal = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeaveModal = () => {
    setIsDragging(false)
  }

  const handleDropModal = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setUploadFiles(droppedFiles)
  }

  const removeUploadFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadToSession = (sessionId) => {
    setUploadToSessionId(sessionId)
    setShowUploadModal(true)
  }

  const handleDeleteSession = (sessionId) => {
    setSessionToDelete(sessionId)
    setShowDeleteSessionModal(true)
  }

  const confirmDeleteSession = async () => {
    if (!sessionToDelete || !selectedProject) return
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/sessions/${sessionToDelete}`)
      setShowDeleteSessionModal(false)
      setSessionToDelete(null)
      fetchProjectDetails(selectedProject)
    } catch (error) {
      toast.error("Failed to delete session")
    }
  }

  const deleteUploadedFile = async (fileId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/files/${fileId}`)
      fetchProjectDetails(selectedProject)
    } catch (error) {
      setError("Failed to delete file")
      toast.error("Failed to delete file")
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDelete = async (projectId) => {
    const confirm = await new Promise((resolve) => {
      toast.info(
        <div>
          <p>Are you sure you want to delete this project?</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.dismiss()
                resolve(true)
              }}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Delete
            </button>
            <button
              onClick={() => {
                toast.dismiss()
                resolve(false)
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>,
        {
          autoClose: false,
          closeButton: false
        }
      )
    })

    if (!confirm) return

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}`)
      fetchProjects()
      if (selectedProject === projectId) {
        setSelectedProject(null)
        setProjectDetails(null)
      }
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }

  const handleShare = async (projectId) => {
    setShareLoading(true)
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/projects/${projectId}/share`)
      const shareUrl = response.data.shareUrl

      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success("Share link copied to clipboard!")
      } catch (error) {
        const textArea = document.createElement("textarea")
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        toast.success("Share link copied to clipboard!")
      }

      return response.data
    } catch (error) {
      toast.error("Failed to generate share link")
      throw error
    } finally {
      setShareLoading(false)
    }
  }

  const handleInfo = (project) => {
    const currentProjectAllFiles = project.sessions ? project.sessions.flatMap((s) => s.files || []) : []
    if (project.files) {
      currentProjectAllFiles.push(...project.files)
    }
    const totalFilesForInfo = currentProjectAllFiles.length
    const totalSizeForInfo = currentProjectAllFiles.reduce((sum, file) => sum + file.size, 0)

    setCurrentProjectInfo({
      name: project.name,
      details: project.details,
      phoneNumber: project.phoneNumber,
      type: project.type,
      shareLink: project.shareLink,
      createdBy: project.createdByType === "admin" ? "Admin" : project.createdBy.username,
      createdAt: new Date(project.createdAt).toLocaleDateString(),
      totalFiles: totalFilesForInfo,
      totalSize: totalSizeForInfo,
    })
    setShowInfoModal(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Share link copied to clipboard!")
    } catch (error) {
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      toast.success("Share link copied to clipboard!")
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
  const onEditFileName = async (fileId, newName) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/files/${fileId}`,
        { displayName: newName }
      );
      console.log("✅ File name updated successfully");
    } catch (error) {
      console.error("❌ Failed to rename file:", error);
      throw error;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      const options = { weekday: "long", month: "short", day: "numeric" }
      return date.toLocaleDateString("en-US", options)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Loading projects...</div>
      </div>
    )
  }

  const allFiles = getAllFiles()
  const totalFiles = allFiles.length
  const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
  const canManageFiles = user?.role === "admin" || projectDetails?.createdBy._id === user?.id

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-white">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Left Panel - Project List */}
      <ProjectList
        projects={projects}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedProject={selectedProject}
        onProjectClick={handleProjectClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onShare={handleShare}
        onInfo={handleInfo}
        shareLoading={shareLoading}
        user={user}
        setShowForm={setShowForm}
      />

      {/* Right Panel - Project Details */}
      <ProjectDetails
        onEditFileName={onEditFileName}
        projectDetails={projectDetails}
        selectedProject={selectedProject}
        canManageFiles={canManageFiles}
        user={user}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onUploadToSession={handleUploadToSession}
        onDeleteSession={handleDeleteSession}
        onFileSelect={handleFileSelect}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        onDownloadFile={downloadFile}
        onDeleteFile={deleteUploadedFile}
        editingFileName={editingFileName}
        setEditingFileName={setEditingFileName}
        newFileName={newFileName}
        setNewFileName={setNewFileName}
        setShowDetailsModal={setShowDetailsModal}
        fetchProjectDetails={fetchProjectDetails}
        onEditSessionNotes={updateSessionNotes}
      />

      {/* Upload Modal (for adding to existing sessions) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl"
            ref={modalRef}
          >
            <h3 className="text-lg font-semibold mb-4">
              {uploadToSessionId ? "Add Files to Session" : "Upload Files"}
            </h3>

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-4 ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
                }`}
              onDragOver={handleDragOverModal}
              onDragLeave={handleDragLeaveModal}
              onDrop={handleDropModal}
            >
              <input type="file" id="file-upload" multiple onChange={handleFileInputChangeModal} className="hidden" />
              <div className="mb-4">
                <FiUpload className="mx-auto text-4xl text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">
                {isDragging ? "Drop your files here" : "Drag & Drop files or folders"}
              </h4>
              <p className="text-gray-500 mb-4">or</p>
              <button
                onClick={() => document.getElementById("file-upload").click()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
              >
                Browse Files
              </button>
            </div>

            {/* Selected Files */}
            {uploadFiles.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Selected Files ({uploadFiles.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                        <button onClick={() => removeUploadFile(index)} className="text-red-500 hover:text-red-700">
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleUploadFiles}
                disabled={uploading || uploadFiles.length === 0}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {uploading ? "Uploading..." : "Upload Files"}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFiles([])
                  setUploadNotes("")
                  setUploadToSessionId(null)
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Session Modal */}
      {showDeleteSessionModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
            ref={modalRef}
          >
            <h3 className="text-lg font-semibold mb-4">Delete Session</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this entire session? This will permanently delete all files in this
              session and cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteSession}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium"
              >
                Delete Session
              </button>
              <button
                onClick={() => {
                  setShowDeleteSessionModal(false)
                  setSessionToDelete(null)
                }}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal (for ProjectList Info button) */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
            ref={modalRef}
          >
            <h3 className="text-lg font-semibold mb-3 md:mb-4">{currentProjectInfo?.name} Details</h3>
            <div className="space-y-2 text-sm md:text-base">
              <div>
                <span className="font-medium">Description:</span> {currentProjectInfo?.details}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" />
                <span className="font-medium">Phone:</span> {currentProjectInfo?.phoneNumber}
              </div>
              <div>
                <span className="font-medium">Created by:</span> {currentProjectInfo?.createdBy}
              </div>
              <div>
                <span className="font-medium">Created:</span> {currentProjectInfo?.createdAt}
              </div>
              <div>
                <span className="font-medium">Type:</span>{" "}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${currentProjectInfo?.type === "public"
                    ? "bg-green-100 text-green-800"
                    : currentProjectInfo?.type === "auth"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {currentProjectInfo?.type?.toUpperCase()}
                </span>
              </div>
              {currentProjectInfo?.shareLink && (
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Shared</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="font-medium">Statistics:</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="font-bold">{currentProjectInfo?.totalFiles || 0}</div>
                    <div className="text-xs text-gray-600">Total Files</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="font-bold">{formatFileSize(currentProjectInfo?.totalSize || 0)}</div>
                    <div className="text-xs text-gray-600">Total Size</div>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDetailsModal(false)}
              className="w-full mt-4 md:mt-6 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Other Modals */}
      {showForm && <ProjectForm project={editingProject} onClose={handleFormClose} onSuccess={handleFormSuccess} />}



      {showInfoModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
            ref={modalRef}
          >
            <h3 className="text-lg font-semibold mb-3 md:mb-4">{currentProjectInfo?.name} Details</h3>
            <div className="space-y-2 text-sm md:text-base">
              <div>
                <span className="font-medium">Description:</span> {currentProjectInfo?.details}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" />
                <span className="font-medium">Phone:</span> {currentProjectInfo?.phoneNumber}
              </div>
              <div>
                <span className="font-medium">Created by:</span> {currentProjectInfo?.createdBy}
              </div>
              <div>
                <span className="font-medium">Created:</span> {currentProjectInfo?.createdAt}
              </div>
              <div>
                <span className="font-medium">Type:</span>{" "}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${currentProjectInfo?.type === "public"
                    ? "bg-green-100 text-green-800"
                    : currentProjectInfo?.type === "auth"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  {currentProjectInfo?.type?.toUpperCase()}
                </span>
              </div>
              {currentProjectInfo?.shareLink && (
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Shared</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="font-medium">Statistics:</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="font-bold">{currentProjectInfo?.totalFiles || 0}</div>
                    <div className="text-xs text-gray-600">Total Files</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="font-bold">{formatFileSize(currentProjectInfo?.totalSize || 0)}</div>
                    <div className="text-xs text-gray-600">Total Size</div>
                  </div>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-4 md:mt-6 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 right-6 bg-red-100 border border-red-300 text-red-800 px-6 py-3 rounded-xl shadow-lg flex items-center max-w-sm z-50"
          >
            <FiX className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")} className="ml-3 text-red-600 hover:text-red-800">
              <FiX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Projects