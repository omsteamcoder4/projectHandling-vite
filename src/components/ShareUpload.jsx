"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { FiUpload, FiX, FiTrash2, FiPlus, FiCheck, FiDownload, FiClock, FiLoader } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"

const ShareUpload = () => {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [isVerified, setIsVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingFileId, setEditingFileId] = useState(null)
  const [editFileName, setEditFileName] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingSessions, setUploadingSessions] = useState({})
  const [editingNotes, setEditingNotes] = useState({})
  const [tempNotes, setTempNotes] = useState({})
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
  const [selectedImageFormat, setSelectedImageFormat] = useState("original")
  const [downloadingImages, setDownloadingImages] = useState(false)
  const [currentDownloadFile, setCurrentDownloadFile] = useState(null)

  const fetchProject = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/projects/share/${token}`)
      setProject(response.data)
      if (response.data.type === "public") {
        setIsVerified(true)
      }
    } catch (error) {
      setError("Share link expired or invalid")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const verifyPhone = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`http://localhost:5000/api/projects/share/${token}/verify`, { phoneNumber })
      setIsVerified(true)
      setError("")
    } catch (error) {
      setError(error.response?.data?.message || "Verification failed")
    }
  }

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const uploadFiles = async (files, sessionId = null, notes = "") => {
    if (files.length === 0) return

    const currentSessionId = sessionId || generateSessionId()
    const isNewSession = !sessionId

    // For new sessions, create immediately
    if (isNewSession) {
      setUploadingSessions((prev) => ({
        ...prev,
        [currentSessionId]: {
          files: files.map((file) => ({
            file,
            displayName: file.name,
            id: Math.random().toString(36).substr(2, 9),
            preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
            status: "uploading",
            progress: 0,
          })),
          notes: notes,
          timestamp: new Date(),
          status: "uploading",
          isNew: true,
        },
      }))
    } else {
      // For existing sessions, add to existing files
      setUploadingSessions((prev) => {
        const existingSession = prev[currentSessionId] || {}
        const existingFiles = existingSession.files || []

        return {
          ...prev,
          [currentSessionId]: {
            ...existingSession,
            files: [
              ...existingFiles,
              ...files.map((file) => ({
                file,
                displayName: file.name,
                id: Math.random().toString(36).substr(2, 9),
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
                status: "uploading",
                progress: 0,
              })),
            ],
            status: "uploading",
          },
        }
      })
    }

    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })
    formData.append("notes", notes)
    formData.append("sessionId", currentSessionId)

    try {
      await axios.post(`http://localhost:5000/api/projects/share/${token}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadingSessions((prev) => ({
            ...prev,
            [currentSessionId]: {
              ...prev[currentSessionId],
              files: prev[currentSessionId].files.map((f) => (f.status === "uploading" ? { ...f, progress } : f)),
            },
          }))
        },
      })

      // Mark session as completed
      setUploadingSessions((prev) => ({
        ...prev,
        [currentSessionId]: {
          ...prev[currentSessionId],
          status: "completed",
        },
      }))

      // Remove session after delay and refresh project
      setTimeout(() => {
        setUploadingSessions((prev) => {
          const newSessions = { ...prev }
          delete newSessions[currentSessionId]
          return newSessions
        })
        fetchProject()
      }, 2000)
    } catch (error) {
      setError("Upload failed. Please try again.")
      setUploadingSessions((prev) => ({
        ...prev,
        [currentSessionId]: {
          ...prev[currentSessionId],
          status: "error",
        },
      }))
    }
  }

  const handleMainFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      uploadFiles(selectedFiles) // Always create new session for main upload
    }
    e.target.value = ""
  }

  const handleAddToSession = (sessionKey) => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = (e) => {
      const selectedFiles = Array.from(e.target.files)
      if (selectedFiles.length > 0) {
        uploadFiles(selectedFiles, sessionKey) // Add to existing session
      }
    }
    input.click()
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
    if (droppedFiles.length > 0) {
      uploadFiles(droppedFiles) // Always create new session for main drop
    }
  }

  const deleteUploadedFile = async (fileId) => {
    if (!project?._id) return
    try {
      await axios.delete(`http://localhost:5000/api/projects/share/${token}/files/${fileId}`)
      fetchProject()
    } catch (error) {
      setError("Failed to delete file")
    }
  }

  const updateUploadedFile = async (fileId, updates) => {
    if (!project?._id) return
    try {
      await axios.put(`http://localhost:5000/api/projects/share/${token}/files/${fileId}`, updates)
      fetchProject()
      setEditingFileId(null)
      setEditFileName("")
    } catch (error) {
      setError("Failed to update file")
    }
  }

  const updateSessionNotes = async (sessionId, notes) => {
    if (!project?._id) return
    try {
      await axios.put(`http://localhost:5000/api/projects/share/${token}/sessions/${sessionId}`, { notes })
      fetchProject()
      setEditingNotes({})
      setTempNotes({})
    } catch (error) {
      setError("Failed to update notes")
    }
  }

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this entire session?")) return
    try {
      await axios.delete(`http://localhost:5000/api/projects/share/${token}/sessions/${sessionId}`)
      fetchProject()
    } catch (error) {
      setError("Failed to delete session")
    }
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

  const getExpirationDays = (uploadDate) => {
    const upload = new Date(uploadDate)
    const now = new Date()
    const diffTime = Math.abs(now - upload)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, 7 - diffDays)
  }

  const groupFilesBySession = () => {
    if (!project?.sessions) return {}

    return project.sessions.reduce((groups, session) => {
      const sessionId = session.sessionId
      groups[sessionId] = {
        files: session.files || [],
        timestamp: session.uploadedAt,
        notes: session.notes || "",
        sessionId,
      }
      return groups
    }, {})
  }

  const startEditing = (id, currentName) => {
    setEditingFileId(id)
    setEditFileName(currentName)
  }

  const startEditingNotes = (sessionId, currentNotes) => {
    setEditingNotes({ [sessionId]: true })
    setTempNotes({ [sessionId]: currentNotes })
  }

  const saveNotes = (sessionId) => {
    const notes = tempNotes[sessionId] || ""
    updateSessionNotes(sessionId, notes)
  }

  const cancelEditingNotes = (sessionId) => {
    setEditingNotes({})
    setTempNotes({})
  }

  const removeFileFromUploading = (sessionId, fileId) => {
    setUploadingSessions((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        files: prev[sessionId].files.filter((f) => f.id !== fileId),
      },
    }))
  }

  // Handle file name save with auto-save on change
  const handleFileNameSave = async (fileId, newName) => {
    if (!newName.trim()) return
    await updateUploadedFile(fileId, { displayName: newName })
  }

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const getSessionFiles = (sessionData) => {
    return sessionData.files || []
  }

  const getSelectedFilesInSession = (sessionData) => {
    const sessionFiles = getSessionFiles(sessionData)
    return sessionFiles.filter((file) => selectedFiles.includes(file._id))
  }

  const handleSessionDownload = (sessionData) => {
    const sessionFiles = getSessionFiles(sessionData)
    const selectedInSession = getSelectedFilesInSession(sessionData)

    if (selectedInSession.length === 0) {
      // Download all files in session
      const sessionFileIds = sessionFiles.map((file) => file._id)
      setSelectedFiles(sessionFileIds)
      handleBulkDownload(sessionFiles)
    } else {
      // Download selected files
      handleBulkDownload(selectedInSession)
    }
  }

  const handleSingleImageDownload = (file) => {
    setCurrentDownloadFile(file)
    setShowImageDownloadModal(true)
  }

  const handleBulkDownload = (files) => {
    const images = files.filter((file) => file.mimetype?.startsWith("image/"))
    if (images.length > 0) {
      setShowImageDownloadModal(true)
    } else {
      // Download non-images directly
      files.forEach(async (file) => {
        const link = document.createElement("a")
        link.href = `http://localhost:5000/api/projects/share/${token}/files/${file._id}/download`
        link.download = file.displayName
        link.click()
      })
    }
  }

  const downloadImages = async () => {
    setDownloadingImages(true)
    try {
      if (currentDownloadFile) {
        // Single file download
        const link = document.createElement("a")
        link.href = `http://localhost:5000/api/projects/share/${token}/files/${currentDownloadFile._id}/download?format=${selectedImageFormat}`
        link.download = currentDownloadFile.displayName
        link.click()
      } else {
        // Bulk download
        const selectedImages = selectedFiles
          .map((fileId) => {
            // Find file in all sessions
            for (const session of project.sessions) {
              const file = session.files.find((f) => f._id === fileId)
              if (file && file.mimetype?.startsWith("image/")) {
                return file
              }
            }
            return null
          })
          .filter(Boolean)

        for (const image of selectedImages) {
          const link = document.createElement("a")
          link.href = `http://localhost:5000/api/projects/share/${token}/files/${image._id}/download?format=${selectedImageFormat}`
          link.download = image.displayName
          link.click()
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      setShowImageDownloadModal(false)
      setCurrentDownloadFile(null)
      setSelectedFiles([])
      alert(`Image(s) downloaded successfully!`)
    } catch (error) {
      alert("Failed to download some images")
    } finally {
      setDownloadingImages(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
        >
          Loading your files...
        </motion.div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="text-red-500 text-xl font-medium mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!isVerified && project?.type === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Required</h2>
            <p className="text-gray-600">Enter your phone number to access this project</p>
          </div>
          <form onSubmit={verifyPhone}>
            <div className="mb-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (___) ___-____"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-red-500 text-sm">
                {error}
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-md"
            >
              Verify Phone Number
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  const groupedFiles = groupFilesBySession()
  const sortedSessions = Object.entries(groupedFiles).sort(
    ([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp),
  )

  const sortedUploadingSessions = Object.entries(uploadingSessions).sort(
    ([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 h-10">
            File Sharing
          </h1>
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-3 mb-8 border border-gray-100"
        >
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input type="file" id="main-file-input" multiple onChange={handleMainFileSelect} className="hidden" />
            <motion.div whileHover={{ scale: 1.05 }} className="inline-block mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <FiUpload
                  className="text-indigo-600 text-2xl cursor-pointer"
                  onClick={() => document.getElementById("main-file-input").click()}
                />
              </div>
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              {isDragging ? "Drop your files here" : "Drag & Drop files here"}
            </h3>
            <p className="text-gray-500 text-sm">or click the upload icon to browse</p>
          </div>
        </motion.div>

        {/* Recent Activities - Each Upload as Separate Box */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FiClock className="mr-2 text-indigo-600" />
            Recent Activities
          </h2>

          <div className="space-y-6">
            {/* Uploading Sessions (appear first) */}
            <AnimatePresence>
              {sortedUploadingSessions.map(([sessionId, session]) => (
                <motion.div
                  key={sessionId}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
                >
                  {/* Box Header */}
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {session.status === "uploading" && <FiLoader className="animate-spin text-indigo-600" />}
                      {session.status === "completed" && <FiCheck className="text-green-600" />}
                      {session.status === "error" && <FiX className="text-red-600" />}
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {session.status === "uploading" && "Uploading files..."}
                          {session.status === "completed" && "Upload completed!"}
                          {session.status === "error" && "Upload failed"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {session.files.length} file{session.files.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mb-4">
                    <textarea
                      placeholder="Add notes for this upload..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Files Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {session.files.map((file) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-50 rounded-lg overflow-hidden relative group"
                      >
                        <button
                          onClick={() => removeFileFromUploading(sessionId, file.id)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100 z-10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FiX className="text-red-500 text-xs" />
                        </button>

                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                          {file.preview ? (
                            <img
                              src={file.preview || "/placeholder.svg"}
                              alt="Preview"
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="text-2xl">📄</div>
                          )}
                        </div>

                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-800 truncate" title={file.displayName}>
                            {file.displayName}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">{formatFileSize(file.file.size)}</div>
                          {session.status === "uploading" && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div
                                  className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-indigo-600 mt-1">{file.progress}%</div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Existing Sessions - Each as Separate Box */}
            {sortedSessions.map(([sessionKey, sessionData]) => (
              <motion.div
                key={sessionKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6"
              >
               

                {/* Notes Section */}
               <div className="mb-4 relative flex items-start group">
                  {editingNotes[sessionKey] ? (
                    <textarea
                      value={tempNotes[sessionKey] || ""}
                      onChange={(e) => setTempNotes((prev) => ({ ...prev, [sessionKey]: e.target.value }))}
                      className="w-full px-0 py-1 text-sm text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none resize-none"
                      rows={Math.max(1, Math.min(5, (tempNotes[sessionKey]?.split('\n').length || 1)))}
                      placeholder="Type your notes here..."
                      autoFocus
                      onBlur={() => saveNotes(sessionKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          saveNotes(sessionKey);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-1 w-full">
                        <div className="flex items-center gap-1 flex-1">
                          
                          <input
                            type="text"
                             className="text-sm text-blue-800 italic font-semibold"
                            value={sessionData.notes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingNotes(sessionKey, sessionData.notes);
                            }}
                          />
                          <button
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingNotes(sessionKey, sessionData.notes);
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddToSession(sessionKey)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                        >
                          <FiPlus size={16} /> Add More
                        </motion.button>
                      </div>


                    </>
                  )}
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sessionData.files.map((file) => (
                    <motion.div
                      key={file._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -2 }}
                      className="bg-gray-50 rounded-lg overflow-hidden relative group"
                    >
                      <div className="w-full h-24 bg-gray-100 flex items-center justify-center relative">
                        {file.mimetype?.startsWith("image/") ? (
                          <img
                            src={`http://localhost:5000/${file.path}`}
                            alt={file.displayName}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="text-2xl">📄</div>
                        )}

                        {/* Action buttons overlay */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteUploadedFile(file._id)}
                            className="bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-50 p-1.5 rounded-full shadow-sm transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={12} />
                          </motion.button>
                          <motion.a
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            href={`http://localhost:5000/api/projects/share/${token}/files/${file._id}/download`}
                            className="bg-white/90 backdrop-blur-sm text-green-500 hover:bg-green-50 p-1.5 rounded-full shadow-sm transition-colors"
                            title="Download"
                          >
                            <FiDownload size={12} />
                          </motion.a>
                        </div>
                      </div>

                      <div className="p-3">
                        {editingFileId === file._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editFileName}
                              onChange={(e) => setEditFileName(e.target.value)}
                              className="flex-1 border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 text-sm"
                              autoFocus
                              onBlur={() => handleFileNameSave(file._id, editFileName)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleFileNameSave(file._id, editFileName)
                                }
                                if (e.key === "Escape") {
                                  setEditingFileId(null)
                                  setEditFileName("")
                                }
                              }}
                            />
                            <button
                              onClick={() => handleFileNameSave(file._id, editFileName)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <FiCheck size={14} />
                            </button>
                          </div>
                        ) : (
                          <p
                            className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => startEditing(file._id, file.displayName)}
                            title={`Click to edit: ${file.displayName}`}
                          >
                            {file.displayName}
                          </p>
                        )}

                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>{formatFileSize(file.size)}</span>
                          <span className={`${getExpirationDays(file.uploadedAt) <= 1 ? "text-red-500" : ""}`}>
                            {getExpirationDays(file.uploadedAt) > 0
                              ? `${getExpirationDays(file.uploadedAt)}d left`
                              : "Expired"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Empty State */}
            {sortedSessions.length === 0 && Object.keys(uploadingSessions).length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiUpload className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No files uploaded yet</h3>
                <p className="text-gray-500">Upload your first files to create your first box!</p>
              </motion.div>
            )}
          </div>
        </div>

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
    </div>
  )
}

export default ShareUpload
