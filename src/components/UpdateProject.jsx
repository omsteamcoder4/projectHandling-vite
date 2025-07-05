import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUpload, FiTrash2, FiEdit2, FiDownload, FiCheck, FiX } from 'react-icons/fi';


const FileUploadPage = () => {
  const { id } = useParams();
  const token = new URLSearchParams(window.location.search).get('token');
  console.log(token);
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [tempName, setTempName] = useState('');
  

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const url = token
          ? `http://localhost:5000/api/projects/${id}?token=${token}`
          : `http://localhost:5000/api/projects/${id}`;

        const { data } = await axios.get(url, {
          headers: token ? {} : {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!data.success) throw new Error(data.message || 'Failed to fetch files');

        setFiles(data.data.images || []);
      } catch (err) {
        toast.error(err.response?.data?.error || err.message);
      }
    };

    fetchFiles();
  }, [id, token]);

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await processFiles(selectedFiles);
  };

  const processFiles = async (fileList) => {
    const validFiles = fileList.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!validTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File too large (max 5MB): ${file.name}`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('files', file);
      });

      const { data } = await axios.put(
        `http://localhost:5000/api/projects/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: token ? undefined : `Bearer ${localStorage.getItem('token')}`
          },
          params: token ? { token } : {}
        }
      );

      if (data.success) {
        toast.success('Files uploaded successfully');
        setFiles(data.data.images || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileUrl) => {
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/projects/${id}/remove-file`,
        { fileUrl },
        {
          headers: {
            Authorization: token ? undefined : `Bearer ${localStorage.getItem('token')}`
          },
          params: token ? { token } : {}
        }
      );

      if (data.success) {
        toast.success('File removed successfully');
        setFiles(data.data.images || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove file');
    }
  };

  const startEditing = (fileUrl, currentName) => {
    setEditingName(fileUrl);
    setTempName(currentName);
  };

  const saveFileName = async () => {
    if (!tempName.trim()) {
      toast.error('File name cannot be empty');
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/projects/${id}/rename-file`,
        { 
          fileUrl: editingName,
          newName: tempName
        },
        {
          headers: {
            Authorization: token ? undefined : `Bearer ${localStorage.getItem('token')}`
          },
          params: token ? { token } : {}
        }
      );

      if (data.success) {
        toast.success('File renamed successfully');
        setFiles(data.data.images || []);
        setEditingName(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to rename file');
    }
  };

  const getFileNameFromUrl = (url) => {
    const fileName = url.split('/').pop();
    return fileName.replace(/\.[^/.]+$/, ""); // Remove extension
  };

  const downloadFile = (fileUrl) => {
    window.open(`http://localhost:5000${fileUrl}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Activity</h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-700 mb-4">Yesterday</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-gray-600">Expires in 6d ▼ • {files.length} Files • {calculateTotalSize(files)}</span>
              </div>
              <button 
                className="text-blue-600 font-medium"
                onClick={() => {
                  files.forEach(file => downloadFile(file));
                }}
              >
                Download All
              </button>
            </div>
          </div>

          <div 
            className="border-2 border-dashed border-gray-300 rounded-md p-6 mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <FiUpload className="text-gray-400 text-3xl" />
              <p className="text-sm text-gray-600">
                Drag & drop files here, or click to select
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.doc,.docx"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </label>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Solutions</h3>
              <div className="space-y-2">
                {files.map((fileUrl, index) => {
                  const fileName = getFileNameFromUrl(fileUrl);
                  const isImage = /\.(jpeg|jpg|png|gif|webp)$/i.test(fileUrl);
                  const fileExtension = fileUrl.split('.').pop();
                  const fileSize = getFileSizeFromUrl(fileUrl); // You'll need to implement this

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        {isImage ? (
                          <img 
                            src={`http://localhost:5000${fileUrl}`} 
                            alt={fileName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded">
                            <span className="text-xs">{fileExtension}</span>
                          </div>
                        )}
                        
                        <div>
                          {editingName === fileUrl ? (
                            <div className="flex items-center">
                              <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="border rounded px-2 py-1 mr-2"
                              />
                              <button 
                                onClick={saveFileName}
                                className="text-green-600"
                              >
                                <FiCheck />
                              </button>
                              <button 
                                onClick={() => setEditingName(null)}
                                className="text-red-600 ml-1"
                              >
                                <FiX />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="font-medium">{fileName}</span>
                              <button 
                                onClick={() => startEditing(fileUrl, fileName)}
                                className="text-gray-500 ml-2"
                              >
                                <FiEdit2 size={14} />
                              </button>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {fileExtension.toUpperCase()} • {fileSize}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => downloadFile(fileUrl)}
                          className="text-blue-600"
                          title="Download"
                        >
                          <FiDownload />
                        </button>
                        <button 
                          onClick={() => deleteFile(fileUrl)}
                          className="text-red-600"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function calculateTotalSize(files) {
  // This is a placeholder - you'll need to get actual file sizes from your backend
  const totalBytes = files.length * 1024 * 1024; // Mock calculation
  if (totalBytes < 1024 * 1024) {
    return `${Math.round(totalBytes / 1024)}KB`;
  }
  return `${Math.round(totalBytes / (1024 * 1024))}MB`;
}

function getFileSizeFromUrl(url) {
  // This is a placeholder - you'll need to get actual file sizes from your backend
  const mockSize = Math.random() * 2 + 0.5; // 0.5-2.5MB
  return `${mockSize.toFixed(2)}MB`;
}

export default FileUploadPage;