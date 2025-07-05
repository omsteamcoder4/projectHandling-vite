"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContex"
import { useNavigate } from "react-router-dom"

const ProjectCard = ({ project, onEdit, onDelete, onShare }) => {
  const navigate=useNavigate()
  const { user } = useAuth()
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareExpiry, setShareExpiry] = useState("")
  const [shareLoading, setShareLoading] = useState(false)
  

  const canEdit = user.role === "admin" || project.createdBy._id === user.id
  const canDelete = user.role === "admin" || project.createdBy._id === user.id
  const canShare = (project.type === "public" || project.type === "auth") && canEdit

  const handleShare = async () => {
    setShareLoading(true)
    try {
      const response = await onShare(project._id)
      setShareUrl(response.shareUrl)
      setShareExpiry(new Date(response.expiryDate).toLocaleDateString())
      setShowShareModal(true)
    } catch (error) {
      alert("Failed to generate share link")
    } finally {
      setShareLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert("Share link copied to clipboard!")
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      alert("Share link copied to clipboard!")
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "public":
        return "bg-green-100 text-green-800"
      case "auth":
        return "bg-yellow-100 text-yellow-800"
      case "private":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
              <p className="text-sm text-gray-500">📞 {project.phoneNumber}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(project.type)}`}>
              {project.type.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
            <span>Created by: {project.createdByType === "admin" ? "Admin" : project.createdBy.username}</span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(project)}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(project._id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            )}
            {canShare && (
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {shareLoading ? "..." : "Share"}
              </button>
            )}
            <button
              onClick={() => navigate(`/projects/${project._id}`)}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition-colors"
            >
              View Files
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Share Project</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this link to allow others to upload files to your project.
              <br />
              <strong>Expires on:</strong> {shareExpiry}
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectCard
