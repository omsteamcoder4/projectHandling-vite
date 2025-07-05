"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContex"
import axios from "axios"

const ProjectView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingFileName, setEditingFileName] = useState(null)
  const [newFileName, setNewFileName] = useState("")
  const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
  const [selectedImageFormat, setSelectedImageFormat] = useState("original")
  const [downloadingImages, setDownloadingImages] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/projects/${id}`)
      setProject(response.data)
    } catch (error) {
      setError("Project not found or access denied")
    } finally {
      setLoading(false)
    }
  }

  const groupFilesByDate = (files) => {
    const groups = {}
    files.forEach((file) => {
      const date = new Date(file.uploadedAt).toDateString()
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()

      let dateLabel = date
      if (date === today) dateLabel = "Today"
      else if (date === yesterday) dateLabel = "Yesterday"

      if (!groups[dateLabel]) groups[dateLabel] = []
      groups[dateLabel].push(file)
    })
    return groups
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

  const isImageFile = (mimetype) => {
    return mimetype && mimetype.startsWith("image/")
  }

  const getSelectedImages = () => {
    if (!project?.files) return []
    return project.files.filter((file) => selectedFiles.includes(file._id) && isImageFile(file.mimetype))
  }

  const getSelectedNonImages = () => {
    if (!project?.files) return []
    return project.files.filter((file) => selectedFiles.includes(file._id) && !isImageFile(file.mimetype))
  }

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === project.files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(project.files.map((file) => file._id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return

    if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
      try {
        for (const fileId of selectedFiles) {
          await axios.delete(`http://localhost:5000/api/projects/${id}/files/${fileId}`)
        }
        setSelectedFiles([])
        fetchProject()
        alert("Files deleted successfully!")
      } catch (error) {
        alert("Failed to delete some files")
      }
    }
  }

  const handleFileNameEdit = async (fileId) => {
    if (!newFileName.trim()) return

    try {
      await axios.put(`http://localhost:5000/api/projects/${id}/files/${fileId}`, {
        displayName: newFileName,
      })
      setEditingFileName(null)
      setNewFileName("")
      fetchProject()
    } catch (error) {
      alert("Failed to update file name")
    }
  }

  const startEditFileName = (file) => {
    setEditingFileName(file._id)
    setNewFileName(file.displayName)
  }

  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/projects/${id}/files/${fileId}/download`, {
        responseType: "blob",
      })

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

  // Convert image to specified format using Canvas API
  const convertImageFormat = (imageBlob, targetFormat, fileName) => {
    return new Promise((resolve) => {
      const img = new Image()
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const mimeType = `image/${targetFormat}`
        canvas.toBlob(
          (blob) => {
            const newFileName = fileName.replace(/\.[^/.]+$/, `.${targetFormat}`)
            resolve({ blob, fileName: newFileName })
          },
          mimeType,
          0.9,
        )
      }

      img.src = URL.createObjectURL(imageBlob)
    })
  }

  const downloadImages = async () => {
    const selectedImages = getSelectedImages()
    if (selectedImages.length === 0) return

    setDownloadingImages(true)

    try {
      for (const image of selectedImages) {
        // Download original image
        const response = await axios.get(`http://localhost:5000/api/projects/${id}/files/${image._id}/download`, {
          responseType: "blob",
        })

        let finalBlob = response.data
        let finalFileName = image.displayName

        // Convert format if not original
        if (selectedImageFormat !== "original") {
          const converted = await convertImageFormat(response.data, selectedImageFormat, image.displayName)
          finalBlob = converted.blob
          finalFileName = converted.fileName
        }

        // Download the file
        const url = window.URL.createObjectURL(finalBlob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", finalFileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

        // Small delay between downloads to prevent browser blocking
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
      // Small delay between downloads
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

  const canManageFiles = user?.role === "admin" || project?.createdBy._id === user?.id

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button onClick={() => navigate("/")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const fileGroups = project?.files ? groupFilesByDate(project.files) : {}
  const totalFiles = project?.files?.length || 0
  const totalSize = project?.files?.reduce((sum, file) => sum + file.size, 0) || 0
  const selectedImages = getSelectedImages()
  const selectedNonImages = getSelectedNonImages()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate("/")} className="text-blue-500 hover:text-blue-700 flex items-center gap-2">
              ← Back to Projects
            </button>
            <div className="flex gap-2">
              {project?.shareLink && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Shared</span>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  project?.type === "public"
                    ? "bg-green-100 text-green-800"
                    : project?.type === "auth"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {project?.type?.toUpperCase()}
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{project?.name}</h1>
          <p className="text-gray-600 mb-4">{project?.details}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Phone:</span> {project?.phoneNumber}
            </div>
            <div>
              <span className="font-medium">Created by:</span>{" "}
              {project?.createdByType === "admin" ? "Admin" : project?.createdBy?.username}
            </div>
            <div>
              <span className="font-medium">Created:</span> {new Date(project?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📁</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalFiles}</div>
                <div className="text-gray-600">Total Files</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💾</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatFileSize(totalSize)}</div>
                <div className="text-gray-600">Total Size</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{Object.keys(fileGroups).length}</div>
                <div className="text-gray-600">Upload Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* File Management Controls */}
        {canManageFiles && totalFiles > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={handleSelectAll} className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  {selectedFiles.length === totalFiles ? "Deselect All" : "Select All"}
                </button>
                {selectedFiles.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {selectedFiles.length} file(s) selected
                    {selectedImages.length > 0 && (
                      <span className="ml-2 text-blue-600">({selectedImages.length} images)</span>
                    )}
                  </div>
                )}
              </div>
              {selectedFiles.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDownload}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                  >
                    Download Selected
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
                  >
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Files Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Files</h2>

          {Object.keys(fileGroups).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No files uploaded yet</div>
              {project?.shareLink && (
                <p className="text-sm text-gray-400 mt-2">Share your project link to start receiving files</p>
              )}
            </div>
          ) : (
            Object.entries(fileGroups).map(([date, dateFiles]) => (
              <div key={date} className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-4 text-lg border-b pb-2">{date}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dateFiles.map((file) => (
                    <div
                      key={file._id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        selectedFiles.includes(file._id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      {canManageFiles && (
                        <div className="flex justify-between items-start mb-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file._id)}
                            onChange={() => handleFileSelect(file._id)}
                            className="rounded"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditFileName(file)}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                              title="Edit name"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => downloadFile(file._id, file.displayName)}
                              className="text-green-500 hover:text-green-700 text-xs"
                              title="Download"
                            >
                              ⬇️
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getFileIcon(file.mimetype)}</span>
                        <div className="flex-1 min-w-0">
                          {editingFileName === file._id ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={newFileName}
                                onChange={(e) => setNewFileName(e.target.value)}
                                className="flex-1 text-sm border rounded px-2 py-1"
                                onKeyPress={(e) => e.key === "Enter" && handleFileNameEdit(file._id)}
                                autoFocus
                              />
                              <button
                                onClick={() => handleFileNameEdit(file._id)}
                                className="text-green-500 hover:text-green-700 text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingFileName(null)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <h4 className="font-medium text-sm truncate" title={file.displayName}>
                              {file.displayName}
                            </h4>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Size: {formatFileSize(file.size)}</div>
                        <div>Type: {file.mimetype?.split("/")[1] || "unknown"}</div>
                        <div>Uploaded: {new Date(file.uploadedAt).toLocaleTimeString()}</div>
                        {file.uploadedBy && <div>By: {file.uploadedBy}</div>}
                      </div>

                      {file.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Notes:</strong> {file.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Image Download Modal */}
      {showImageDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Download Images</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have selected {selectedImages.length} image(s) and {selectedNonImages.length} other file(s). Choose
              the format for images:
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageFormat"
                  value="original"
                  checked={selectedImageFormat === "original"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2"
                />
                Original Format
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageFormat"
                  value="jpg"
                  checked={selectedImageFormat === "jpg"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2"
                />
                JPG
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageFormat"
                  value="png"
                  checked={selectedImageFormat === "png"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2"
                />
                PNG
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="imageFormat"
                  value="webp"
                  checked={selectedImageFormat === "webp"}
                  onChange={(e) => setSelectedImageFormat(e.target.value)}
                  className="mr-2"
                />
                WebP
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={downloadImages}
                disabled={downloadingImages}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {downloadingImages ? "Downloading..." : "Download All"}
              </button>
              <button
                onClick={() => setShowImageDownloadModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectView
