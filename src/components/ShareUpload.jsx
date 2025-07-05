"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"

const ShareUpload = () => {
  const { token } = useParams()
  const [project, setProject] = useState(null)
  const [isVerified, setIsVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [files, setFiles] = useState([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [token])

  const fetchProject = async () => {
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
  }

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

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles((prev) => [
      ...prev,
      ...selectedFiles.map((file) => ({
        file,
        displayName: file.name,
        notes: "",
        id: Math.random().toString(36).substr(2, 9),
      })),
    ])
  }

  const updateFileName = (id, newName) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, displayName: newName } : f)))
  }

  const updateFileNotes = (id, newNotes) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, notes: newNotes } : f)))
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploadProgress(true)
    const formData = new FormData()

    files.forEach((fileObj) => {
      formData.append("files", fileObj.file)
    })
    formData.append("notes", notes)

    try {
      await axios.post(`http://localhost:5000/api/projects/share/${token}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setFiles([])
      setNotes("")
      fetchProject() // Refresh to show uploaded files
      alert("Files uploaded successfully!")
    } catch (error) {
      setError("Upload failed. Please try again.")
    } finally {
      setUploadProgress(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    )
  }

  if (!isVerified && project?.type === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Phone Verification</h2>
          <p className="text-gray-600 mb-4">Please enter the phone number to access this project.</p>

          <form onSubmit={verifyPhone}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              required
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600">
              Verify
            </button>
          </form>
        </div>
      </div>
    )
  }

  const fileGroups = project?.files ? groupFilesByDate(project.files) : {}

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{project?.name}</h1>
          <p className="text-gray-600 mb-4">{project?.details}</p>
          <div className="flex items-center gap-4">
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

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Upload Files</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 hover:border-gray-400 transition-colors">
            <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-lg">Click to upload files or drag and drop</p>
                <p className="text-sm">Images, PDFs, Documents, Folders</p>
              </div>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-4 mb-4">
              <h3 className="font-semibold">Selected Files:</h3>
              {files.map((fileObj) => (
                <div key={fileObj.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={fileObj.displayName}
                      onChange={(e) => updateFileName(fileObj.id, e.target.value)}
                      className="font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                    />
                    <button onClick={() => removeFile(fileObj.id)} className="text-red-500 hover:text-red-700 ml-2">
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{formatFileSize(fileObj.file.size)}</p>
                  <input
                    type="text"
                    placeholder="Add notes for this file..."
                    value={fileObj.notes}
                    onChange={(e) => updateFileNotes(fileObj.id, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="General notes for this upload..."
              className="w-full p-3 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploadProgress}
            className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadProgress ? "Uploading..." : "Upload Files"}
          </button>
        </div>

        {/* Uploaded Files Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">My Activity</h2>

          {Object.keys(fileGroups).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No files uploaded yet</p>
          ) : (
            Object.entries(fileGroups).map(([date, dateFiles]) => (
              <div key={date} className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">{date}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateFiles.map((file) => (
                    <div key={file._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate text-sm">{file.displayName}</h4>
                        <span className="text-xs text-gray-500 ml-2">{formatFileSize(file.size)}</span>
                      </div>
                      {file.notes && <p className="text-sm text-gray-600 mb-2">{file.notes}</p>}
                      <p className="text-xs text-gray-400">{new Date(file.uploadedAt).toLocaleTimeString()}</p>
                      <div className="mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {file.mimetype?.split("/")[0] || "file"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ShareUpload
