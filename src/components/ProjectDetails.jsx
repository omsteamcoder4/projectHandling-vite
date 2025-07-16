


"use client"
import { motion } from "framer-motion"
import { FiUpload, FiCheck, FiDownload, FiTrash2, FiPlus } from "react-icons/fi"
import { useState, useRef, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const ProjectDetails = ({
  projectDetails,
  selectedProject,
  canManageFiles,
  user,
  selectedFiles,
  setSelectedFiles,
  onUploadToSession,
  onDeleteSession,
  onFileSelect,
  onDownloadFile,
  onDeleteFile,
  onEditFileName,
  setNewFileName,
  newFileName,
  setShowDetailsModal,
  fetchProjectDetails,
  onEditSessionNotes,
  
}) => {
  const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
  const [selectedImageFormat, setSelectedImageFormat] = useState("original")
  const [downloadingImages, setDownloadingImages] = useState(false)
  const [currentDownloadFile, setCurrentDownloadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const modalRef = useRef(null)

  const [editingFileId, setEditingFileId] = useState(null);
  const [editFileName, setEditFileName] = useState("");

  const handleDirectUploadFiles = async (files) => {
    if (!files || files.length === 0 || !selectedProject) return

    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })
      formData.append("notes", "")

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/projects/${selectedProject}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      await fetchProjectDetails(selectedProject)
      toast.success("Files uploaded successfully!")
    } catch (error) {
      console.error("Failed to upload files:", error)
      toast.error("Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowImageDownloadModal(false)
      }
    }

    document.addEventListener("mousedown", handleOutsideClick)

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick)
    }
  }, [])

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (selectedFiles.length > 0) {
      handleDirectUploadFiles(selectedFiles)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleDirectUploadFiles(droppedFiles)
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

  const [editingNotes, setEditingNotes] = useState({});
  const [tempNotes, setTempNotes] = useState({});
  const startEditingNotes = (id, notes) => {
    setEditingNotes((prev) => ({ ...prev, [id]: true }));
    setTempNotes((prev) => ({ ...prev, [id]: notes }));
  };

  const saveNotes = async (id) => {
    const notes = tempNotes[id] ?? "";
    await onEditSessionNotes(id, notes);         // ✅ Updates backend
    await fetchProjectDetails(selectedProject);  // ✅ Forces latest notes fetch
    setEditingNotes((prev) => ({ ...prev, [id]: false }));
    setTempNotes((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };





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
    const sessionFiles = getSessionFiles(session);
    const selectedInSession = getSelectedFilesInSession(session);

    if (selectedInSession.length === 0) {
      const sessionImageFiles = sessionFiles.filter((file) => file.mimetype?.startsWith("image/"));
      if (sessionImageFiles.length > 0) {
        setSelectedFiles(sessionImageFiles.map((f) => f._id));
        setCurrentDownloadFile(null);
        setShowImageDownloadModal(true);
      } else {
        sessionFiles.forEach((file) => onDownloadFile(file._id, file.displayName));
      }
    } else {
      const selectedImagesInSession = selectedInSession.filter((file) => file.mimetype?.startsWith("image/"));
      const selectedNonImagesInSession = selectedInSession.filter((file) => !file.mimetype?.startsWith("image/"));

      if (selectedImagesInSession.length > 0) {
        setSelectedFiles(selectedImagesInSession.map((f) => f._id));
        setCurrentDownloadFile(null);
        setShowImageDownloadModal(true);
      }
      selectedNonImagesInSession.forEach((file) => onDownloadFile(file._id, file.displayName));
    }
  }

  const handleSingleImageDownload = (file) => {
    setCurrentDownloadFile(file);
    setSelectedFiles([file._id]); // Add this line to ensure selected state
    setShowImageDownloadModal(true);
  };

  const handleImageDownloadConfirmed = async () => {
    setDownloadingImages(true)
    try {
      if (currentDownloadFile) {
        let fileName = currentDownloadFile.displayName
        if (selectedImageFormat !== "original") {
          fileName = fileName.replace(/\.[^/.]+$/, `.${selectedImageFormat}`)
        }
        await onDownloadFile(currentDownloadFile._id, fileName, selectedImageFormat)
      } else {
        const imagesToDownload = getSelectedImages()
        for (const image of imagesToDownload) {
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
      setSelectedFiles([])

    } catch (error) {
      console.error("Failed to download some images:", error)
      toast.error("Failed to download some images")
    } finally {
      setDownloadingImages(false)
    }
  }

const handleFileNameEdit = async (file) => {
  const newName = (tempNames[file._id] || "").trim();
  const currName = file.displayName;

  console.log("handleFileNameEdit called:", { newName, currName });

  if (!newName || newName === currName) {
    console.log("No change, skipping rename");
    return;
  }

  try {
    await onEditFileName(file._id, newName);
    await fetchProjectDetails(selectedProject);
    console.log("Rename successful");
  } catch (err) {
    console.error("Rename failed", err);
    toast.error("Failed to update file name");
  }
};


  const [tempNames, setTempNames] = useState({});
  const startEditing = (file) => {
    setEditingFileId(file._id);
    setTempNames((p) => ({ ...p, [file._id]: file.displayName }));
  };



  const allFiles = getAllFiles()
  const totalFiles = allFiles.length

  if (!selectedProject || !projectDetails) {
    return (
      <div className="w-full lg:w-[70%] lg:pl-6 flex-grow overflow-y-auto bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex items-center justify-center h-full">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <span className="text-xl md:text-2xl">📁</span>
            </div>
            <div className="text-gray-400 text-base md:text-lg">Select a project to view details</div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full lg:w-[70%] lg:pl-6 h-full overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50"
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target.closest(".session-container")) {
          setSelectedFiles([])
        }
      }}
    >
      <div className="h-full overflow-y-auto">
        <div className="min-h-full p-4">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-6">
                {canManageFiles && (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group ${isDragging
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50"
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload-direct").click()}
                  >
                    <input
                      type="file"
                      id="file-upload-direct"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 group-hover:bg-indigo-200 rounded-full flex items-center justify-center transition-colors">
                        <FiUpload className="text-indigo-600 text-xl" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {uploading ? "Uploading..." : isDragging ? "Drop files here" : ""}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {uploading
                            ? "Please wait"
                            : isDragging
                              ? "Release to upload"
                              : "Click here or drag and drop files to upload"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {projectDetails.sessions && projectDetails.sessions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-6"
              >
                {projectDetails.sessions
                  .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
                  .map((session) => {
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
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm ${someSelected
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

                        <div className="mb-4">
                          {canManageFiles ? (
                            editingNotes[session.sessionId] ? (
                              <textarea
                                value={tempNotes[session.sessionId] ?? ""}
                                onChange={(e) =>
                                  setTempNotes((prev) => ({
                                    ...prev,
                                    [session.sessionId]: e.target.value,
                                  }))
                                }
                                onBlur={() => saveNotes(session.sessionId)}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter") {
                                    await handleFileNameEdit(file._id, editFileName);
                                    setEditingFileId(null);
                                  }
                                  if (e.key === "Escape") {
                                    setEditingFileId(null);
                                  }
                                }}
                                className="w-max text-sm resize-none outline-none min-h-[20px]"
                                rows={Math.max(
                                  1,
                                  (tempNotes[session.sessionId] || "").split("\n").length
                                )}

                              />

                            ) : (
                              <p
                                className="text-sm text-gray-700 whitespace-pre-line cursor-pointer hover:text-indigo-600"
                                onClick={() => startEditingNotes(session.sessionId, session.notes)}
                              >
                                {session.notes || "Click to add notes"}
                              </p>
                            )
                          ) : (
                            <p className="text-sm text-gray-700 whitespace-pre-line">{session.notes || "No notes"}</p>
                          )}
                        </div>


                        {sessionFiles.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {sessionFiles.map((file) => (
                              <motion.div
                                key={file._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -2 }}
                                className={`bg-gray-50 rounded-lg overflow-hidden relative group cursor-pointer ${selectedFiles.includes(file._id) ? "ring-2 ring-indigo-500" : ""
                                  }`}
                                onClick={(e) => {
                                  if (
                                    !e.target.closest('.file-name') &&
                                    !e.target.closest('.file-actions')
                                  ) {
                                    e.stopPropagation();
                                    onFileSelect(file._id);
                                  }
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

                                  {selectedFiles.includes(file._id) && (
                                    <div className="absolute top-2 left-2 bg-indigo-500 text-white rounded-full p-1">
                                      <FiCheck size={12} />
                                    </div>
                                  )}

                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 file-actions">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (file.mimetype?.startsWith("image/")) {
                                          handleSingleImageDownload(file);
                                        } else {
                                          onDownloadFile(file._id, file.displayName);
                                        }
                                      }}
                                      className="bg-white/90 backdrop-blur-sm text-green-500 hover:bg-green-50 p-1.5 rounded-full shadow-sm"
                                      title="Download"
                                    >
                                      <FiDownload size={12} />
                                    </motion.button>
                                    {canManageFiles && (
                                      <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteFile(file._id);
                                        }}
                                        className="bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-50 p-1.5 rounded-full shadow-sm"
                                        title="Delete"
                                      >
                                        <FiTrash2 size={12} />
                                      </motion.button>
                                    )}
                                  </div>
                                </div>

                                <div className="p-3">
                                  {editingFileId === file._id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        value={tempNames[file._id] || ""}
                                        onChange={e =>
                                          setTempNames(p => ({ ...p, [file._id]: e.target.value }))
                                        }
                                        autoFocus
                                        onBlur={async () => {
                                          await handleFileNameEdit(file);   // rename only here
                                          setEditingFileId(null);
                                        }}
                                        onKeyDown={async e => {
                                          if (e.key === "Enter") {
                                            await handleFileNameEdit(file);
                                            setEditingFileId(null);
                                          }
                                          if (e.key === "Escape") setEditingFileId(null);
                                        }}
                                        className="flex-1 border-b ..."
                                      />
                                      <button
                                        onClick={async e => {
                                          e.stopPropagation();
                                          await handleFileNameEdit(file);
                                          setEditingFileId(null);
                                        }}
                                      >
                                        <FiCheck size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <p onClick={() => startEditing(file)}>{file.displayName}</p>
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

            {showImageDownloadModal && (
              <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl p-4 w-full max-w-md shadow-xl md:rounded-2xl md:p-6"
                  ref={modalRef}
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
                      onClick={handleImageDownloadConfirmed}
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
                        setSelectedFiles([])
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
    </div>
  )
}

export default ProjectDetails
