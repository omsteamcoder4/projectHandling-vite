"use client"
import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { FiUpload, FiX, FiEdit2, FiTrash2, FiPlus, FiCheck } from "react-icons/fi"

const ShareUpload = () => {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [isVerified, setIsVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [files, setFiles] = useState([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploadStatus, setUploadStatus] = useState(null)
  const [editingFileId, setEditingFileId] = useState(null)
  const [editFileName, setEditFileName] = useState("")

  // Fetch project data
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

  // Phone verification
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

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles) => {
    setFiles(prev => [
      ...prev,
      ...newFiles.map(file => ({
        file,
        displayName: file.name,
        notes: "",
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        status: 'pending'
      }))
    ])
  }

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  // Update file name
  const updateFileName = (id, newName) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, displayName: newName } : f))
  }

  // Remove file
  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // Start editing file name
  const startEditing = (id, currentName) => {
    setEditingFileId(id)
    setEditFileName(currentName)
  }

  // Save edited file name
  const saveFileName = (id) => {
    updateFileName(id, editFileName)
    setEditingFileId(null)
    setEditFileName("")
  }

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploadStatus('uploading')
    const formData = new FormData()

    files.forEach(fileObj => {
      formData.append("files", fileObj.file)
    })
    formData.append("notes", notes)

    try {
      await axios.post(`http://localhost:5000/api/projects/share/${token}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setFiles([])
      setNotes("")
      setUploadStatus('success')
      fetchProject()
    } catch (error) {
      setError("Upload failed. Please try again.")
      setUploadStatus('error')
    }
  }

  // Delete uploaded file
  const deleteUploadedFile = async (fileId) => {
    if (!project?._id) return

    try {
      await axios.delete(`http://localhost:5000/api/projects/${project._id}/files/${fileId}`)
      fetchProject()
    } catch (error) {
      setError("Failed to delete file")
    }
  }

  // Update uploaded file
  const updateUploadedFile = async (fileId, updates) => {
    if (!project?._id) return

    try {
      await axios.put(`http://localhost:5000/api/projects/${project._id}/files/${fileId}`, updates)
      fetchProject()
    } catch (error) {
      setError("Failed to update file")
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse text-xl">Loading project...</div>
      </div>
    )
  }

  // Error state
  if (error && !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  // Phone verification form
  if (!isVerified && project?.type === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🔒 Verification Required</h2>
            <p className="text-gray-600">Enter the phone number to access this project</p>
          </div>

          <form onSubmit={verifyPhone}>
            <div className="mb-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (___) ___-____"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {error && (
              <div className="mb-4 text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
            >
              Verify Phone Number
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Main container */}
      <div className="max-w-3xl mx-auto">
        {/* Project header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{project?.name}</h1>
          <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {project?.type?.toUpperCase()}
          </div>
        </div>

        {/* Upload section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {/* Drag and drop area */}
          <div
            className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center mb-4 hover:border-green-500 transition-colors cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex justify-center">
              <button
                type="button"
                className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                aria-label="Add files"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the div's click
                  document.getElementById('file-input').click();
                }}
              >
                +
              </button>
            </div>
            <p className="mt-4 text-gray-500">Or drag and drop files here</p>
          </div>
        

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="mb-6">
            <div className="mb-3">
              <h3 className="font-medium text-gray-700">Selected Files ({files.length})</h3>
              <button
                onClick={uploadFiles}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <FiCheck /> Done
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {files.map(fileObj => (
                <div key={fileObj.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                  {/* Remove Button (Top-right X) */}
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100 z-10"
                  >
                    <FiX className="text-red-500 text-sm" />
                  </button>

                  {/* Image or Icon */}
                  <div className="w-full h-36 bg-gray-50 flex items-center justify-center">
                    {fileObj.preview ? (
                      <img
                        src={fileObj.preview}
                        alt="Preview"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-3xl">📄</div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="p-3">
                    {editingFileId === fileObj.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editFileName}
                          onChange={(e) => setEditFileName(e.target.value)}
                          className="flex-1 border-b border-gray-300 focus:border-green-500 focus:outline-none py-1 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => saveFileName(fileObj.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <FiCheck />
                        </button>
                      </div>
                    ) : (
                      <p
                        className="text-sm font-medium text-gray-800 truncate cursor-pointer"
                        onClick={() => startEditing(fileObj.id, fileObj.displayName)}
                        title={fileObj.displayName}
                      >
                        {fileObj.displayName}
                      </p>
                    )}

                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(fileObj.file.size)}</span>
                      {uploadStatus === 'uploading' && (
                        <span className="text-green-600 animate-pulse">Uploading...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes field */}
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Add Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about these files..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={3}
          />
        </div>
      </div>

      {/* Uploaded files section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        {project.files.map(file => (
          <div key={file._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">

            {/* Delete Button */}
            <button
              onClick={() => deleteUploadedFile(file._id)}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100 z-10"
            >
              <FiTrash2 className="text-red-500 text-sm" />
            </button>

            {/* Image or Icon Preview */}
            <div className="w-full h-30 bg-gray-50 flex items-center justify-center">
              {file.mimetype?.startsWith("image/") ? (
                <img
                  src={`/api/projects/${project._id}/files/${file._id}/download`} // or actual CDN/image path
                  alt={file.displayName}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="text-3xl text-gray-400">📄</div>
              )}
            </div>

            {/* File Info */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-800 truncate" title={file.displayName}>
                  {file.displayName}
                </h4>
                <button
                  onClick={() => {
                    setEditFileName(file.displayName)
                    updateUploadedFile(file._id, { displayName: editFileName })
                  }}
                  className="text-gray-500 hover:text-green-600"
                  title="Rename"
                >
                  <FiEdit2 size={14} />
                </button>
              </div>

              <div className="text-xs text-gray-500">
                {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
              </div>

              {file.notes && (
                <div className="mt-2 text-xs text-gray-600">
                  <strong>Notes:</strong> {file.notes}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status messages */}
      {uploadStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
          Files uploaded successfully!
        </div>
      )}
      {uploadStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error || "Upload failed. Please try again."}
        </div>
      )}
    </div>
    </div >
  )
}

export default ShareUpload