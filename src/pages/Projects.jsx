// "use client"

// import { useState, useEffect, useRef } from "react"
// import axios from "axios"
// import ProjectForm from "../components/ProjectForm"
// import { useAuth } from "../context/AuthContex"
// import { FiEdit2, FiTrash2, FiShare2, FiMoreVertical } from "react-icons/fi"
// import { Phone, Globe, Lock, Ban } from "lucide-react"


// const Projects = () => {
//   // Project List State
//   const [projects, setProjects] = useState([])
//   const [filteredProjects, setFilteredProjects] = useState([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [filterType, setFilterType] = useState("all")
//   const [showForm, setShowForm] = useState(false)
//   const [editingProject, setEditingProject] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [showShareModal, setShowShareModal] = useState(false)
//   const [shareUrl, setShareUrl] = useState("")
//   const [shareExpiry, setShareExpiry] = useState("")
//   const [shareLoading, setShareLoading] = useState(false)
//   const [showActionMenu, setShowActionMenu] = useState(null)
//   const [selectedProject, setSelectedProject] = useState(null)
//   const actionMenuRef = useRef(null)

//   // Project View State
//   const [projectDetails, setProjectDetails] = useState(null)
//   const [selectedFiles, setSelectedFiles] = useState([])
//   const [showDeleteModal, setShowDeleteModal] = useState(false)
//   const [editingFileName, setEditingFileName] = useState(null)
//   const [newFileName, setNewFileName] = useState("")
//   const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
//   const [selectedImageFormat, setSelectedImageFormat] = useState("original")
//   const [downloadingImages, setDownloadingImages] = useState(false)

//   const { user } = useAuth()

//   // Fetch all projects
//   useEffect(() => {
//     fetchProjects()
//     return () => {
//       document.removeEventListener('click', handleClickOutside)
//     }
//   }, [])

//   // Filter projects
//   useEffect(() => {
//     filterProjects()
//   }, [projects, searchTerm, filterType])

//   // Handle clicks outside action menu
//   const handleClickOutside = (event) => {
//     if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
//       setShowActionMenu(null)
//       document.removeEventListener('click', handleClickOutside)
//     }
//   }

//   const fetchProjects = async () => {
//     try {
//       const response = await axios.get("http://localhost:5000/api/projects")
//       setProjects(response.data)
//     } catch (error) {
//       console.error("Error fetching projects:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const filterProjects = () => {
//     let filtered = projects

//     if (searchTerm) {
//       filtered = filtered.filter(
//         (project) =>
//           project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           project.details.toLowerCase().includes(searchTerm.toLowerCase()),
//       )
//     }

//     if (filterType !== "all") {
//       filtered = filtered.filter((project) => project.type === filterType)
//     }

//     setFilteredProjects(filtered)
//   }

//   const fetchProjectDetails = async (projectId) => {
//     try {
//       const response = await axios.get(`http://localhost:5000/api/projects/${projectId}`)
//       setProjectDetails(response.data)
//     } catch (error) {
//       console.error("Error fetching project details:", error)
//     }
//   }

//   const handleProjectClick = async (project) => {
//     const projectId = project._id
//     if (selectedProject === projectId) {
//       setSelectedProject(null)
//       setProjectDetails(null)
//     } else {
//       setSelectedProject(projectId)
//       await fetchProjectDetails(projectId)
//     }
//   }

//   const groupFilesByDate = (files) => {
//     const groups = {}
//     files.forEach((file) => {
//       const date = new Date(file.uploadedAt).toDateString()
//       const today = new Date().toDateString()
//       const yesterday = new Date(Date.now() - 86400000).toDateString()

//       let dateLabel = date
//       if (date === today) dateLabel = "Today"
//       else if (date === yesterday) dateLabel = "Yesterday"

//       if (!groups[dateLabel]) groups[dateLabel] = []
//       groups[dateLabel].push(file)
//     })
//     return groups
//   }

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return "0 Bytes"
//     const k = 1024
//     const sizes = ["Bytes", "KB", "MB", "GB"]
//     const i = Math.floor(Math.log(bytes) / Math.log(k))
//     return (parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i])
//   }


//   const getFileIcon = (mimetype) => {
//     if (!mimetype) return "📄"
//     if (mimetype.startsWith("image/")) return "🖼️"
//     if (mimetype.startsWith("video/")) return "🎥"
//     if (mimetype.startsWith("audio/")) return "🎵"
//     if (mimetype.includes("pdf")) return "📕"
//     if (mimetype.includes("word") || mimetype.includes("document")) return "📝"
//     if (mimetype.includes("excel") || mimetype.includes("spreadsheet")) return "📊"
//     if (mimetype.includes("powerpoint") || mimetype.includes("presentation")) return "📊"
//     if (mimetype.includes("zip") || mimetype.includes("rar")) return "🗜️"
//     return "📄"
//   }

//   const isImageFile = (mimetype) => {
//     return mimetype && mimetype.startsWith("image/")
//   }

//   const getSelectedImages = () => {
//     if (!projectDetails?.files) return []
//     return projectDetails.files.filter((file) => selectedFiles.includes(file._id) && isImageFile(file.mimetype))
//   }

//   const getSelectedNonImages = () => {
//     if (!projectDetails?.files) return []
//     return projectDetails.files.filter((file) => selectedFiles.includes(file._id) && !isImageFile(file.mimetype))
//   }

//   const handleFileSelect = (fileId) => {
//     setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
//   }

//   const handleSelectAll = () => {
//     if (!projectDetails?.files) return
//     if (selectedFiles.length === projectDetails.files.length) {
//       setSelectedFiles([])
//     } else {
//       setSelectedFiles(projectDetails.files.map((file) => file._id))
//     }
//   }

//   const handleBulkDelete = async () => {
//     if (selectedFiles.length === 0 || !selectedProject) return

//     if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
//       try {
//         for (const fileId of selectedFiles) {
//           await axios.delete(`http://localhost:5000/api/projects/${selectedProject}/files/${fileId}`)
//         }
//         setSelectedFiles([])
//         fetchProjectDetails(selectedProject)
//         alert("Files deleted successfully!")
//       } catch (error) {
//         alert("Failed to delete some files")
//       }
//     }
//   }

//   const handleFileNameEdit = async (fileId) => {
//     if (!newFileName.trim() || !selectedProject) return

//     try {
//       await axios.put(`http://localhost:5000/api/projects/${selectedProject}/files/${fileId}`, {
//         displayName: newFileName,
//       })
//       setEditingFileName(null)
//       setNewFileName("")
//       fetchProjectDetails(selectedProject)
//     } catch (error) {
//       alert("Failed to update file name")
//     }
//   }

//   const startEditFileName = (file) => {
//     setEditingFileName(file._id)
//     setNewFileName(file.displayName)
//   }

//   const downloadFile = async (fileId, fileName) => {
//     if (!selectedProject) return
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/projects/${selectedProject}/files/${fileId}/download`,
//         { responseType: "blob" }
//       )

//       const url = window.URL.createObjectURL(new Blob([response.data]))
//       const link = document.createElement("a")
//       link.href = url
//       link.setAttribute("download", fileName)
//       document.body.appendChild(link)
//       link.click()
//       link.remove()
//       window.URL.revokeObjectURL(url)
//     } catch (error) {
//       alert("Failed to download file")
//     }
//   }

//   const convertImageFormat = (imageBlob, targetFormat, fileName) => {
//     return new Promise((resolve) => {
//       const img = new Image()
//       const canvas = document.createElement("canvas")
//       const ctx = canvas.getContext("2d")

//       img.onload = () => {
//         canvas.width = img.width
//         canvas.height = img.height
//         ctx.drawImage(img, 0, 0)

//         const mimeType = `image/${targetFormat}`
//         canvas.toBlob(
//           (blob) => {
//             const newFileName = fileName.replace(/\.[^/.]+$/, `.${targetFormat}`)
//             resolve({ blob, fileName: newFileName })
//           },
//           mimeType,
//           0.9
//         )
//       }

//       img.src = URL.createObjectURL(imageBlob)
//     })
//   }

//   const downloadImages = async () => {
//     const selectedImages = getSelectedImages()
//     if (selectedImages.length === 0 || !selectedProject) return

//     setDownloadingImages(true)

//     try {
//       for (const image of selectedImages) {
//         const response = await axios.get(
//           `http://localhost:5000/api/projects/${selectedProject}/files/${image._id}/download`,
//           { responseType: "blob" }
//         )

//         let finalBlob = response.data
//         let finalFileName = image.displayName

//         if (selectedImageFormat !== "original") {
//           const converted = await convertImageFormat(response.data, selectedImageFormat, image.displayName)
//           finalBlob = converted.blob
//           finalFileName = converted.fileName
//         }

//         const url = window.URL.createObjectURL(finalBlob)
//         const link = document.createElement("a")
//         link.href = url
//         link.setAttribute("download", finalFileName)
//         document.body.appendChild(link)
//         link.click()
//         link.remove()
//         window.URL.revokeObjectURL(url)

//         await new Promise((resolve) => setTimeout(resolve, 500))
//       }

//       setShowImageDownloadModal(false)
//       setSelectedFiles([])
//       alert(`${selectedImages.length} image(s) downloaded successfully!`)
//     } catch (error) {
//       alert("Failed to download some images")
//     } finally {
//       setDownloadingImages(false)
//     }
//   }

//   const downloadNonImages = async () => {
//     const nonImages = getSelectedNonImages()
//     for (const file of nonImages) {
//       await downloadFile(file._id, file.displayName)
//       await new Promise((resolve) => setTimeout(resolve, 500))
//     }
//   }

//   const handleBulkDownload = () => {
//     const selectedImages = getSelectedImages()
//     const selectedNonImages = getSelectedNonImages()

//     if (selectedImages.length > 0) {
//       setShowImageDownloadModal(true)
//     } else if (selectedNonImages.length > 0) {
//       downloadNonImages()
//       setSelectedFiles([])
//     }
//   }

//   const handleEdit = (project) => {
//     setEditingProject(project)
//     setShowForm(true)
//     setShowActionMenu(null)
//   }

//   const handleDelete = async (projectId) => {
//     if (window.confirm("Are you sure you want to delete this project?")) {
//       try {
//         await axios.delete(`http://localhost:5000/api/projects/${projectId}`)
//         fetchProjects()
//         if (selectedProject === projectId) {
//           setSelectedProject(null)
//           setProjectDetails(null)
//         }
//       } catch (error) {
//         alert("Failed to delete project")
//       }
//     }
//     setShowActionMenu(null)
//   }

//   const handleShare = async (projectId) => {
//     setShareLoading(true)
//     try {
//       const response = await axios.post(`http://localhost:5000/api/projects/${projectId}/share`)
//       setShareUrl(response.data.shareUrl)
//       setShareExpiry(new Date(response.data.expiryDate).toLocaleDateString())
//       setShowShareModal(true)
//       return response.data
//     } catch (error) {
//       alert("Failed to generate share link")
//       throw error
//     } finally {
//       setShareLoading(false)
//       setShowActionMenu(null)
//     }
//   }

//   const copyToClipboard = async () => {
//     try {
//       await navigator.clipboard.writeText(shareUrl)
//       alert("Share link copied to clipboard!")
//     } catch (error) {
//       const textArea = document.createElement("textarea")
//       textArea.value = shareUrl
//       document.body.appendChild(textArea)
//       textArea.select()
//       document.execCommand("copy")
//       document.body.removeChild(textArea)
//       alert("Share link copied to clipboard!")
//     }
//   }

//   const getTypeIcon = (type) => {
//     switch (type) {
//       case "public":
//         return <Globe size={16} className="text-green-500" title="Public" />
//       case "auth":
//         return <Lock size={16} className="text-yellow-500" title="Auth" />
//       case "private":
//         return <Ban size={16} className="text-red-500" title="Private" />
//       default:
//         return <span className="text-gray-500" title="Unknown">❓</span>
//     }
//   }

//   const handleFormClose = () => {
//     setShowForm(false)
//     setEditingProject(null)
//   }

//   const handleFormSuccess = () => {
//     fetchProjects()
//     handleFormClose()
//   }

//   const toggleActionMenu = (projectId, e) => {
//     e.stopPropagation()
//     if (showActionMenu === projectId) {
//       setShowActionMenu(null)
//       document.removeEventListener('click', handleClickOutside)
//     } else {
//       setShowActionMenu(projectId)
//       document.addEventListener('click', handleClickOutside)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <div className="text-xl">Loading projects...</div>
//       </div>
//     )
//   }

//   const fileGroups = projectDetails?.files ? groupFilesByDate(projectDetails.files) : {}
//   const totalFiles = projectDetails?.files?.length || 0
//   const totalSize = projectDetails?.files?.reduce((sum, file) => sum + file.size, 0) || 0
//   const canManageFiles = user?.role === "admin" || projectDetails?.createdBy._id === user?.id

//   return (
//     <div className="flex h-full">
//       {/* Left Panel - Project List */}
//       <div className="w-[30%] border-r border-gray-200 pr-4 overflow-y-auto">
//         <div className="grid grid-cols-3 items-center mb-2 gap-4">
//           <div></div>
//           <h2 className="text-xl font-bold text-gray-900 mt-1">Projects</h2>
//           <button
//             onClick={() => setShowForm(true)}
//             className="bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none  mt-2 text-sm"
//           >
//             Create Project
//           </button>
//         </div>

//         <div className="flex flex-col sm:flex-row items-center gap-3 m-3">
//           <div className="flex-1 w-full">
//             <input
//               type="text"
//               placeholder="Search projects..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full h-8 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
//             />
//           </div>
//           <div className="w-full sm:w-auto">
//             <select
//               value={filterType}
//               onChange={(e) => setFilterType(e.target.value)}
//               className="w-full sm:w-auto min-w-[140px] h-8 px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Types</option>
//               <option value="public">Public</option>
//               <option value="auth">Auth</option>
//               <option value="private">Private</option>
//             </select>
//           </div>
//         </div>


//         {filteredProjects.length === 0 ? (
//           <div className="text-center py-12">
//             <div className="text-gray-500 text-lg">
//               {projects.length === 0 ? "No projects yet. Create your first project!" : "No projects match your search."}
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {filteredProjects.map((project) => {
//               const canEdit = user.role === "admin" || project.createdBy._id === user.id
//               const canDelete = user.role === "admin" || project.createdBy._id === user.id
//               const canShare = (project.type === "public" || project.type === "auth") && canEdit

//               return (
//                 <div
//                   key={project._id}
//                   className={`bg-white border-b border-gray-400 hover:bg-gray-100 duration-200 ml-2 cursor-pointer mb-0 rounded-md ${selectedProject === project._id ? ' bg-blue-100' : ''}`}

//                   onClick={() => handleProjectClick(project)}
//                 >
//                   <div className="p-1 ml-2">
//                     <div className="flex justify-between items-start">
//                       <div className="flex items-center gap-1 ">
//                         <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
//                         {getTypeIcon(project.type)}
//                       </div>
//                       <div className="flex justify-between items-center text-sm text-gray-500">
//                         <span>By: {project.createdByType === "admin" ? "Admin" : project.createdBy.username}</span>
//                       </div>
//                       <div className="relative" ref={actionMenuRef}>
//                         <button
//                           onClick={(e) => toggleActionMenu(project._id, e)}
//                           className="p-1 rounded-full hover:bg-gray-100"
//                         >
//                           <FiMoreVertical />
//                         </button>
//                         {showActionMenu === project._id && (
//                           <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-100">
//                             {canEdit && (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation()
//                                   handleEdit(project)
//                                 }}
//                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 w-full text-left"
//                               >
//                                 <FiEdit2 className="mr-2 text-blue-500" />
//                                 Edit
//                               </button>
//                             )}
//                             {canDelete && (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation()
//                                   handleDelete(project._id)
//                                 }}
//                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 w-full text-left"
//                               >
//                                 <FiTrash2 className="mr-2 text-red-500" />
//                                 Delete
//                               </button>
//                             )}
//                             {canShare && (
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation()
//                                   handleShare(project._id)
//                                 }}
//                                 disabled={shareLoading}
//                                 className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-green-50 w-full text-left"
//                               >
//                                 {shareLoading ? (
//                                   <span className="animate-pulse text-gray-400">Loading...</span>
//                                 ) : (
//                                   <>
//                                     <FiShare2 className="mr-2 text-green-500" />
//                                     Share
//                                   </>
//                                 )}
//                               </button>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>



//                     <div className="flex justify-between items-center text-sm">
//                       <div className="flex items-center text-gray-500">
//                         <Phone size={16} className="mr-1 text-blue-400" />
//                         {project.phoneNumber}
//                       </div>
//                       <span className="text-gray-400">{new Date(project.createdAt).toLocaleDateString()}</span>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </div>

//       {/* Right Panel - Project Details */}
//       <div className="w-[70%] pl-6 overflow-y-auto">
//         {selectedProject && projectDetails ? (
//           <div className="min-h-screen bg-gray-50">
//             <div className="max-w-7xl mx-auto">
//               {/* Header */}
//               <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <button
//                     onClick={() => setSelectedProject(null)}
//                     className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
//                   >
//                     ← Back to Projects
//                   </button>
//                   <div className="flex gap-2">
//                     {projectDetails.shareLink && (
//                       <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Shared</span>
//                     )}
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm ${projectDetails.type === "public"
//                         ? "bg-green-100 text-green-800"
//                         : projectDetails.type === "auth"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : "bg-red-100 text-red-800"
//                         }`}
//                     >
//                       {projectDetails.type.toUpperCase()}
//                     </span>
//                   </div>
//                 </div>

//                 <h1 className="text-3xl font-bold text-gray-900 mb-2">{projectDetails.name}</h1>
//                 <p className="text-gray-600 mb-2">{projectDetails.details}</p>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//                   <div>
//                     <span className="font-medium">Phone:</span> {projectDetails.phoneNumber}
//                   </div>
//                   <div>
//                     <span className="font-medium">Created by:</span>{" "}
//                     {projectDetails.createdByType === "admin" ? "Admin" : projectDetails.createdBy.username}
//                   </div>
//                   <div>
//                     <span className="font-medium">Created:</span> {new Date(projectDetails.createdAt).toLocaleDateString()}
//                   </div>
//                 </div>
//               </div>

//               {/* Statistics */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                   <div className="flex items-center">
//                     <div className="text-3xl mr-4">📁</div>
//                     <div>
//                       <div className="text-2xl font-bold text-gray-900">{totalFiles}</div>
//                       <div className="text-gray-600">Total Files</div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                   <div className="flex items-center">
//                     <div className="text-3xl mr-4">💾</div>
//                     <div>
//                       <div className="text-2xl font-bold text-gray-900">{formatFileSize(totalSize)}</div>
//                       <div className="text-gray-600">Total Size</div>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="bg-white rounded-lg shadow-md p-6">
//                   <div className="flex items-center">
//                     <div className="text-3xl mr-4">📊</div>
//                     <div>
//                       <div className="text-2xl font-bold text-gray-900">{Object.keys(fileGroups).length}</div>
//                       <div className="text-gray-600">Upload Days</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* File Management Controls */}
//               {canManageFiles && totalFiles > 0 && (
//                 <div className="bg-white rounded-lg shadow-md p-4 mb-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                       <button
//                         onClick={handleSelectAll}
//                         className="text-blue-500 hover:text-blue-700 text-sm font-medium"
//                       >
//                         {selectedFiles.length === totalFiles ? "Deselect All" : "Select All"}
//                       </button>
//                       {selectedFiles.length > 0 && (
//                         <div className="text-sm text-gray-600">
//                           {selectedFiles.length} file(s) selected
//                           {getSelectedImages().length > 0 && (
//                             <span className="ml-2 text-blue-600">({getSelectedImages().length} images)</span>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                     {selectedFiles.length > 0 && (
//                       <div className="flex gap-2">
//                         <button
//                           onClick={handleBulkDownload}
//                           className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
//                         >
//                           Download Selected
//                         </button>
//                         <button
//                           onClick={handleBulkDelete}
//                           className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
//                         >
//                           Delete Selected
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Files Section */}
//               <div className="bg-white rounded-lg shadow-md p-6">
//                 <h2 className="text-xl font-bold mb-4">Files</h2>

//                 {Object.keys(fileGroups).length === 0 ? (
//                   <div className="text-center py-12">
//                     <div className="text-gray-500 text-lg">No files uploaded yet</div>
//                     {projectDetails.shareLink && (
//                       <p className="text-sm text-gray-400 mt-2">Share your project link to start receiving files</p>
//                     )}
//                   </div>
//                 ) : (
//                   Object.entries(fileGroups).map(([date, dateFiles]) => (
//                     <div key={date} className="mb-8">
//                       <h3 className="font-semibold text-gray-700 mb-4 text-lg border-b pb-2">{date}</h3>
//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                         {dateFiles.map((file) => (
//                           <div
//                             key={file._id}
//                             className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${selectedFiles.includes(file._id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
//                               }`}
//                           >
//                             {canManageFiles && (
//                               <div className="flex justify-between items-start mb-2">
//                                 <input
//                                   type="checkbox"
//                                   checked={selectedFiles.includes(file._id)}
//                                   onChange={() => handleFileSelect(file._id)}
//                                   className="rounded"
//                                 />
//                                 <div className="flex gap-1">
//                                   <button
//                                     onClick={() => startEditFileName(file)}
//                                     className="text-blue-500 hover:text-blue-700 text-xs"
//                                     title="Edit name"
//                                   >
//                                     ✏️
//                                   </button>
//                                   <button
//                                     onClick={() => downloadFile(file._id, file.displayName)}
//                                     className="text-green-500 hover:text-green-700 text-xs"
//                                     title="Download"
//                                   >
//                                     ⬇️
//                                   </button>
//                                 </div>
//                               </div>
//                             )}

//                             <div className="flex items-center mb-2">
//                               <span className="text-2xl mr-2">{getFileIcon(file.mimetype)}</span>
//                               <div className="flex-1 min-w-0">
//                                 {editingFileName === file._id ? (
//                                   <div className="flex gap-1">
//                                     <input
//                                       type="text"
//                                       value={newFileName}
//                                       onChange={(e) => setNewFileName(e.target.value)}
//                                       className="flex-1 text-sm border rounded px-2 py-1"
//                                       onKeyPress={(e) => e.key === "Enter" && handleFileNameEdit(file._id)}
//                                       autoFocus
//                                     />
//                                     <button
//                                       onClick={() => handleFileNameEdit(file._id)}
//                                       className="text-green-500 hover:text-green-700 text-xs"
//                                     >
//                                       ✓
//                                     </button>
//                                     <button
//                                       onClick={() => setEditingFileName(null)}
//                                       className="text-red-500 hover:text-red-700 text-xs"
//                                     >
//                                       ✕
//                                     </button>
//                                   </div>
//                                 ) : (
//                                   <h4 className="font-medium text-sm truncate" title={file.displayName}>
//                                     {file.displayName}
//                                   </h4>
//                                 )}
//                               </div>
//                             </div>

//                             <div className="text-xs text-gray-500 space-y-1">
//                               <div>Size: {formatFileSize(file.size)}</div>
//                               <div>Type: {file.mimetype?.split("/")[1] || "unknown"}</div>
//                               <div>Uploaded: {new Date(file.uploadedAt).toLocaleTimeString()}</div>
//                               {file.uploadedBy && <div>By: {file.uploadedBy}</div>}
//                             </div>

//                             {file.notes && (
//                               <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
//                                 <strong>Notes:</strong> {file.notes}
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="flex items-center justify-center h-full">
//             <div className="text-gray-400 text-lg">Select a project to view details</div>
//           </div>
//         )}
//       </div>

//       {/* Modals */}
//       {showForm && <ProjectForm project={editingProject} onClose={handleFormClose} onSuccess={handleFormSuccess} />}

//       {showShareModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-lg font-semibold mb-4">Share Project</h3>
//             <p className="text-sm text-gray-600 mb-4">
//               Share this link to allow others to upload files to your project.
//               <br />
//               <strong>Expires on:</strong> {shareExpiry}
//             </p>
//             <div className="flex gap-2 mb-4">
//               <input
//                 type="text"
//                 value={shareUrl}
//                 readOnly
//                 className="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50"
//               />
//               <button
//                 onClick={copyToClipboard}
//                 className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
//               >
//                 Copy
//               </button>
//             </div>
//             <button
//               onClick={() => setShowShareModal(false)}
//               className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       {showImageDownloadModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h3 className="text-lg font-semibold mb-4">Download Images</h3>
//             <p className="text-sm text-gray-600 mb-4">
//               You have selected {getSelectedImages().length} image(s). Choose the format for images:
//             </p>

//             <div className="space-y-3 mb-6">
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="imageFormat"
//                   value="original"
//                   checked={selectedImageFormat === "original"}
//                   onChange={(e) => setSelectedImageFormat(e.target.value)}
//                   className="mr-2"
//                 />
//                 Original Format
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="imageFormat"
//                   value="jpg"
//                   checked={selectedImageFormat === "jpg"}
//                   onChange={(e) => setSelectedImageFormat(e.target.value)}
//                   className="mr-2"
//                 />
//                 JPG
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="imageFormat"
//                   value="png"
//                   checked={selectedImageFormat === "png"}
//                   onChange={(e) => setSelectedImageFormat(e.target.value)}
//                   className="mr-2"
//                 />
//                 PNG
//               </label>
//               <label className="flex items-center">
//                 <input
//                   type="radio"
//                   name="imageFormat"
//                   value="webp"
//                   checked={selectedImageFormat === "webp"}
//                   onChange={(e) => setSelectedImageFormat(e.target.value)}
//                   className="mr-2"
//                 />
//                 WebP
//               </label>
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={downloadImages}
//                 disabled={downloadingImages}
//                 className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
//               >
//                 {downloadingImages ? "Downloading..." : "Download All"}
//               </button>
//               <button
//                 onClick={() => setShowImageDownloadModal(false)}
//                 className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Projects


"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import ProjectForm from "../components/ProjectForm"
import { useAuth } from "../context/AuthContex"
import { FiEdit2, FiTrash2, FiShare2, FiMoreVertical, FiInfo } from "react-icons/fi"
import { Phone, Globe, Lock, Ban } from "lucide-react"


const Projects = () => {
  // Project List State
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [shareExpiry, setShareExpiry] = useState("")
  const [shareLoading, setShareLoading] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [currentProjectInfo, setCurrentProjectInfo] = useState(null)
  const actionMenuRef = useRef(null)

  // Project View State
  const [projectDetails, setProjectDetails] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingFileName, setEditingFileName] = useState(null)
  const [newFileName, setNewFileName] = useState("")
  const [showImageDownloadModal, setShowImageDownloadModal] = useState(false)
  const [selectedImageFormat, setSelectedImageFormat] = useState("original")
  const [downloadingImages, setDownloadingImages] = useState(false)

  const { user } = useAuth()

  // Fetch all projects
  useEffect(() => {
    fetchProjects()
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // Filter projects
  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, filterType])

  // Handle clicks outside action menu
  const handleClickOutside = (event) => {
    if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
      setShowActionMenu(null)
      document.removeEventListener('click', handleClickOutside)
    }
  }

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

  const filterProjects = () => {
    let filtered = projects

    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.details.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter((project) => project.type === filterType)
    }

    setFilteredProjects(filtered)
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
    return (parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i])
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
    if (!projectDetails?.files) return []
    return projectDetails.files.filter((file) => selectedFiles.includes(file._id) && isImageFile(file.mimetype))
  }

  const getSelectedNonImages = () => {
    if (!projectDetails?.files) return []
    return projectDetails.files.filter((file) => selectedFiles.includes(file._id) && !isImageFile(file.mimetype))
  }

  const handleFileSelect = (fileId) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const handleSelectAll = () => {
    if (!projectDetails?.files) return
    if (selectedFiles.length === projectDetails.files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(projectDetails.files.map((file) => file._id))
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

  const startEditFileName = (file) => {
    setEditingFileName(file._id)
    setNewFileName(file.displayName)
  }

  const downloadFile = async (fileId, fileName) => {
    if (!selectedProject) return
    try {
      const response = await axios.get(
        `http://localhost:5000/api/projects/${selectedProject}/files/${fileId}/download`,
        { responseType: "blob" }
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
          0.9
        )
      }

      img.src = URL.createObjectURL(imageBlob)
    })
  }

  const downloadImages = async () => {
    const selectedImages = getSelectedImages()
    if (selectedImages.length === 0 || !selectedProject) return

    setDownloadingImages(true)

    try {
      for (const image of selectedImages) {
        const response = await axios.get(
          `http://localhost:5000/api/projects/${selectedProject}/files/${image._id}/download`,
          { responseType: "blob" }
        )

        let finalBlob = response.data
        let finalFileName = image.displayName

        if (selectedImageFormat !== "original") {
          const converted = await convertImageFormat(response.data, selectedImageFormat, image.displayName)
          finalBlob = converted.blob
          finalFileName = converted.fileName
        }

        const url = window.URL.createObjectURL(finalBlob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", finalFileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)

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

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowForm(true)
    setShowActionMenu(null)
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
    setShowActionMenu(null)
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
      setShowActionMenu(null)
    }
  }

  const handleInfo = (project) => {
    setCurrentProjectInfo({
      createdBy: project.createdByType === "admin" ? "Admin" : project.createdBy.username,
      createdAt: new Date(project.createdAt).toLocaleDateString()
    })
    setShowInfoModal(true)
    setShowActionMenu(null)
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

  const getTypeIcon = (type) => {
    switch (type) {
      case "public":
        return <Globe size={16} className="text-green-500" title="Public" />
      case "auth":
        return <Lock size={16} className="text-yellow-500" title="Auth" />
      case "private":
        return <Ban size={16} className="text-red-500" title="Private" />
      default:
        return <span className="text-gray-500" title="Unknown">❓</span>
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

  const toggleActionMenu = (projectId, e) => {
    e.stopPropagation()
    if (showActionMenu === projectId) {
      setShowActionMenu(null)
      document.removeEventListener('click', handleClickOutside)
    } else {
      setShowActionMenu(projectId)
      document.addEventListener('click', handleClickOutside)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Loading projects...</div>
      </div>
    )
  }

  const fileGroups = projectDetails?.files ? groupFilesByDate(projectDetails.files) : {}
  const totalFiles = projectDetails?.files?.length || 0
  const totalSize = projectDetails?.files?.reduce((sum, file) => sum + file.size, 0) || 0
  const canManageFiles = user?.role === "admin" || projectDetails?.createdBy._id === user?.id

  return (
    <div className="flex h-full">
      {/* Left Panel - Project List */}
      <div className="w-[30%] border-r border-gray-200 pr-4 overflow-y-auto">
        <div className="grid grid-cols-3 items-center mb-2 gap-4">
          <div></div>
          <h2 className="text-xl font-bold text-gray-900 mt-1">Projects</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none  mt-2 text-sm"
          >
            Create Project
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 m-3">
          <div className="flex-1 w-full">
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


        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {projects.length === 0 ? "No projects yet. Create your first project!" : "No projects match your search."}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const canEdit = user.role === "admin" || project.createdBy._id === user.id
              const canDelete = user.role === "admin" || project.createdBy._id === user.id
              const canShare = (project.type === "public" || project.type === "auth") && canEdit

              return (
                <div
                  key={project._id}
                  className={`bg-white border-b border-gray-400 hover:bg-gray-100 duration-200 ml-2 cursor-pointer mb-0 rounded-md ${selectedProject === project._id ? ' bg-blue-100' : ''}`}

                  onClick={() => handleProjectClick(project)}
                >
                  <div className="p-1 ml-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1 ">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        {getTypeIcon(project.type)}
                      </div>
                      <div className="relative" ref={actionMenuRef}>
                        <button
                          onClick={(e) => toggleActionMenu(project._id, e)}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiMoreVertical />
                        </button>
                        {showActionMenu === project._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInfo(project)
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
                                  handleEdit(project)
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
                                  handleDelete(project._id)
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
                                  handleShare(project._id)
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

                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center text-gray-500">
                        <Phone size={16} className="mr-1 text-blue-400" />
                        {project.phoneNumber}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Panel - Project Details */}
      <div className="w-[70%] pl-6 overflow-y-auto">
        {selectedProject && projectDetails ? (
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
                  >
                    ← Back to Projects
                  </button>
                  <div className="flex gap-2">
                    {projectDetails.shareLink && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Shared</span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${projectDetails.type === "public"
                        ? "bg-green-100 text-green-800"
                        : projectDetails.type === "auth"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {projectDetails.type.toUpperCase()}
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">{projectDetails.name}</h1>
                <p className="text-gray-600 mb-2">{projectDetails.details}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span> {projectDetails.phoneNumber}
                  </div>
                  <div>
                    <span className="font-medium">Created by:</span>{" "}
                    {projectDetails.createdByType === "admin" ? "Admin" : projectDetails.createdBy.username}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(projectDetails.createdAt).toLocaleDateString()}
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
                      <button
                        onClick={handleSelectAll}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        {selectedFiles.length === totalFiles ? "Deselect All" : "Select All"}
                      </button>
                      {selectedFiles.length > 0 && (
                        <div className="text-sm text-gray-600">
                          {selectedFiles.length} file(s) selected
                          {getSelectedImages().length > 0 && (
                            <span className="ml-2 text-blue-600">({getSelectedImages().length} images)</span>
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
                    {projectDetails.shareLink && (
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
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${selectedFiles.includes(file._id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
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
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-lg">Select a project to view details</div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && <ProjectForm project={editingProject} onClose={handleFormClose} onSuccess={handleFormSuccess} />}

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

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Created by:</span> {currentProjectInfo?.createdBy}
              </div>
              <div>
                <span className="font-medium">Created on:</span> {currentProjectInfo?.createdAt}
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full mt-6 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showImageDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Download Images</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have selected {getSelectedImages().length} image(s). Choose the format for images:
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

export default Projects