"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import ProjectForm from "../components/ProjectForm"
import ProjectList from "../components/ProjectList"
import ProjectDetails from "../components/ProjectDetails"
import { useAuth } from "../context/AuthContex"
import { motion, AnimatePresence } from "framer-motion"
import { FiX, FiUpload } from "react-icons/fi"
import { Phone } from "lucide-react"

const Projects = () => {
  // Project List State
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareExpiry, setShareExpiry] = useState("")
  const [shareLoading, setShareLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [currentProjectInfo, setCurrentProjectInfo] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [error, setError] = useState(null)

  // Project View State
  const [projectDetails, setProjectDetails] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [editingFileName, setEditingFileName] = useState(null)
  const [newFileName, setNewFileName] = useState("")
  const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
  const [selectedImageFormat, setSelectedImageFormat] = useState("original")
  const [downloadingImages, setDownloadingImages] = useState(false)

  // File Upload State
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFiles, setUploadFiles] = useState([])
  const [uploadNotes, setUploadNotes] = useState("")
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadToSessionId, setUploadToSessionId] = useState(null)

  // Session Management State
  const [showDeleteSessionModal, setShowDeleteSessionModal] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)

  const { user } = useAuth()

  // Fetch all projects
  useEffect(() => {
    fetchProjects()
  }, [])

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

  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`)
      setProjectDetails(response.data)
    } catch (error) {
      console.error("Error fetching project details:", error)
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

  const getSelectedImages = () => {
    const allFiles = getAllFiles()
    return allFiles.filter((file) => selectedFiles.includes(file._id) && file.mimetype?.startsWith("image/"))
  }

  const getSelectedNonImages = () => {
    const allFiles = getAllFiles()
    return allFiles.filter((file) => selectedFiles.includes(file._id) && !file.mimetype?.startsWith("image/"))
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
    if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
      try {
        for (const fileId of selectedFiles) {
          await axios.delete(`http://localhost:5000/api/projects/${selectedProject}/files/${fileId}`)
        }
        setSelectedFiles([])
        fetchProjectDetails(selectedProject)
        alert("Files deleted successfully!")
      } catch (error) {
        alert("Failed to delete some files")
      }
    }
  }

  const handleFileNameEdit = async (fileId) => {
    if (!newFileName.trim() || !selectedProject) return
    try {
      await axios.put(`http://localhost:5000/api/projects/${selectedProject}/files/${fileId}`, {
        displayName: newFileName,
      })
      setEditingFileName(null)
      setNewFileName("")
      fetchProjectDetails(selectedProject)
    } catch (error) {
      alert("Failed to update file name")
    }
  }

  const downloadFile = async (fileId, fileName, format = "original") => {
    if (!selectedProject) return
    try {
      const response = await axios.get(
        `http://localhost:5000/api/projects/${selectedProject}/files/${fileId}/download?format=${format}`,
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
    } catch (error) {
      alert("Failed to download file")
    }
  }

  const downloadImages = async () => {
    const selectedImages = getSelectedImages()
    if (selectedImages.length === 0 || !selectedProject) return
    setDownloadingImages(true)
    try {
      for (const image of selectedImages) {
        let fileName = image.displayName
        if (selectedImageFormat !== "original") {
          fileName = fileName.replace(/\.[^/.]+$/, `.${selectedImageFormat}`)
        }
        await downloadFile(image._id, fileName, selectedImageFormat)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      setShowImageDownloadModal(false)
      setSelectedFiles([])
      alert(`${selectedImages.length} image(s) downloaded successfully!`)
    } catch (error) {
      alert("Failed to download some images")
    } finally {
      setDownloadingImages(false)
    }
  }

  const downloadNonImages = async () => {
    const nonImages = getSelectedNonImages()
    for (const file of nonImages) {
      await downloadFile(file._id, file.displayName)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const handleBulkDownload = () => {
    const selectedImages = getSelectedImages()
    const selectedNonImages = getSelectedNonImages()
    if (selectedImages.length > 0) {
      setShowImageDownloadModal(true)
    } else if (selectedNonImages.length > 0) {
      downloadNonImages()
      setSelectedFiles([])
    }
  }

  // File Upload Functions
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

      await axios.post(`http://localhost:5000/api/projects/${selectedProject}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setShowUploadModal(false)
      setUploadFiles([])
      setUploadNotes("")
      setUploadToSessionId(null)
      fetchProjectDetails(selectedProject)
      alert("Files uploaded successfully!")
    } catch (error) {
      alert("Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setUploadFiles(selectedFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
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
      await axios.delete(`http://localhost:5000/api/projects/${selectedProject}/sessions/${sessionToDelete}`)
      setShowDeleteSessionModal(false)
      setSessionToDelete(null)
      fetchProjectDetails(selectedProject)
      alert("Session deleted successfully!")
    } catch (error) {
      alert("Failed to delete session")
    }
  }

  const deleteUploadedFile = async (fileId) => {
    try {
      await axios.delete(`http://localhost:5000/api/projects/${selectedProject}/files/${fileId}`)
      fetchProjectDetails(selectedProject)
    } catch (error) {
      setError("Failed to delete file")
    }
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
        if (selectedProject === projectId) {
          setSelectedProject(null)
          setProjectDetails(null)
        }
      } catch (error) {
        alert("Failed to delete project")
      }
    }
  }

  const handleShare = async (projectId) => {
    setShareLoading(true)
    try {
      const response = await axios.post(`http://localhost:5000/api/projects/${projectId}/share`)
      setShareUrl(response.data.shareUrl)
      setShareExpiry(new Date(response.data.expiryDate).toLocaleDateString())
      setShowShareModal(true)
      return response.data
    } catch (error) {
      alert("Failed to generate share link")
      throw error
    } finally {
      setShareLoading(false)
    }
  }

  const handleInfo = (project) => {
    setCurrentProjectInfo({
      createdBy: project.createdByType === "admin" ? "Admin" : project.createdBy.username,
      createdAt: new Date(project.createdAt).toLocaleDateString(),
    })
    setShowInfoModal(true)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Share link copied to clipboard!")
    } catch (error) {
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Share link copied to clipboard!")
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
    <div className="flex flex-col lg:flex-row h-full">
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
        projectDetails={projectDetails}
        selectedProject={selectedProject}
        setSelectedProject={setSelectedProject}
        canManageFiles={canManageFiles}
        user={user}
        selectedFiles={selectedFiles}
        setSelectedFiles={setSelectedFiles}
        onUploadToSession={handleUploadToSession}
        onDeleteSession={handleDeleteSession}
        onFileSelect={handleFileSelect}
        onSelectAll={handleSelectAll}
        onBulkDownload={handleBulkDownload}
        onBulkDelete={handleBulkDelete}
        onDownloadFile={downloadFile}
        onDeleteFile={deleteUploadedFile}
        onEditFileName={handleFileNameEdit}
        editingFileName={editingFileName}
        setEditingFileName={setEditingFileName}
        newFileName={newFileName}
        setNewFileName={setNewFileName}
        setShowUploadModal={setShowUploadModal}
        setShowDetailsModal={setShowDetailsModal}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-4">
              {uploadToSessionId ? "Add Files to Session" : "Upload Files"}
            </h3>

            {/* Drag and Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-4 ${
                isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input type="file" id="file-upload" multiple onChange={handleFileInputChange} className="hidden" />
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Add notes for this upload..."
              />
            </div>

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
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

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
          >
            <h3 className="text-lg font-semibold mb-3 md:mb-4">{projectDetails?.name} Details</h3>
            <div className="space-y-2 text-sm md:text-base">
              <div>
                <span className="font-medium">Description:</span> {projectDetails?.details}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-indigo-500" />
                <span className="font-medium">Phone:</span> {projectDetails?.phoneNumber}
              </div>
              <div>
                <span className="font-medium">Created by:</span>{" "}
                {projectDetails?.createdByType === "admin" ? "Admin" : projectDetails?.createdBy.username}
              </div>
              <div>
                <span className="font-medium">Created:</span> {formatDate(projectDetails?.createdAt)}
              </div>
              <div>
                <span className="font-medium">Type:</span>{" "}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    projectDetails?.type === "public"
                      ? "bg-green-100 text-green-800"
                      : projectDetails?.type === "auth"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {projectDetails?.type.toUpperCase()}
                </span>
              </div>
              {projectDetails?.shareLink && (
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Shared</span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="font-medium">Statistics:</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="font-bold">{totalFiles}</div>
                    <div className="text-xs text-gray-600">Total Files</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="font-bold">{formatFileSize(totalSize)}</div>
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

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
          >
            <h3 className="text-lg font-semibold mb-3 md:mb-4">Share Project</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
              Share this link to allow others to upload files to your project.
              <br />
              <strong>Expires on:</strong> {shareExpiry}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-lg text-xs md:text-sm bg-gray-50"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={copyToClipboard}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 text-xs md:text-sm font-medium"
              >
                Copy
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium text-sm"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
          >
            <h3 className="text-lg font-semibold mb-3 md:mb-4">Project Information</h3>
            <div className="space-y-2 text-sm md:text-base">
              <div>
                <span className="font-medium">Created by:</span> {currentProjectInfo?.createdBy}
              </div>
              <div>
                <span className="font-medium">Created on:</span> {currentProjectInfo?.createdAt}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-4 md:mt-6 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium text-sm"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      )}

      {showImageDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
          >
            <h3 className="text-lg font-semibold mb-3 md:mb-4">Download Images</h3>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
              You have selected {getSelectedImages().length} image(s). Choose the format for images:
            </p>
            <div className="space-y-2 mb-4 md:mb-6">
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  name="imageFormat"
                  value="original"
                  checked={selectedImageFormat === "original"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                Original Format
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  name="imageFormat"
                  value="jpg"
                  checked={selectedImageFormat === "jpg"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                JPG
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  name="imageFormat"
                  value="png"
                  checked={selectedImageFormat === "png"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                PNG
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="radio"
                  name="imageFormat"
                  value="webp"
                  checked={selectedImageFormat === "webp"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                WebP
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={downloadImages}
                disabled={downloadingImages}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 font-medium text-sm"
              >
                {downloadingImages ? "Downloading..." : "Download All"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowImageDownloadModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium text-sm"
              >
                Cancel
              </motion.button>
            </div>
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
