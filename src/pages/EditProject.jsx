// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import { FiUpload, FiX, FiSave, FiLink, FiLock, FiUser, FiGlobe } from "react-icons/fi";
// import axios from "axios";
// import { useAuth } from "../components/AuthContext";

// const EditProject = () => {
//   const { id } = useParams();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [project, setProject] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     name: "",
//     details: "",
//     mobile: "",
//     images: []
//   });
//   const [newImages, setNewImages] = useState([]);
//   const [accessType, setAccessType] = useState(null);
//   const [shareLink, setShareLink] = useState("");
//   const [showShareDialog, setShowShareDialog] = useState(false);
//   const [shareAccess, setShareAccess] = useState("auth");

//   useEffect(() => {
//     const fetchProject = async () => {
//       try {
//         const token = new URLSearchParams(window.location.search).get('token');
//         const config = token ? { params: { token } } : {};
        
//         const response = await axios.get(
//           `http://localhost:5000/api/projects/${id}`,
//           config
//         );
        
//         setProject(response.data.data);
//         setFormData({
//           name: response.data.data.name,
//           details: response.data.data.details || "",
//           mobile: response.data.data.mobile,
//           images: response.data.data.images || []
//         });
//         setAccessType(response.data.data.accessType);
//       } catch (error) {
//         toast.error(error.response?.data?.error || "Failed to load project");
//         navigate("/projects");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProject();
//   }, [id, navigate]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleImageChange = (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length + formData.images.length > 5) {
//       toast.error("Maximum 5 images allowed");
//       return;
//     }
//     setNewImages(files);
//   };

//   const removeImage = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       images: prev.images.filter((_, i) => i !== index)
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     const token = new URLSearchParams(window.location.search).get('token');
//     const formDataToSend = new FormData();
    
//     newImages.forEach(file => formDataToSend.append("images", file));
//     formDataToSend.append("name", formData.name);
//     formDataToSend.append("details", formData.details);
//     formDataToSend.append("mobile", formData.mobile);
    
//     try {
//       const config = {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: token ? "" : `Bearer ${localStorage.getItem("token")}`
//         }
//       };

//       const response = await axios.put(
//         `http://localhost:5000/api/projects/${id}${token ? `?token=${token}` : ''}`,
//         formDataToSend,
//         config
//       );

//       toast.success("Project updated successfully!");
//       setProject(response.data.data);
//       setNewImages([]);
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Update failed");
//     }
//   };

//   const generateShareLink = async () => {
//     try {
//       const response = await axios.post(
//         `http://localhost:5000/api/projects/${id}/share`,
//         { access: shareAccess },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`
//           }
//         }
//       );

//       setShareLink(response.data.data.url);
//       toast.success("Share link generated!");
//     } catch (error) {
//       toast.error(error.response?.data?.error || "Failed to generate link");
//     }
//   };

//   if (loading) return <div className="text-center py-8">Loading...</div>;
//   if (!project) return <div className="text-center py-8">Project not found</div>;

//   const canEdit = !accessType || 
//                  (accessType === 'auth' && user) || 
//                  (accessType === 'public') ||
//                  (user && (user.role === 'admin' || user._id === project.createdBy?._id));

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4">
//       <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
//         <div className="bg-blue-600 px-6 py-4 text-white">
//           <h1 className="text-2xl font-bold">
//             {accessType ? `Shared Project (${accessType} access)` : "Edit Project"}
//           </h1>
//           {project.updatedBy && (
//             <p className="text-sm text-blue-100 mt-1">
//               Last updated by: {project.updatedBy}
//             </p>
//           )}
//         </div>

//         <div className="p-6">
//           {!canEdit && (
//             <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
//               <div className="flex items-center">
//                 <FiLock className="h-5 w-5 text-yellow-400 mr-3" />
//                 <p className="text-sm text-yellow-700">
//                   You have view-only access to this project
//                 </p>
//               </div>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Project Name
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={!canEdit}
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Description
//               </label>
//               <textarea
//                 name="details"
//                 value={formData.details}
//                 onChange={handleChange}
//                 rows="4"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={!canEdit}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Contact Number
//               </label>
//               <input
//                 type="text"
//                 name="mobile"
//                 value={formData.mobile}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={!canEdit}
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Project Images (Max 5)
//               </label>
//               <div className="flex flex-wrap gap-3 mt-2">
//                 {formData.images.map((img, index) => (
//                   <div key={index} className="relative">
//                     <img 
//                       src={`http://localhost:5000${img}`} 
//                       alt={`Project ${index}`}
//                       className="h-24 w-24 object-cover rounded border border-gray-200"
//                     />
//                     {canEdit && (
//                       <button
//                         type="button"
//                         onClick={() => removeImage(index)}
//                         className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
//                       >
//                         <FiX size={14} />
//                       </button>
//                     )}
//                   </div>
//                 ))}
//               </div>
              
//               {canEdit && (
//                 <div className="mt-3">
//                   <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
//                     <FiUpload className="mr-2" />
//                     Upload Images
//                     <input
//                       type="file"
//                       onChange={handleImageChange}
//                       className="sr-only"
//                       multiple
//                       accept="image/*"
//                     />
//                   </label>
//                   {newImages.length > 0 && (
//                     <p className="mt-2 text-sm text-gray-500">
//                       {newImages.length} new image(s) ready to upload
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>

//             {!accessType && (user?.role === 'admin' || user?._id === project.createdBy?._id) && (
//               <div className="border-t border-gray-200 pt-6">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-lg font-medium text-gray-900">Share Project</h3>
//                   <button
//                     type="button"
//                     onClick={() => setShowShareDialog(true)}
//                     className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//                   >
//                     <FiLink className="mr-2" />
//                     Create Share Link
//                   </button>
//                 </div>

//                 {showShareDialog && (
//                   <div className="mt-4 bg-gray-50 p-4 rounded-md">
//                     <div className="space-y-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Access Type
//                         </label>
//                         <div className="space-y-2">
//                           <div className="flex items-center">
//                             <input
//                               id="public-access"
//                               name="access-type"
//                               type="radio"
//                               checked={shareAccess === 'public'}
//                               onChange={() => setShareAccess('public')}
//                               className="h-4 w-4 text-blue-600 focus:ring-blue-500"
//                             />
//                             <label htmlFor="public-access" className="ml-2 flex items-center text-sm text-gray-700">
//                               <FiGlobe className="mr-1" /> Public - Anyone with link can edit
//                             </label>
//                           </div>
//                           <div className="flex items-center">
//                             <input
//                               id="auth-access"
//                               name="access-type"
//                               type="radio"
//                               checked={shareAccess === 'auth'}
//                               onChange={() => setShareAccess('auth')}
//                               className="h-4 w-4 text-blue-600 focus:ring-blue-500"
//                             />
//                             <label htmlFor="auth-access" className="ml-2 flex items-center text-sm text-gray-700">
//                               <FiUser className="mr-1" /> Authenticated - Only logged-in users
//                             </label>
//                           </div>
//                           <div className="flex items-center">
//                             <input
//                               id="private-access"
//                               name="access-type"
//                               type="radio"
//                               checked={shareAccess === 'private'}
//                               onChange={() => setShareAccess('private')}
//                               className="h-4 w-4 text-blue-600 focus:ring-blue-500"
//                             />
//                             <label htmlFor="private-access" className="ml-2 flex items-center text-sm text-gray-700">
//                               <FiLock className="mr-1" /> Private - View only
//                             </label>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex space-x-3">
//                         <button
//                           type="button"
//                           onClick={generateShareLink}
//                           className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//                         >
//                           Generate Link
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setShowShareDialog(false)}
//                           className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
//                         >
//                           Cancel
//                         </button>
//                       </div>

//                       {shareLink && (
//                         <div className="mt-3">
//                           <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Share Link
//                           </label>
//                           <div className="flex rounded-md shadow-sm">
//                             <input
//                               type="text"
//                               readOnly
//                               value={shareLink}
//                               className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 navigator.clipboard.writeText(shareLink);
//                                 toast.success("Link copied to clipboard!");
//                               }}
//                               className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 hover:bg-gray-100"
//                             >
//                               Copy
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {canEdit && (
//               <div className="flex justify-end">
//                 <button
//                   type="submit"
//                   className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//                 >
//                   <FiSave className="mr-2" />
//                   Save Changes
//                 </button>
//               </div>
//             )}
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditProject;