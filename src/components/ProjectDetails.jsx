"use client"
import { motion } from "framer-motion"
import { FiUpload, FiInfo, FiCheck, FiDownload, FiTrash2, FiPlus } from "react-icons/fi"
import { useState } from "react"

const ProjectDetails = ({
  projectDetails,
  selectedProject,
  setSelectedProject,
  canManageFiles,
  user,
  selectedFiles,
  setSelectedFiles,
  onUploadToSession,
  onDeleteSession,
  onFileSelect,
  onSelectAll,
  onBulkDownload,
  onBulkDelete,
  onDownloadFile,
  onDeleteFile,
  onEditFileName,
  setNewFileName,
  newFileName,
  setShowUploadModal,
  setShowDetailsModal,
}) => {
  const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
  const [selectedImageFormat, setSelectedImageFormat] = useState("original")
  const [downloadingImages, setDownloadingImages] = useState(false)
  const [currentDownloadFile, setCurrentDownloadFile] = useState(null)

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

  const getFileIcon = (mimetype) => {
    if (!mimetype) return "📄"
    if (mimetype.startsWith("image/")) return "🖼️"
    if (mimetype.startsWith("video/")) return "🎥"
    if (mimetype.startsWith("audio/")) return "🎵"
    if (mimetype.includes("pdf")) return "📕"
    if (mimetype.includes("word") || mimetype.includes("document")) return "📝"
    if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) return "📊"
    if (mimetype.includes("powerpoint") || mimetype.includes("presentation")) return "📊"
    if (mimetype.includes("zip") || mimetype.includes("rar")) return "🗜️"
    return "📄"
  }

  const getAllFiles = () => {
    if (!projectDetails) return []
    let allFiles = []

    if (projectDetails.sessions) {
      projectDetails.sessions.forEach((session) => {
        if (session.files) {
          allFiles = [...allFiles, ...session.files]
        }
      })
    }

    if (projectDetails.files) {
      allFiles = [...allFiles, ...projectDetails.files]
    }

    return allFiles
  }

  const getSelectedImages = () => {
    const allFiles = getAllFiles()
    return allFiles.filter((file) => selectedFiles.includes(file._id) && file.mimetype?.startsWith("image/"))
  }

  const getSessionFiles = (session) => {
    return session.files || []
  }

  const getSelectedFilesInSession = (session) => {
    const sessionFiles = getSessionFiles(session)
    return sessionFiles.filter((file) => selectedFiles.includes(file._id))
  }

  const handleSessionDownload = (session) => {
    const sessionFiles = getSessionFiles(session)
    const selectedInSession = getSelectedFilesInSession(session)

    if (selectedInSession.length === 0) {
      // Download all files in session
      const sessionFileIds = sessionFiles.map((file) => file._id)
      setSelectedFiles(sessionFileIds)
      onBulkDownload()
    } else if (selectedInSession.length === sessionFiles.length) {
      // All files selected, download all
      onBulkDownload()
    } else {
      // Some files selected, show format options if images are included
      const selectedImages = selectedInSession.filter((file) => file.mimetype?.startsWith("image/"))
      if (selectedImages.length > 0) {
        setShowImageDownloadModal(true)
      } else {
        onBulkDownload()
      }
    }
  }

  const handleSingleImageDownload = (file) => {
    setCurrentDownloadFile(file)
    setShowImageDownloadModal(true)
  }

  const downloadImages = async () => {
    setDownloadingImages(true)
    try {
      if (currentDownloadFile) {
        // Single file download
        let fileName = currentDownloadFile.displayName
        if (selectedImageFormat !== "original") {
          fileName = fileName.replace(/\.[^/.]+$/, `.${selectedImageFormat}`)
        }
        await onDownloadFile(currentDownloadFile._id, fileName, selectedImageFormat)
      } else {
        // Bulk download
        const selectedImages = getSelectedImages()
        for (const image of selectedImages) {
          let fileName = image.displayName
          if (selectedImageFormat !== "original") {
            fileName = fileName.replace(/\.[^/.]+$/, `.${selectedImageFormat}`)
          }
          await onDownloadFile(image._id, fileName, selectedImageFormat)
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }

      setShowImageDownloadModal(false)
      setCurrentDownloadFile(null)
      if (!currentDownloadFile) {
        setSelectedFiles([])
      }
      alert(`Image(s) downloaded successfully!`)
    } catch (error) {
      alert("Failed to download some images")
    } finally {
      setDownloadingImages(false)
    }
  }

  const handleFileNameEdit = async (fileId, newName) => {
    if (!newName.trim()) return
    try {
      await onEditFileName(fileId, newName)
    } catch (error) {
      alert("Failed to update file name")
    }
  }

  const allFiles = getAllFiles()
  const totalFiles = allFiles.length

  if (!selectedProject || !projectDetails) {
    return (
      <div className="w-full lg:w-[70%] lg:pl-6 flex-grow overflow-y-auto bg-gradient-to-br from-indigo-50 to-purple-50">
  <div className="flex items-center justify-center h-screen "> {/* Adjust 64px if Navbar/Footer size changes */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
      <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
        <span className="text-xl md:text-2xl">📁</span>
      </div>
      <div className="text-gray-400 text-base md:text-lg">
        Select a project to view details
      </div>
    </motion.div>
  </div>
</div>

    )
  }

  return (
    <div
      className="w-full lg:w-[70%] lg:pl-6 overflow-y-auto bg-gradient-to-br from-indigo-50 to-purple-50"
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target.closest(".session-container")) {
          setSelectedFiles([])
        }
      }}
    >
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedProject(null)}
                className="text-indigo-500 hover:text-indigo-700 flex items-center gap-2 text-4xl"
              title="back to projects">
                ← 
              </motion.button>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDetailsModal(true)}
                className="text-indigo-500 hover:text-indigo-700 flex items-center gap-2 text-2xl"
                title="view details">
                  <FiInfo />
                  
                </motion.button>
               
                
              </div>
            </div>
           
          </motion.div>

          {/* Sessions */}
          {projectDetails.sessions && projectDetails.sessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              {projectDetails.sessions.map((session) => {
                const sessionFiles = getSessionFiles(session)
                const selectedInSession = getSelectedFilesInSession(session)
                const allSelected = selectedInSession.length === sessionFiles.length && sessionFiles.length > 0
                const someSelected = selectedInSession.length > 0 && selectedInSession.length < sessionFiles.length

                return (
                  <motion.div
                    key={session.sessionId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 session-container"
                  >
                    {/* Box Header */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">{formatDate(session.uploadedAt)}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {sessionFiles.length} file{sessionFiles.length !== 1 ? "s" : ""} uploaded
                          {selectedInSession.length > 0 && (
                            <span className="ml-2 text-indigo-600">({selectedInSession.length} selected)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {sessionFiles.length > 0 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSessionDownload(session)
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm ${
                              someSelected
                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            <FiDownload size={14} />
                            {someSelected ? "Download Selected" : "Download All"}
                          </motion.button>
                        )}
                        {canManageFiles && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onUploadToSession(session.sessionId)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm"
                          title="Add Files"
                          >
                            <FiPlus size={14} /> 
                          </motion.button>
                        )}
                        {canManageFiles && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onDeleteSession(session.sessionId)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                          title="delete session"
                          >
                            <FiTrash2 size={14} />
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mb-4 relative flex items-start group">
                      {session.notes ? (
                        <div className="w-full">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{session.notes}</p>
                        </div>
                      ) : (
                        <div className="w-full">
                          <p className="text-sm text-gray-400 italic">No notes provided for this session</p>
                        </div>
                      )}
                    </div>

                    {/* Files Grid */}
                    {sessionFiles.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {sessionFiles.map((file) => (
                          <motion.div
                            key={file._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -2 }}
                            className={`bg-gray-50 rounded-lg overflow-hidden relative group cursor-pointer ${
                              selectedFiles.includes(file._id) ? "ring-2 ring-indigo-500" : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              onFileSelect(file._id)
                            }}
                          >
                            <div className="w-full h-24 bg-gray-100 flex items-center justify-center relative">
                              {file.mimetype?.startsWith("image/") ? (
                                <img
                                  src={`${import.meta.env.VITE_API_IMAGE_URL}/${file.path}`}
                                  alt={file.displayName}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="text-2xl">{getFileIcon(file.mimetype)}</div>
                              )}

                              {/* Selection indicator */}
                              {selectedFiles.includes(file._id) && (
                                <div className="absolute top-2 left-2 bg-indigo-500 text-white rounded-full p-1">
                                  <FiCheck size={12} />
                                </div>
                              )}

                              {/* Action buttons overlay */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (file.mimetype?.startsWith("image/")) {
                                      handleSingleImageDownload(file)
                                    } else {
                                      onDownloadFile(file._id, file.displayName)
                                    }
                                  }}
                                  className="bg-white/90 backdrop-blur-sm text-green-500 hover:bg-green-50 p-1.5 rounded-full shadow-sm transition-colors"
                                  title="Download"
                                >
                                  <FiDownload size={12} />
                                </motion.button>
                                {canManageFiles && (
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onDeleteFile(file._id)
                                    }}
                                    className="bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-50 p-1.5 rounded-full shadow-sm transition-colors"
                                    title="Delete"
                                  >
                                    <FiTrash2 size={12} />
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            <div className="p-3">
                              {file._id === selectedFiles.find((id) => id === file._id) ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    className="flex-1 border-b border-gray-300 focus:border-indigo-500 focus:outline-none py-1 text-sm"
                                    autoFocus
                                    onBlur={() => handleFileNameEdit(file._id, newFileName)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleFileNameEdit(file._id, newFileName)
                                      }
                                      if (e.key === "Escape") {
                                        setSelectedFiles(selectedFiles.filter((id) => id !== file._id))
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleFileNameEdit(file._id, newFileName)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                  >
                                    <FiCheck size={14} />
                                  </button>
                                </div>
                              ) : (
                                <p
                                  className="text-sm font-medium text-gray-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (canManageFiles) {
                                      setSelectedFiles([...selectedFiles, file._id])
                                      setNewFileName(file.displayName)
                                    }
                                  }}
                                  title={file.displayName}
                                >
                                  {file.displayName}
                                </p>
                              )}

                              <div className="flex justify-between text-xs text-gray-500 mt-2">
                                <span>{formatFileSize(file.size)}</span>
                                <span>{new Date(file.uploadedAt).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Empty State */}
          {(!projectDetails.sessions || projectDetails.sessions.length === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100"
            >
              <div className="w-16 h-16 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUpload className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No files yet</h3>
              <p className="text-gray-500">Upload files to get started</p>
            </motion.div>
          )}

          {/* Image Download Modal */}
          {showImageDownloadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
              >
                <h3 className="text-lg font-semibold mb-3 md:mb-4">
                  {currentDownloadFile ? "Download Image" : "Download Images"}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                  {currentDownloadFile
                    ? `Choose format for "${currentDownloadFile.displayName}"`
                    : `You have selected ${getSelectedImages().length} image(s). Choose the format:`}
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
                    {downloadingImages ? "Downloading..." : "Download"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowImageDownloadModal(false)
                      setCurrentDownloadFile(null)
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-medium text-sm"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
